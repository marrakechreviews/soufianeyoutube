const { google } = require('googleapis');
const User = require('../models/User');
const GoogleAccount = require('../models/GoogleAccount');

exports.getGoogleAccounts = async (req, res) => {
  try {
    const accounts = await GoogleAccount.find({ user: req.user.id }).select('-accessToken -refreshToken');
    res.json(accounts);
  } catch (err) {
    console.error(err.message);
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
      return res.status(404).json({ msg: 'Account not found' });
    }
    await account.remove();
    res.json({ msg: 'Account disconnected' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getChannels = async (req, res) => {
  try {
    const { googleAccountId } = req.query;
    const googleAccount = await GoogleAccount.findOne({
      _id: googleAccountId,
      user: req.user.id,
    });

    if (!googleAccount || !googleAccount.accessToken) {
      return res.status(401).json({ msg: 'Google account not authorized' });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: googleAccount.accessToken });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
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

exports.getPlaylists = async (req, res) => {
  // ... (implementation needed)
};

exports.createPlaylist = async (req, res) => {
  // ... (implementation needed)
};
