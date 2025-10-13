const Video = require('../models/Video');

exports.saveVideoMetadata = async (req, res) => {
  const { channelId, title, description, privacy, filePath } = req.body;

  try {
    const newVideo = new Video({
      user: req.user.id,
      channelId,
      title,
      description,
      privacy,
      filePath,
    });

    const video = await newVideo.save();
    res.json(video);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

const { google } = require('googleapis');
const fs = require('fs');
const User = require('../models/User');

exports.uploadToYouTube = async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ msg: 'Video not found' });
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.googleAccessToken) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: user.googleAccessToken });

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });

    const videoFilePath = video.filePath;

    const response = await youtube.videos.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: video.title,
          description: video.description,
        },
        status: {
          privacyStatus: video.privacy,
        },
      },
      media: {
        body: fs.createReadStream(videoFilePath),
      },
    });

    video.status = 'completed';
    video.youtubeVideoId = response.data.id;
    await video.save();

    // Optionally, delete the temporary file after upload
    fs.unlinkSync(videoFilePath);

    res.json(response.data);
  } catch (err) {
    console.error('YouTube upload error:', err.message);
    res.status(500).send('Server Error');
  }
};
