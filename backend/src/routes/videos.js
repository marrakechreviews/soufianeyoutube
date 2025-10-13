const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { saveVideoMetadata, uploadToYouTube } = require('../controllers/video');

// @route   POST api/videos
// @desc    Save video metadata
// @access  Private
router.post('/', auth, saveVideoMetadata);

// @route   POST api/videos/:videoId/upload
// @desc    Upload video to YouTube
// @access  Private
router.post('/:videoId/upload', auth, uploadToYouTube);

module.exports = router;
