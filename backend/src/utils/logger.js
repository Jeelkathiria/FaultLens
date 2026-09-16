const winston = require('winston');
const env = require('../config/env');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  env.isProduction
    ? winston.format.json()
    : winston.format.printf(({ level, message, timestamp, stack }) => {
        return `[${timestamp}] [${level.toUpperCase()}]: ${stack || message}`;
      })
);

const logger = winston.createLogger({
  level: env.isProduction ? 'info' : 'debug',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: env.isProduction
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp, stack }) => {
              return `[${timestamp}] ${level}: ${stack || message}`;
            })
          )
    })
  ]
});

module.exports = logger;
