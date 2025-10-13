const express = require('express');
const router = express.Router();
const { uploadVideo } = require('../controllers/upload');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

// @route   POST api/upload
// @desc    Upload a video file
// @access  Private
router.post('/', upload.single('video'), uploadVideo);

module.exports = router;
