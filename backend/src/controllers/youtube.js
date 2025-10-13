const { google } = require('googleapis');
const User = require('../models/User');

exports.getChannels = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !user.googleAccessToken) {
      return res.status(401).json({ msg: 'Not authorized to access this resource' });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: user.googleAccessToken });

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

exports.disconnectAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.googleId = undefined;
    user.googleAccessToken = undefined;
    user.googleRefreshToken = undefined;

    await user.save();

    res.json({ msg: 'YouTube account disconnected successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
