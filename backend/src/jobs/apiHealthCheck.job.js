const { Queue, Worker } = require('bullmq');
const env = require('../config/env');
const logger = require('../utils/logger');
const prisma = require('../config/database');
const apiHealthChecker = require('../services/apiHealthChecker.service');
const { isRedisAvailable } = require('../config/redis');

const QUEUE_NAME = 'api-health-check';
let queue = null;
let worker = null;
let fallbackInterval = null;
let isProcessing = false;

/**
 * Scan all active APIs and execute health check for any API whose monitoring interval is due
 */
async function processHealthCheckBatch() {
  if (isProcessing) {
    logger.debug('Health check batch already in progress, skipping cycle');
    return;
  }

  isProcessing = true;
  try {
    const apis = await prisma.api.findMany({
      include: { website: true }
    });

    const now = Date.now();
    const dueApis = apis.filter((api) => {
      if (!api.lastCheckedAt) return true;
      const intervalSec = Number(api.monitoringInterval) || 60;
      const lastCheckMs = new Date(api.lastCheckedAt).getTime();
      return now - lastCheckMs >= intervalSec * 1000;
    });

    if (dueApis.length === 0) {
      isProcessing = false;
      return;
    }

    logger.debug(`Found ${dueApis.length} APIs due for health check`);

    // Process due APIs concurrently with bounded batching
    const BATCH_SIZE = 5;
    for (let i = 0; i < dueApis.length; i += BATCH_SIZE) {
      const chunk = dueApis.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        chunk.map(async (api) => {
          try {
            await apiHealthChecker.checkApiHealth(api.id);
          } catch (err) {
            logger.error(`Unhandled error checking health for API ${api.id}: ${err.message}`);
          }
        })
      );
    }
  } catch (err) {
    logger.error(`Error in processHealthCheckBatch: ${err.message}`);
  } finally {
    isProcessing = false;
  }
}

/**
 * Initialize BullMQ worker or local timer fallback
 */
function initApiHealthCheckJob() {
  if (isRedisAvailable()) {
    try {
      queue = new Queue(QUEUE_NAME, {
        connection: { url: env.REDIS_URL }
      });

      worker = new Worker(
        QUEUE_NAME,
        async (job) => {
          logger.debug(`Running scheduled API health check job: ${job.name}`);
          await processHealthCheckBatch();
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

      // Repeat health check scan every 15 seconds
      queue
        .add(
          'scan-due-apis',
          {},
          {
            repeat: { every: 15 * 1000 },
            removeOnComplete: true
          }
        )
        .catch((e) => logger.warn(`Queue schedule error: ${e.message}`));

      logger.info('BullMQ API Health Check worker initialized (scan every 15s)');
      return;
    } catch (e) {
      logger.warn(`BullMQ init failed for API health checker, using timer fallback: ${e.message}`);
    }
  }

  // Fallback timer when Redis is offline or not installed
  fallbackInterval = setInterval(processHealthCheckBatch, 15 * 1000);
  logger.info('Local API Health Check timer initialized (every 15s)');
}

module.exports = {
  initApiHealthCheckJob,
  processHealthCheckBatch
};
