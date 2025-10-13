const express = require('express');
const router = express.Router();
const { uploadVideo } = require('../controllers/upload');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

// @route   POST api/upload
// @desc    Upload a video file
// @access  Private
const auth = require('../middleware/auth');
router.post('/', auth, upload.single('video'), uploadVideo);

module.exports = router;
