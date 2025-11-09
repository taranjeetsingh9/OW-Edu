// // const express = require('express');
// // const helmet = require('helmet');
// // const cors = require('cors');
// // const rateLimit = require('express-rate-limit');
// // const path = require('path');

// // const connectMongo = require('../../../shared/mongo');

// // const classesRoutes = require('./routes/classroutes');
// // const assignmentsRoutes = require('./routes/assignmentroutes');
// // const progressRoutes = require('./routes/progress');
// // const scenarioRoutes = require('./routes/scenarioroutes');

// // const authz = (req, res, next) => {
// //   const userId = req.header('x-debug-user-id') || '67a1b2c3d4e5f67890123456';
// //   req.user = { sub: userId };
// //   console.log(`[AUTH] User ID: ${userId}`);
// //   next();
// // };

// // (async () => {
// //   await connectMongo();

// //   const app = express();
  
// //   // CORS setup
// //   app.use(cors({
// //     origin: true,
// //     credentials: true
// //   }));
  
// //   // Configure helmet for development
// //   app.use(helmet({
// //     contentSecurityPolicy: {
// //       directives: {
// //         defaultSrc: ["'self'"],
// //         styleSrc: ["'self'", "'unsafe-inline'"],
// //         scriptSrc: ["'self'", "'unsafe-inline'"],
// //         scriptSrcAttr: ["'unsafe-inline'"],
// //         imgSrc: ["'self'", "data:", "https:"],
// //         connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"]
// //       }
// //     },
// //     crossOriginEmbedderPolicy: false
// //   }));
  
// //   app.use(express.json());
// //   app.use(rateLimit({ windowMs: 60_000, max: 120 }));

// //   // Serve static files from public folder
// //   app.use(express.static(path.join(__dirname, 'public')));

// //   // ✅ FIXED: Better health check endpoint
// //   app.get('/health', (req, res) => {
// //     res.json({ 
// //       status: 'ok', 
// //       uptime: process.uptime(), 
// //       service: 'eco-orbit-edu',
// //       timestamp: new Date().toISOString(),
// //       message: 'EcoOrbit EDU service is running'
// //     });
// //   });

// //   // Serve the frontend for root route
// //   app.get('/', (req, res) => {
// //     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// //   });

// //   // 🔒 Protect all /api/edu routes in one place
// //   app.use('/api/edu', authz);
// //   app.use('/api/edu', classesRoutes);
// //   app.use('/api/edu', assignmentsRoutes);
// //   app.use('/api/edu', progressRoutes);
// //   app.use('/api/edu', scenarioRoutes);

// //   // Quick-smoke endpoints
// //   app.get('/api/test-scenario', (req, res) => {
// //     res.json({ message: 'Scenario route works!' });
// //   });

// //   // Simple error handler
// //   app.use((err, req, res, next) => {
// //     console.error(err);
// //     res.status(err.status || 500).json({
// //       error: 'server_error',
// //       details: err.message,
// //     });
// //   });

// //   const PORT =  4010;
// //   app.listen(PORT, () =>
// //     console.log(`[ecoorbit-edu] listening on :${PORT}`)
// //   );
// // })();
// const express = require('express');
// const helmet = require('helmet');
// const cors = require('cors');
// const rateLimit = require('express-rate-limit');
// const path = require('path');

// const connectMongo = require('../../../shared/mongo');

// const classesRoutes = require('./routes/classroutes');
// const assignmentsRoutes = require('./routes/assignmentroutes');
// const progressRoutes = require('./routes/progress');
// const scenarioRoutes = require('./routes/scenarioroutes');

// const authz = (req, res, next) => {
//   const userId = req.header('x-debug-user-id') || '67a1b2c3d4e5f67890123456';
//   req.user = { sub: userId };
//   console.log(`[AUTH] User ID: ${userId}`);
//   next();
// };

// (async () => {
//   await connectMongo();

//   const app = express();
  
//   // CORS setup
//   app.use(cors({
//     origin: true,
//     credentials: true
//   }));
  
