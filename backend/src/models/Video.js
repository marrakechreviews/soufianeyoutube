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
  filePath: {
    type: String,
    required: true,
  },
  privacy: {
    type: String,
    enum: ['private', 'unlisted', 'public'],
    default: 'private',
  },
  publishAt: {
    type: Date,
  },
  playlistId: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'queued', 'uploading', 'processing', 'published', 'failed'],
    default: 'pending',
  },
  youtubeVideoId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Video', VideoSchema);
