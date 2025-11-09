require('../../../config');
const connectMongo = require('../../../shared/mongo');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

const emissionRoutes = require('./routes/emissionRoutes');

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"]
    }
  },
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'greenlaunch-emissions' });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/api/greenlaunch', emissionRoutes);

async function start() {
  await connectMongo();
  const port = 4020;

  app.listen(port, () => {
    console.log(` GreenLaunch running on port ${port}`);
    console.log(`Frontend: http://localhost:${port}`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error('Failed to start GreenLaunch backend:', err);
    process.exit(1);
  });
}

module.exports = app;