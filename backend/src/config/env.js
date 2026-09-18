const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/faultlens',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'faultlens_super_secret_jwt_key_development_2026_secure',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  ANOMALY_SENSITIVITY: parseFloat(process.env.ANOMALY_SENSITIVITY || '3.0'),
  CORRELATION_WINDOW_MINUTES: parseInt(process.env.CORRELATION_WINDOW_MINUTES || '60', 10),
  RAW_TELEMETRY_RETENTION_DAYS: parseInt(process.env.RAW_TELEMETRY_RETENTION_DAYS || '7', 10),
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test'
};

module.exports = env;
