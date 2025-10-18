const { Queue } = require('bullmq');

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
};

const videoQueue = new Queue('video-uploads', { connection: redisConnection });

module.exports = videoQueue;
