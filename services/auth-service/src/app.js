const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const connectMongo = require('../../../shared/mongo');
const logger = require('../../../shared/logger');
const config = require('../../../config');

async function start() {
  await connectMongo();

  const app = express();

  // Security
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Basic rate limit (prevents OTP abuse)
  app.use(rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX
  }));

  // Health check
  app.get('/health', (req, res) =>
    res.json({ status: 'ok', uptime: process.uptime() })
  );
  app.use('/auth', require('./routes/auth.routes'));

  // Start server
  app.listen(config.PORT, () =>
    logger.info(`[auth-service] running on port ${config.PORT}`)
  );
}

start();
