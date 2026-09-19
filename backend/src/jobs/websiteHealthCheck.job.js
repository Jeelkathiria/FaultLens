const { Queue, Worker } = require('bullmq');
const env = require('../config/env');
const logger = require('../utils/logger');
const prisma = require('../config/database');
const websiteMonitoringService = require('../services/websiteMonitoring.service');
const { isRedisAvailable } = require('../config/redis');

const QUEUE_NAME = 'website-health-check';
let queue = null;
let worker = null;
let fallbackInterval = null;
let isProcessing = false;

/**
 * Scan all active websites and execute HTTP GET checks for any website whose monitoring interval is due
 */
async function processWebsiteHealthCheckBatch() {
  if (isProcessing) {
    logger.debug('Website health check batch already in progress, skipping cycle');
    return;
  }

  isProcessing = true;
  try {
    const websites = await prisma.website.findMany();

    const activeWebsites = websites.filter((w) => w.monitoringEnabled !== false);
    const now = Date.now();

    const dueWebsites = activeWebsites.filter((website) => {
      if (!website.lastCheckedAt) return true;
      const intervalSec = Number(website.monitoringInterval) || 60;
      const lastCheckMs = new Date(website.lastCheckedAt).getTime();
      return now - lastCheckMs >= intervalSec * 1000;
    });

    if (dueWebsites.length === 0) {
      isProcessing = false;
      return;
    }

    logger.debug(`Found ${dueWebsites.length} websites due for HTTP health check`);

    // Process due websites concurrently with bounded batching
    const BATCH_SIZE = 5;
    for (let i = 0; i < dueWebsites.length; i += BATCH_SIZE) {
      const chunk = dueWebsites.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        chunk.map(async (website) => {
          try {
            await websiteMonitoringService.checkWebsite(website.id);
          } catch (err) {
            logger.error(`Error checking website ${website.id} (${website.name}): ${err.message}`);
          }
        })
      );
    }
  } catch (err) {
    logger.error(`Error in processWebsiteHealthCheckBatch: ${err.message}`);
  } finally {
    isProcessing = false;
  }
}

/**
 * Initialize BullMQ worker or local timer fallback for background website monitoring
 */
function initWebsiteHealthCheckJob() {
  if (isRedisAvailable()) {
    try {
      queue = new Queue(QUEUE_NAME, {
        connection: { url: env.REDIS_URL }
      });

      worker = new Worker(
        QUEUE_NAME,
        async (job) => {
          logger.debug(`Running scheduled website health check job: ${job.name}`);
          await processWebsiteHealthCheckBatch();
        },
        { connection: { url: env.REDIS_URL }, concurrency: 1 }
      );

      const { emitInfraEvent } = require('../websocket/socket');
      const infrastructureService = require('../services/infrastructure.service');

      worker.on('active', (job) => {
        emitInfraEvent({
          stage: 'WORKER',
          type: 'JOB_ACTIVE',
          label: `Worker processing job #${job.id} (${job.name})`,
          status: 'active',
          details: { queue: QUEUE_NAME, jobId: job.id, jobName: job.name }
        });
      });

      worker.on('completed', (job) => {
        emitInfraEvent({
          stage: 'PROCESSING',
          type: 'JOB_COMPLETED',
          label: `Completed job #${job.id} on ${QUEUE_NAME}`,
          status: 'success',
          details: { queue: QUEUE_NAME, jobId: job.id }
        });
      });

      worker.on('failed', (job, err) => {
        emitInfraEvent({
          stage: 'PROCESSING',
          type: 'JOB_FAILED',
          label: `Job #${job?.id || 'err'} failed on ${QUEUE_NAME}: ${err?.message || 'Error'}`,
          status: 'error',
          details: { queue: QUEUE_NAME, jobId: job?.id, error: err?.message }
        });
      });

      infrastructureService.registerQueue(QUEUE_NAME, queue, worker);

      // Repeat website check scan every 10 seconds
      queue
        .add(
          'scan-due-websites',
          {},
          {
            repeat: { every: 10 * 1000 },
            removeOnComplete: true
          }
        )
        .catch((e) => logger.warn(`Website queue schedule error: ${e.message}`));

      logger.info('BullMQ Website Health Check worker initialized (scan every 10s)');
      return;
    } catch (e) {
      logger.warn(`BullMQ init failed for Website health checker, using timer fallback: ${e.message}`);
    }
  }

  // Fallback timer when Redis is offline or not installed
  fallbackInterval = setInterval(processWebsiteHealthCheckBatch, 10 * 1000);
  logger.info('Local Website Health Check timer initialized (every 10s)');
}

module.exports = {
  initWebsiteHealthCheckJob,
  processWebsiteHealthCheckBatch
};
