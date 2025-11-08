// shared/mongo.js
const mongoose = require('mongoose');
const logger = require('./logger');
const config = require('../config');

module.exports = async function connectMongo() {
  if (!config.MONGO_URI) {
    throw new Error('[mongo] MONGO_URI is undefined — check your .env and config/index.js');
  }
  mongoose.set('strictQuery', true);
  const autoIndex = config.NODE_ENV !== 'production';
  await mongoose.connect(config.MONGO_URI, { autoIndex });
  logger.info({ autoIndex, uriHost: config.MONGO_URI.split('@')[1]?.split('/')[0] }, '[mongo] connected');
  return mongoose.connection;
};
