const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectMongo = require('./shared/mongo');
const logger = require('./shared/logger');
const config = require('./config');

async function start() {
  await connectMongo();

  const app = express();

  // Security
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // EJS Setup
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(express.static(path.join(__dirname, 'public')));

  // Basic rate limit
  app.use(rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX
  }));

  // Health check
  app.get('/health', (req, res) =>
    res.json({ status: 'ok', uptime: process.uptime() })
  );

  // EJS Routes
  app.get('/', (req, res) => {
    res.render('index', { 
      title: 'EcoOrbit - Space Sustainability Platform',
      user: null 
    });
  });

  app.get('/login', (req, res) => {
    res.render('login', { 
      title: 'EcoOrbit - Login',
      user: null,
      error: null,
      step: 'mobile'
    });
  });

  app.get('/dashboard', (req, res) => {
    res.render('dashboard', { 
      title: 'EcoOrbit - Dashboard',
      user: { mobileNumber: '+16471234567' }
    });
  });

  // Your existing auth routes
  app.use('/auth', require('./routes/authroutes'));

  // Start server
  app.listen(config.PORT, () =>
    logger.info(`[eco-orbit] running on port ${config.PORT}`)
  );
}

start();