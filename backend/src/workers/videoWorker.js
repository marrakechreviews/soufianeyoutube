const { Worker } = require('bullmq');
const fs = require('fs');
const { google } = require('googleapis');
const Video = require('../models/Video');
const GoogleAccount = require('../models/GoogleAccount');

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
};

const videoWorker = new Worker('video-uploads', async (job) => {
  const { videoId } = job.data;
  console.log(`Processing video upload for videoId: ${videoId}`);

  try {
    const video = await Video.findById(videoId);
    if (!video) {
      throw new Error('Video not found');
    }

    const googleAccount = await GoogleAccount.findById(video.googleAccount);
    if (!googleAccount) {
      throw new Error('Google Account not found');
    }

    video.status = 'uploading';
    await video.save();

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: googleAccount.accessToken,
      refresh_token: googleAccount.refreshToken,
    });

    // Refresh the token if it's about to expire or has expired
    const newTokens = await oauth2Client.getAccessToken();
    if (newTokens.token) {
        googleAccount.accessToken = newTokens.token;
        await googleAccount.save();
        oauth2Client.setCredentials({ access_token: newTokens.token });
    }

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

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

    video.youtubeVideoId = response.data.id;
    video.status = 'published';
    await video.save();

    fs.unlink(video.filePath, (err) => {
      if (err) console.error(`Failed to delete temp file: ${video.filePath}`, err);
    });

    console.log(`Successfully uploaded videoId: ${videoId}`);
  } catch (error) {
    console.error(`Failed to upload videoId: ${videoId}`, error);
    await Video.updateOne({ _id: videoId }, { $set: { status: 'failed' } });
    throw error; // Re-throw the error to let BullMQ know the job failed
  }
}, { connection: redisConnection });

console.log('Video worker started');

module.exports = videoWorker;
