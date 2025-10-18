const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { saveVideoMetadata, bulkPublish } = require('../controllers/videos');

// @route   POST api/videos
// @desc    Save video metadata to the database
// @access  Private
router.post('/', auth, saveVideoMetadata);

// @route   POST api/videos/bulk-publish
// @desc    Publish multiple videos to YouTube
// @access  Private
router.post('/bulk-publish', auth, bulkPublish);

module.exports = router;
