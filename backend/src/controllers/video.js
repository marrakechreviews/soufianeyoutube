const Video = require('../models/Video');

exports.saveVideoMetadata = async (req, res) => {
  const {
    channelId,
    title,
    description,
    privacy,
    filePath,
    publishAt,
    playlistId,
  } = req.body;

  try {
    const newVideo = new Video({
      user: req.user.id,
      channelId,
      title,
      description,
      privacy,
      filePath,
      publishAt,
      playlistId,
    });

    const video = await newVideo.save();
    res.json(video);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.bulkPublish = async (req, res) => {
  const { videoIds } = req.body;
  try {
    // We can trigger the uploads in parallel
    const uploadPromises = videoIds.map((videoId) => {
      // We can reuse the uploadToYouTube logic, but we need to adapt it
      // This is a simplified example. A robust implementation would
      // likely refactor uploadToYouTube to be more reusable.
      return new Promise(async (resolve, reject) => {
        try {
          const fakeReq = { params: { videoId }, user: req.user };
          const fakeRes = {
            json: resolve,
            status: () => ({ json: reject }),
          };
          await exports.uploadToYouTube(fakeReq, fakeRes);
        } catch (err) {
          reject(err);
        }
      });
    });

    await Promise.all(uploadPromises);
    res.json({ msg: 'Bulk publish initiated successfully' });
  } catch (err) {
    console.error('Bulk publish error:', err.message);
    res.status(500).send('Server Error');
  }
};

exports.uploadThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const video = await Video.findById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ msg: 'Video not found' });
    }

    video.thumbnailPath = req.file.path;
    await video.save();

    res.json({
      msg: 'Thumbnail uploaded successfully',
      filePath: req.file.path,
    });
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

    const requestBody = {
      snippet: {
        title: video.title,
        description: video.description,
      },
      status: {
        privacyStatus: video.privacy,
      },
    };

    if (video.publishAt) {
      requestBody.status.publishAt = video.publishAt.toISOString();
    }

    const media = {
      body: fs.createReadStream(videoFilePath),
    };
    if (video.thumbnailPath) {
      media.thumbnail = fs.createReadStream(video.thumbnailPath);
    }

    const response = await youtube.videos.insert({
      part: 'snippet,status',
      requestBody,
      media,
    });

    video.status = 'completed';
    video.youtubeVideoId = response.data.id;
    await video.save();

    // Add to playlist if playlistId is provided
    if (video.playlistId) {
      await youtube.playlistItems.insert({
        part: 'snippet',
        requestBody: {
          snippet: {
            playlistId: video.playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId: response.data.id,
            },
          },
        },
      });
    }

    // Optionally, delete the temporary file after upload
    fs.unlinkSync(videoFilePath);

    res.json(response.data);
  } catch (err) {
    console.error('YouTube upload error:', err.message);
    res.status(500).send('Server Error');
  }
};
