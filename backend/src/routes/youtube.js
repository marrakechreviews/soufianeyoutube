const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getChannels,
  getPlaylists,
  createPlaylist,
  disconnectAccount,
  getGoogleAccounts,
} = require('../controllers/youtube');

// @route   GET api/youtube/channels
// @desc    Get user's YouTube channels
// @access  Private
router.get('/channels', auth, getChannels);

// @route   GET api/youtube/playlists
// @desc    Get user's YouTube playlists for a channel
// @access  Private
router.get('/playlists', auth, getPlaylists);

// @route   POST api/youtube/playlists
// @desc    Create a new YouTube playlist
// @access  Private
router.post('/playlists', auth, createPlaylist);

// @route   GET api/youtube/accounts
// @desc    Get user's connected Google accounts
// @access  Private
router.get('/accounts', auth, getGoogleAccounts);

// @route   DELETE api/youtube/accounts/:accountId
// @desc    Disconnect a Google account
// @access  Private
router.delete('/accounts/:accountId', auth, disconnectAccount);

module.exports = router;
