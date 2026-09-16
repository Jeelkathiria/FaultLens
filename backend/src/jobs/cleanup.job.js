const env = require('../config/env');
const logger = require('../utils/logger');
const prisma = require('../config/database');

async function processCleanupJob() {
  try {
    const retentionDays = env.RAW_TELEMETRY_RETENTION_DAYS || 7;
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const deleted = await prisma.requestMetric.deleteMany({
      where: {
        timestamp: { lt: cutoffDate }
      }
    });

    if (deleted.count > 0) {
      logger.info(`Cleaned up ${deleted.count} expired raw telemetry records older than ${retentionDays} days`);
    }
  } catch (err) {
    logger.error('Error running telemetry cleanup job:', err);
  }
}

function initCleanupJob() {
  // Run cleanup once every 24 hours
  setInterval(processCleanupJob, 24 * 60 * 60 * 1000);
  logger.info('Scheduled telemetry cleanup job initialized (runs daily)');
}

module.exports = {
  initCleanupJob,
  processCleanupJob
};
