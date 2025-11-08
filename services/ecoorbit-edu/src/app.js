const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const config = require('../../../config');
const connectMongo = require('../../../shared/mongo');

const classesRoutes = require('./routes/classroutes');
const assignmentsRoutes = require('./routes/assignmentroutes');
const progressRoutes = require('./routes/progress');


const authz = (req, res, next) => {
  // TEMPORARY FIX: Use header or default user ID
  const userId = req.header('x-debug-user-id') || "67a1b2c3d4e5f67890123456";
  req.user = { sub: userId };
  console.log(`[AUTH] User ID: ${userId}`); // Debug log
  next();
};

(async () => {
  await connectMongo();

  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(rateLimit({ windowMs: 60_000, max: 120 }));

  app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  // protected routes
  app.use('/api/edu', authz, classesRoutes);
  app.use('/api/edu',authz,  assignmentsRoutes);
  app.use('/api/edu',authz, progressRoutes);

  app.use((err, req, res, next) => {
    // simple error handler
    console.error(err);
    res.status(err.status || 500).json({ error: 'server_error', details: err.message });
  });

  app.listen(4010, () =>
    console.log(`[ecoorbit-edu] on :${4010}`)
  );
})();
