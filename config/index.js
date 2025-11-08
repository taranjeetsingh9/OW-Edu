// config/index.js
const path = require('path');

// ALWAYS load the root .env (OW-Edu/.env), regardless of CWD
const envPath = path.resolve(__dirname, '..', '.env');
require('dotenv').config({ path: envPath });

// (optional) quick debug to confirm which .env we loaded
if (!process.env.SILENT_ENV_LOG) {
  console.log('[config] loaded .env from:', envPath);
}

// Light validation helpers
const must = (name) => {
  const v = process.env[name];
  if (!v) {
    console.error(`[config] Missing required env ${name}`);
    process.exit(1);
  }
  return v;
};

const MONGO_URI = must('MONGO_URI');
if (!/^mongodb(\+srv)?:\/\//.test(MONGO_URI)) {
  console.error('[config] MONGO_URI must start with mongodb:// or mongodb+srv://');
  process.exit(1);
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 4000),
  MONGO_URI,
  JWT_SECRET: must('JWT_SECRET'),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  OTP_TTL_SECONDS: Number(process.env.OTP_TTL_SECONDS || 300),
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX || 60),
  SMS_PROVIDER: process.env.SMS_PROVIDER || 'console',
};
