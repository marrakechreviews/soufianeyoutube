const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  saveVideoMetadata,
  uploadToYouTube,
  uploadThumbnail,
} = require('../controllers/video');

// @route   POST api/videos
// @desc    Save video metadata
// @access  Private
router.post('/', auth, saveVideoMetadata);

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// @route   POST api/videos/:videoId/upload
// @desc    Upload video to YouTube
// @access  Private
router.post('/:videoId/upload', auth, uploadToYouTube);

// @route   POST api/videos/:videoId/thumbnail
// @desc    Upload a thumbnail for a video
// @access  Private
router.post(
  '/:videoId/thumbnail',
  auth,
  upload.single('thumbnail'),
  uploadThumbnail
);

module.exports = router;
