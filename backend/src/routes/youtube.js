const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getChannels, disconnectAccount } = require('../controllers/youtube');

// @route   GET api/youtube/channels
// @desc    Get user's YouTube channels
// @access  Private
router.get('/channels', auth, getChannels);

// @route   PUT api/youtube/disconnect
// @desc    Disconnect user's YouTube account
// @access  Private
router.put('/disconnect', auth, disconnectAccount);

module.exports = router;
