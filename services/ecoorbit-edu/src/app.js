// const express = require('express');
// const helmet = require('helmet');
// const cors = require('cors');
// const rateLimit = require('express-rate-limit');

// const config = require('../../../config');
// const connectMongo = require('../../../shared/mongo');

// const classesRoutes = require('./routes/classroutes');
// const assignmentsRoutes = require('./routes/assignmentroutes');
// const progressRoutes = require('./routes/progress');
// const scenarioRoutes = require('./routes/scenarioroutes');


// const authz = (req, res, next) => {
//   // TEMPORARY FIX: Use header or default user ID
//   const userId = req.header('x-debug-user-id') || "67a1b2c3d4e5f67890123456";
//   req.user = { sub: userId };
//   console.log(`[AUTH] User ID: ${userId}`); // Debug log
//   next();
// };

// (async () => {
//   await connectMongo();

//   const app = express();
//   app.use(helmet());
//   app.use(cors());
//   app.use(express.json());
//   app.use(rateLimit({ windowMs: 60_000, max: 120 }));

//   app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

//   // protected routes
//   app.use('/api/edu', authz, classesRoutes);
//   app.use('/api/edu',authz,  assignmentsRoutes);
//   app.use('/api/edu',authz, progressRoutes);
//   app.use('/api/edu', authz, scenarioRoutes);
//   app.get('/api/test-scenario', (req, res) => {
//     res.json({ message: 'Scenario route works!' });
//   });

//   app.get('/api/debug-env', (req, res) => {
//     res.json({
//       geminiKeyExists: !!process.env.GEMINI_API_KEY,
//       geminiKey: process.env.GEMINI_API_KEY ? '***' + process.env.GEMINI_API_KEY.slice(-4) : 'Not found',
//       nodeEnv: process.env.NODE_ENV,
//       allEnvKeys: Object.keys(process.env).filter(key => key.includes('GEMINI') || key.includes('GEMINI'))
//     });
//   });

//   app.use((err, req, res, next) => {
//     // simple error handler
//     console.error(err);
//     res.status(err.status || 500).json({ error: 'server_error', details: err.message });
//   });

//   app.listen(4010, () =>
//     console.log(`[ecoorbit-edu] on :${4010}`)
//   );
// })();
// services/ecoorbit-edu/src/index.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const connectMongo = require('../../../shared/mongo');

const classesRoutes = require('./routes/classroutes');
const assignmentsRoutes = require('./routes/assignmentroutes');
const progressRoutes = require('./routes/progress');
const scenarioRoutes = require('./routes/scenarioroutes');

const authz = (req, res, next) => {
  const userId = req.header('x-debug-user-id') || '67a1b2c3d4e5f67890123456';
  req.user = { sub: userId };
  console.log(`[AUTH] User ID: ${userId}`);
  next();
};

(async () => {
  await connectMongo();

  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(rateLimit({ windowMs: 60_000, max: 120 }));

  app.get('/health', (req, res) =>
    res.json({ status: 'ok', uptime: process.uptime() })
  );

  // 🔒 Protect all /api/edu routes in one place
  app.use('/api/edu', authz);
  app.use('/api/edu', classesRoutes);
  app.use('/api/edu', assignmentsRoutes);
  app.use('/api/edu', progressRoutes);
  app.use('/api/edu', scenarioRoutes);

  // Quick-smoke endpoints
  app.get('/api/test-scenario', (req, res) => {
    res.json({ message: 'Scenario route works!' });
  });

  app.get('/api/debug-env', (req, res) => {
    res.json({
      hfKeyExists: !!process.env.HUGGINGFACE_API_KEY,
      hfKeyTail: process.env.HUGGINGFACE_API_KEY ? '***' + process.env.HUGGINGFACE_API_KEY.slice(-4) : 'Not found',
      hfModel: process.env.HF_MODEL || 'google/flan-t5-large',
      nodeEnv: process.env.NODE_ENV,
    });
  });

  // Simple error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({
      error: 'server_error',
      details: err.message,
    });
  });

  const PORT =  4010;
  app.listen(PORT, () =>
    console.log(`[ecoorbit-edu] listening on :${PORT}`)
  );
})();

