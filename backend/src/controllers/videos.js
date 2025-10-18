const fs = require('fs');
const { google } = require('googleapis');
const Video = require('../models/Video');
const GoogleAccount = require('../models/GoogleAccount');

// @desc    Save video metadata to the database
exports.saveVideoMetadata = async (req, res) => {
  const {
    title,
    description,
    privacy,
    publishAt,
    playlistId,
    filePath,
    channelId,
    googleAccountId,
  } = req.body;

  try {
    const video = new Video({
      user: req.user.id,
      googleAccount: googleAccountId,
      channelId,
      title,
      description,
      privacy,
      publishAt,
      playlistId,
      filePath,
      status: 'pending',
    });

    await video.save();
    res.status(201).json(video);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Publish multiple videos to YouTube
exports.bulkPublish = async (req, res) => {
  const { videoIds } = req.body;
  const results = {
    success: [],
    failed: [],
  };

  // We will process uploads sequentially for now to avoid overwhelming the API quota
  // In a production app, this should be offloaded to a queue (e.g., BullMQ)
  for (const videoId of videoIds) {
    try {
      const video = await Video.findById(videoId);
      if (!video || video.user.toString() !== req.user.id) {
        console.error(`Video not found or user not authorized for videoId: ${videoId}`);
        results.failed.push({ videoId, reason: 'Not found or unauthorized' });
        continue; // Skip to the next video
      }

      const googleAccount = await GoogleAccount.findById(video.googleAccount);
      if (!googleAccount) {
        video.status = 'failed';
        await video.save();
        console.error(`Google account not found for videoId: ${videoId}`);
        results.failed.push({ videoId, reason: 'Google Account not found' });
        continue;
      }

      // 1. Set up OAuth2 client
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: googleAccount.accessToken });

      // 2. Get YouTube API client
      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

      // 3. Update status to 'uploading'
      video.status = 'uploading';
      await video.save();

      // 4. Perform the upload
      const snippet = {
        title: video.title,
        description: video.description,
        channelId: video.channelId,
      };
      if (video.playlistId) {
        snippet.playlistId = video.playlistId;
      }

      const response = await youtube.videos.insert({
        part: 'snippet,status',
        requestBody: {
          snippet: snippet,
          status: {
            privacyStatus: video.privacy,
            publishAt: video.publishAt,
          },
        },
        media: {
          body: fs.createReadStream(video.filePath),
        },
      });

      // 5. Update video with YouTube ID and set status to 'published'
      video.youtubeVideoId = response.data.id;
      video.status = 'published';
      await video.save();
      results.success.push(videoId);

      // Optional: Clean up the temporary file
      fs.unlink(video.filePath, (err) => {
        if (err) console.error(`Failed to delete temp file: ${video.filePath}`, err);
      });
    } catch (err) {
      console.error(`Error processing video ${videoId}:`, err.message);
      results.failed.push({ videoId, reason: err.message });
      // Attempt to mark the specific video as failed
      await Video.updateOne({ _id: videoId }, { $set: { status: 'failed' } });
    }
  }

  res.status(200).json({
    msg: 'Bulk publish process completed.',
    results,
  });
};
