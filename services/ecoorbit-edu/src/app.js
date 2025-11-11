const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

// DB
const connectMongo = require('../../../shared/mongo');

// Routes
const classesRoutes = require('./routes/classroutes');
const assignmentsRoutes = require('./routes/assignmentroutes');
const progressRoutes = require('./routes/progress');
const scenarioRoutes = require('./routes/scenarioroutes');

// Simple auth middleware
const authz = (req, res, next) => {
  const userId = req.header('x-debug-user-id') || '67a1b2c3d4e5f67890123456'; // just to test user
  req.user = { sub: userId };
  console.log(`[AUTH] User ID: ${userId}`);
  next();
};

(async () => {
  await connectMongo();

  const app = express();

  /* ---------------------- MIDDLEWARE ---------------------- */
  // CORS
  app.use(cors({
    origin: true,        //allow any localhost frontend
    credentials: true
  }));

  // Helmet for security reasons and remove content from headers.
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"]
      }
    },
    crossOriginEmbedderPolicy: false
  }));

  // Parsing + rate limiting
  app.use(express.json());
  app.use(rateLimit({ windowMs: 60_000, max: 120 }));

  /* ---------------------- STATIC FILES ---------------------- */
  app.use(express.static(path.join(__dirname, 'public')));

  /* ---------------------- HEALTH CHECK ---------------------- */ // as it's microservice it help other microservces to check service health.
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'eco-orbit-edu',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      message: 'EcoOrbit EDU running'
    });
  });

  /* ---------------------- FRONTEND PAGES ---------------------- */ // as last moment when backend developer have to do frontend along with integration to other microservices.
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  // Explicit named pages
  app.get('/scenarios', (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'scenarios.html'))
  );

  app.get('/classes', (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'classes.html'))
  );

  app.get('/assignments', (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'assignments.html'))
  );

  app.get('/progress', (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'progress.html'))
  );

  /* ---------------------- PROTECTED API ROUTES ---------------------- */
  app.use('/api/edu', authz);  // protect once to reduce burden

  app.use('/api/edu', classesRoutes);
  app.use('/api/edu', assignmentsRoutes);
  app.use('/api/edu', progressRoutes);
  app.use('/api/edu', scenarioRoutes);

  /* ---------------------- DEBUG ROUTES ---------------------- */
  // app.get('/api/test-scenario', (req, res) => {
  //   res.json({ message: 'Scenario route works!' });
  // });

  /* ---------------------- ERROR HANDLER ---------------------- */
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({
      error: 'server_error',
      details: err.message
    });
  });

  /* ---------------------- SERVER START ---------------------- */
  const PORT = 4010;
  app.listen(PORT, () =>
    console.log(`[ecoorbit-edu] listening on :${PORT}`)
  );
})();
