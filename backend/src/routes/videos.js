const express = require('express');
const router = express.Router();
const {
  getChannelVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  getVideoStats,
} = require('../controllers/videos');
const auth = require('../middleware/auth');

// @route   GET api/videos/stats/:videoId
// @desc    Get video statistics
// @access  Private
router.get('/stats/:videoId', auth, getVideoStats);

// @route   GET api/videos/channel/:channelId
// @desc    Get all videos for a channel
// @access  Private
router.get('/channel/:channelId', auth, getChannelVideos);

// @route   GET api/videos/:videoId
// @desc    Get a single video by ID
// @access  Private
router.get('/:videoId', auth, getVideoById);

// @route   PUT api/videos/:videoId
// @desc    Update a video
// @access  Private
router.put('/:videoId', auth, updateVideo);

// @route   DELETE api/videos/:videoId
// @desc    Delete a video
// @access  Private
router.delete('/:videoId', auth, deleteVideo);

module.exports = router;
