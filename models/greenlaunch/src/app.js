// src/app.js
require('../../../config');
const connectMongo = require('../../../shared/mongo');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const emissionRoutes = require('./routes/emissionRoutes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'greenlaunch-emissions' });
});

app.use('/api/greenlaunch', emissionRoutes);

async function start() {
  await connectMongo();
  const port = process.env.PORT || 4001;

  app.listen(port, () => {
    console.log(`GreenLaunch backend listening on port ${port}`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error('Failed to start GreenLaunch backend:', err);
    process.exit(1);
  });
}

module.exports = app;