//   // Configure helmet for development
//   app.use(helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         styleSrc: ["'self'", "'unsafe-inline'"],
//         scriptSrc: ["'self'", "'unsafe-inline'"],
//         scriptSrcAttr: ["'unsafe-inline'"],
//         imgSrc: ["'self'", "data:", "https:"],
//         connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"]
//       }
//     },
//     crossOriginEmbedderPolicy: false
//   }));
  
//   app.use(express.json());
//   app.use(rateLimit({ windowMs: 60_000, max: 120 }));

//   // Serve static files from public folder
//   app.use(express.static(path.join(__dirname, 'public')));

//   // Health check
//   app.get('/health', (req, res) => {
//     res.json({ 
//       status: 'ok', 
//       uptime: process.uptime(), 
//       service: 'eco-orbit-edu',
//       timestamp: new Date().toISOString(),
//       message: 'EcoOrbit EDU service is running'
//     });
//   });

//   // Serve different pages for different routes
//   app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
//   });

//   app.get('/missions', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'missions.html'));
//   });

//   app.get('/classes', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'classes.html'));
//   });

//   app.get('/assignments', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'assignments.html'));
//   });

//   app.get('/progress', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'progress.html'));
//   });

//   app.get('/scenarios', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'scenarios.html'));
//   });

//   // 🔒 Protect all /api/edu routes in one place
//   app.use('/api/edu', authz);
//   app.use('/api/edu', classesRoutes);
//   app.use('/api/edu', assignmentsRoutes);
//   app.use('/api/edu', progressRoutes);
//   app.use('/api/edu', scenarioRoutes);

//   // Quick-smoke endpoints
//   app.get('/api/test-scenario', (req, res) => {
//     res.json({ message: 'Scenario route works!' });
//   });

//   app.get('/api/debug-env', (req, res) => {
//     res.json({
//       hfKeyExists: !!process.env.HUGGINGFACE_API_KEY,
//       hfKeyTail: process.env.HUGGINGFACE_API_KEY ? '***' + process.env.HUGGINGFACE_API_KEY.slice(-4) : 'Not found',
//       hfModel: process.env.HF_MODEL || 'google/flan-t5-large',
//       nodeEnv: process.env.NODE_ENV,
//     });
//   });

//   // Simple error handler
//   app.use((err, req, res, next) => {
//     console.error(err);
//     res.status(err.status || 500).json({
//       error: 'server_error',
//       details: err.message,
//     });
//   });

//   const PORT =  4010;
//   app.listen(PORT, () =>
//     console.log(`[ecoorbit-edu] listening on :${PORT}`)
//   );
// })();

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
  const userId = req.header('x-debug-user-id') || '67a1b2c3d4e5f67890123456';
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
    origin: true,        // allow any localhost frontend
    credentials: true
  }));

  // Helmet
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

  /* ---------------------- HEALTH CHECK ---------------------- */
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'eco-orbit-edu',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      message: 'EcoOrbit EDU running'
    });
  });

  /* ---------------------- FRONTEND PAGES ---------------------- */
  // Homepage → dashboard
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

  // Optional future pages:
  // app.get('/missions', (...) => ...)

  /* ---------------------- PROTECTED API ROUTES ---------------------- */
  app.use('/api/edu', authz);  // protect once

  app.use('/api/edu', classesRoutes);
  app.use('/api/edu', assignmentsRoutes);
  app.use('/api/edu', progressRoutes);
  app.use('/api/edu', scenarioRoutes);

  /* ---------------------- DEBUG ROUTES ---------------------- */
  app.get('/api/test-scenario', (req, res) => {
    res.json({ message: 'Scenario route works!' });
  });

  app.get('/api/debug-env', (req, res) => {
    res.json({
      hfKeyExists: !!process.env.HUGGINGFACE_API_KEY,
      hfKeyTail: process.env.HUGGINGFACE_API_KEY
        ? '***' + process.env.HUGGINGFACE_API_KEY.slice(-4)
        : null,
      hfModel: process.env.HF_MODEL || 'google/flan-t5-large',
      nodeEnv: process.env.NODE_ENV
    });
  });

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
