const { google } = require('googleapis');
const fs = require('fs');
const Video = require('../models/Video');
const GoogleAccount = require('../models/GoogleAccount');

const uploadVideoToYouTube = async (videoId, userId) => {
  const video = await Video.findById(videoId).populate('googleAccount');
  if (!video) {
    throw new Error('Video not found');
  }

  if (video.user.toString() !== userId) {
    throw new Error('User not authorized');
  }

  const googleAccount = video.googleAccount;
  if (!googleAccount || !googleAccount.accessToken) {
    throw new Error('Google account not connected or token is missing');
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: googleAccount.accessToken });

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

  fs.unlinkSync(videoFilePath);
  if (video.thumbnailPath) {
    fs.unlinkSync(video.thumbnailPath);
  }

  return response.data;
};

module.exports = { uploadVideoToYouTube };
