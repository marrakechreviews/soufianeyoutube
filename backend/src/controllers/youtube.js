const { google } = require('googleapis');
const User = require('../models/User');

exports.getChannels = async (req, res) => {
  try {
    const { googleAccountId } = req.query;
    const googleAccount = await GoogleAccount.findOne({
      _id: googleAccountId,
      user: req.user.id, // Ensure the account belongs to the logged-in user
    });

    if (!googleAccount || !googleAccount.accessToken) {
      return res.status(401).json({ msg: 'Google account not found or not authorized' });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: googleAccount.accessToken });

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });

    const response = await youtube.channels.list({
      mine: true,
      part: 'snippet,contentDetails,statistics',
    });

    res.json(response.data.items);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getGoogleAccounts = async (req, res) => {
  try {
    const accounts = await GoogleAccount.find({ user: req.user.id });
    res.json(accounts);
  } catch (err) {
    console.error('Error fetching google accounts:', err.message);
    res.status(500).send('Server Error');
  }
};

exports.createPlaylist = async (req, res) => {
  const { title, description, googleAccountId } = req.body;

  try {
    const googleAccount = await GoogleAccount.findOne({
      _id: googleAccountId,
      user: req.user.id,
    });
    if (!googleAccount || !googleAccount.accessToken) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: googleAccount.accessToken });

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });

    const response = await youtube.playlists.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title,
          description,
        },
        status: {
          privacyStatus: 'private',
        },
      },
    });

    res.json(response.data);
  } catch (err) {
    console.error('Error creating playlist:', err.message);
    res.status(500).send('Server Error');
  }
};

exports.getPlaylists = async (req, res) => {
  try {
    const { googleAccountId } = req.query;
    const googleAccount = await GoogleAccount.findOne({
      _id: googleAccountId,
      user: req.user.id,
    });
    if (!googleAccount || !googleAccount.accessToken) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: googleAccount.accessToken });

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });

    const response = await youtube.playlists.list({
      mine: true,
      part: 'snippet,contentDetails',
    });

    res.json(response.data.items);
  } catch (err) {
    console.error('Error fetching playlists:', err.message);
    res.status(500).send('Server Error');
  }
};

exports.disconnectAccount = async (req, res) => {
  try {
    const account = await GoogleAccount.findOne({
      _id: req.params.accountId,
      user: req.user.id,
    });

    if (!account) {
      return res.status(404).json({ msg: 'Google account not found' });
    }

    await account.remove();

    res.json({ msg: 'Google account disconnected successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
