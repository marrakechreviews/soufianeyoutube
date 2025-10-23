const { google } = require('googleapis');
const GoogleAccount = require('../models/GoogleAccount');

const youtube = google.youtube('v3');

// Helper function to get OAuth2 client
const getOAuth2Client = async (userId) => {
  const googleAccount = await GoogleAccount.findOne({ user: userId });
  if (!googleAccount) {
    throw new Error('Google account not found or linked.');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: googleAccount.accessToken,
    refresh_token: googleAccount.refreshToken,
  });

  return oauth2Client;
};

exports.getChannelVideos = async (req, res) => {
  try {
    const oauth2Client = await getOAuth2Client(req.user.id);
    const { channelId } = req.params;

    const response = await youtube.search.list({
      auth: oauth2Client,
      part: 'snippet',
      channelId: channelId,
      maxResults: 25,
      type: 'video',
      order: 'date',
    });

    res.json(response.data.items);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

exports.getVideoStats = async (req, res) => {
    try {
      const oauth2Client = await getOAuth2Client(req.user.id);
      const { videoId } = req.params;

      const youtubeAnalytics = google.youtubeAnalytics('v2');

      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const formatDate = (date) => date.toISOString().split('T')[0];

      const response = await youtubeAnalytics.reports.query({
        auth: oauth2Client,
        ids: 'channel==MINE',
        startDate: formatDate(thirtyDaysAgo),
        endDate: formatDate(today),
        metrics: 'views,likes,comments',
        filters: `video==${videoId}`,
      });

      const countryResponse = await youtubeAnalytics.reports.query({
        auth: oauth2Client,
        ids: 'channel==MINE',
        startDate: formatDate(thirtyDaysAgo),
        endDate: formatDate(today),
        metrics: 'views',
        dimensions: 'country',
        filters: `video==${videoId}`,
        sort: '-views',
        maxResults: 5,
      });

      res.json({
        basicStats: response.data.rows[0] || [0, 0, 0],
        topCountries: countryResponse.data.rows || [],
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
    }
  };

exports.getVideoById = async (req, res) => {
  try {
    const oauth2Client = await getOAuth2Client(req.user.id);
    const { videoId } = req.params;

    const response = await youtube.videos.list({
      auth: oauth2Client,
      part: 'snippet,statistics,status',
      id: videoId,
    });

    if (response.data.items.length === 0) {
      return res.status(404).json({ msg: 'Video not found' });
    }

    res.json(response.data.items[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};

exports.updateVideo = async (req, res) => {
    try {
      const oauth2Client = await getOAuth2Client(req.user.id);
      const { videoId } = req.params;
      const { title, description, privacyStatus } = req.body;

      const response = await youtube.videos.update({
        auth: oauth2Client,
        part: 'snippet,status',
        resource: {
          id: videoId,
          snippet: {
            title,
            description,
          },
          status: {
            privacyStatus,
          },
        },
      });

      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
    }
  };


exports.deleteVideo = async (req, res) => {
  try {
    const oauth2Client = await getOAuth2Client(req.user.id);
    const { videoId } = req.params;

    await youtube.videos.delete({
      auth: oauth2Client,
      id: videoId,
    });

    res.json({ msg: 'Video deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};
