const { Queue, Worker } = require('bullmq');
const env = require('../config/env');
const logger = require('../utils/logger');
const prisma = require('../config/database');
const metricService = require('../services/metric.service');
const { isRedisAvailable } = require('../config/redis');

const QUEUE_NAME = 'metric-aggregation';
let queue = null;
let worker = null;
let fallbackInterval = null;

/**
 * Execute aggregation across all active APIs
 */
async function processAggregationBatch() {
  try {
    const apis = await prisma.api.findMany({ select: { id: true } });
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    for (const api of apis) {
      await metricService.aggregateRawMetrics(api.id, fiveMinutesAgo, now);
    }
  } catch (err) {
    logger.error('Error in metric aggregation batch:', err);
  }
}

function initMetricAggregationJob() {
  if (isRedisAvailable()) {
    try {
      queue = new Queue(QUEUE_NAME, {
        connection: { url: env.REDIS_URL }
      });

      worker = new Worker(
        QUEUE_NAME,
        async (job) => {
          logger.debug(`Running metric aggregation job: ${job.name}`);
          await processAggregationBatch();
        },
        { connection: { url: env.REDIS_URL } }
      );

      const { emitInfraEvent } = require('../websocket/socket');
      const infrastructureService = require('../services/infrastructure.service');

      worker.on('active', (job) => {
        emitInfraEvent({
          stage: 'WORKER',
          type: 'JOB_ACTIVE',
          label: `Worker aggregating metrics (job #${job.id})`,
          status: 'active',
          details: { queue: QUEUE_NAME, jobId: job.id }
        });
      });

      worker.on('completed', (job) => {
        emitInfraEvent({
          stage: 'PROCESSING',
          type: 'JOB_COMPLETED',
          label: `Metric rollups aggregated and persisted (${QUEUE_NAME})`,
          status: 'success',
          details: { queue: QUEUE_NAME, jobId: job.id }
        });
      });

      worker.on('failed', (job, err) => {
        emitInfraEvent({
          stage: 'PROCESSING',
          type: 'JOB_FAILED',
          label: `Aggregation job failed on ${QUEUE_NAME}: ${err?.message || 'Error'}`,
          status: 'error',
          details: { queue: QUEUE_NAME, jobId: job?.id, error: err?.message }
        });
      });

      infrastructureService.registerQueue(QUEUE_NAME, queue, worker);

      // Schedule recurring job every 60 seconds
      queue.add('aggregate-metrics', {}, {
        repeat: { every: 60 * 1000 },
        removeOnComplete: true
      }).catch((e) => logger.warn(`Queue schedule error: ${e.message}`));

      logger.info('BullMQ Metric Aggregation worker initialized');
      return;
    } catch (e) {
      logger.warn(`BullMQ init failed, using timer fallback: ${e.message}`);
    }
  }

  // Fallback timer when Redis server is not running
  fallbackInterval = setInterval(processAggregationBatch, 60 * 1000);
  logger.info('Local Metric Aggregation timer initialized (every 60s)');
}

module.exports = {
  initMetricAggregationJob,
  processAggregationBatch
};
