const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  googleAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GoogleAccount',
    required: true,
  },
  channelId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  privacy: {
    type: String,
    enum: ['private', 'unlisted', 'public'],
    default: 'private',
  },
  filePath: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'uploading', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  youtubeVideoId: {
    type: String,
  },
  publishAt: {
    type: Date,
  },
  thumbnailPath: {
    type: String,
  },
  playlistId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Video', VideoSchema);
