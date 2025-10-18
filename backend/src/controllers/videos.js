const Video = require('../models/Video');
const videoQueue = require('../config/queue');

// @desc    Save video metadata to the database
exports.saveVideoMetadata = async (req, res) => {
  const {
    title,
    description,
    privacy,
    publishAt,
    playlistId,
    filePath,
    channelId,
    googleAccountId,
  } = req.body;

  try {
    const video = new Video({
      user: req.user.id,
      googleAccount: googleAccountId,
      channelId,
      title,
      description,
      privacy,
      publishAt,
      playlistId,
      filePath,
      status: 'pending',
    });

    await video.save();
    res.status(201).json(video);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Add videos to the upload queue
exports.bulkPublish = async (req, res) => {
  const { videoIds } = req.body;

  try {
    const videos = await Video.find({
      _id: { $in: videoIds },
      user: req.user.id,
    });

    if (videos.length !== videoIds.length) {
      return res.status(404).json({ msg: 'One or more videos not found or unauthorized.' });
    }

    const jobs = videos.map(video => ({
      name: 'upload-video',
      data: { videoId: video._id },
    }));

    await videoQueue.addBulk(jobs);

    await Video.updateMany(
      { _id: { $in: videoIds } },
      { $set: { status: 'queued' } }
    );

    res.json({ msg: 'Videos have been queued for upload.' });
  } catch (err) {
    console.error('Error queuing videos:', err.message);
    res.status(500).send('Server Error');
  }
};
