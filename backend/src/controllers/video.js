const Video = require('../models/Video');
const { uploadVideoToYouTube } = require('../services/youtubeService');

exports.saveVideoMetadata = async (req, res) => {
  // ... (no changes here)
};

exports.uploadThumbnail = async (req, res) => {
  // ... (no changes here)
};

exports.uploadToYouTube = async (req, res) => {
  try {
    const videoData = await uploadVideoToYouTube(req.params.videoId, req.user.id);
    res.json(videoData);
  } catch (err) {
    console.error('YouTube upload error:', err.message);
    res.status(500).send('Server Error');
  }
};

exports.bulkPublish = async (req, res) => {
  const { videoIds } = req.body;
  try {
    const uploadPromises = videoIds.map((videoId) =>
      uploadVideoToYouTube(videoId, req.user.id)
    );

    await Promise.all(uploadPromises);
    res.json({ msg: 'Bulk publish completed successfully' });
  } catch (err) {
    console.error('Bulk publish error:', err.message);
    res.status(500).send('Server Error');
  }
};
