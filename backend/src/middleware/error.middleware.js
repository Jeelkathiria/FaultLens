const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const env = require('../config/env');

function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected internal server error occurred';
  let details = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Authentication token is invalid';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  } else if (err.code === 'P2002') {
    // Prisma unique constraint violation
    statusCode = 409;
    code = 'DUPLICATE_RESOURCE';
    message = `A resource with this ${err.meta?.target?.[0] || 'field'} already exists`;
  } else if (err.code === 'P2025') {
    // Prisma record not found
    statusCode = 404;
    code = 'RESOURCE_NOT_FOUND';
    message = 'The requested resource was not found';
  }

  // Log error with context
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - ${statusCode} - ${err.message}`, {
      stack: err.stack,
      body: req.body
    });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} - ${statusCode} - ${message}`);
  }

  const response = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(!env.isProduction && statusCode >= 500 && { stack: err.stack })
    }
  };

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
