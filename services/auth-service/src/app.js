const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectMongo = require('../../../shared/mongo');
const logger = require('../../../shared/logger');
const config = require('../../../config/index');

async function start() {
  await connectMongo();

  const app = express();

  // CORS - Allow all origins for development
  app.use(cors({
    origin: true,
    credentials: true
  }));

  // FIXED: Configure helmet to allow inline event handlers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'unsafe-inline'"], // ADD THIS LINE
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"]
      }
    },
    crossOriginEmbedderPolicy: false
  }));

  app.use(express.json());

  // Serve static HTML files
  app.use(express.static(path.join(__dirname, 'public')));

  // Basic rate limit
  app.use(rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX
  }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      uptime: process.uptime(), 
      service: 'auth',
      timestamp: new Date().toISOString()
    });
  });

  // Serve HTML pages
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  });

  app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
  });

  // Your existing auth routes
  app.use('/auth', require('./routes/authroutes'));

  // Start server
  app.listen(config.PORT, () => {
    logger.info(`[auth-service] running on port ${config.PORT}`);
    logger.info(`[auth-service] Frontend available at http://localhost:${config.PORT}`);
  });
}

start();