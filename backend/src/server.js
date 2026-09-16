const http = require('http');
const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const prisma = require('./config/database');
const { initSocket } = require('./websocket/socket');
const { initMetricAggregationJob } = require('./jobs/metricAggregation.job');
const { initAnomalyDetectionJob } = require('./jobs/anomalyDetection.job');
const { initCleanupJob } = require('./jobs/cleanup.job');

const httpServer = http.createServer(app);

// Initialize real-time WebSocket server
initSocket(httpServer);

// Start HTTP & WebSocket server
const server = httpServer.listen(env.PORT, () => {
  logger.info(`====================================================`);
  logger.info(`⚡ FaultLens Production Backend is LIVE on port ${env.PORT}`);
  logger.info(`📖 API Docs & Swagger UI: http://localhost:${env.PORT}/api/docs`);
  logger.info(`🩺 Health Check: http://localhost:${env.PORT}/health`);
  logger.info(`🌐 Environment: ${env.NODE_ENV}`);
  logger.info(`====================================================`);

  // Initialize background jobs & workers
  initMetricAggregationJob();
  initAnomalyDetectionJob();
  initCleanupJob();
});

// Graceful shutdown handling
function gracefulShutdown(signal) {
  logger.info(`${signal} signal received. Closing HTTP server and database connections...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Database disconnected.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forceful shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;
