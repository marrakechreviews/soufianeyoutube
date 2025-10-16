const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const { uploadVideo } = require('../controllers/upload');

const upload = multer({ dest: 'uploads/' });

// @route   POST api/upload
// @desc    Upload a video file for temporary storage
// @access  Private
router.post('/', auth, upload.single('video'), uploadVideo);

module.exports = router;
