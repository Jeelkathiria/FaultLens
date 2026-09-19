const { Queue, Worker } = require('bullmq');
const env = require('../config/env');
const logger = require('../utils/logger');
const prisma = require('../config/database');
const anomalyService = require('../services/anomaly.service');
const { isRedisAvailable } = require('../config/redis');

const QUEUE_NAME = 'anomaly-detection';
let queue = null;
let worker = null;
let fallbackInterval = null;

async function processAnomalyDetectionBatch() {
  try {
    const apis = await prisma.api.findMany({
      include: { website: true }
    });

    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    for (const api of apis) {
      // Fetch latest metrics in last 10m
      const metrics = await prisma.requestMetric.findMany({
        where: { apiId: api.id, timestamp: { gte: tenMinutesAgo } }
      });

      if (metrics.length < 3) continue;

      const total = metrics.length;
      const errors = metrics.filter((m) => m.statusCode >= 400).length;
      const errorRate = +((errors / total) * 100).toFixed(2);

      const latencies = metrics.map((m) => m.responseTime).sort((a, b) => a - b);
      const p95Idx = Math.floor(latencies.length * 0.95);
      const p95Latency = latencies[p95Idx] || latencies[latencies.length - 1];

      await anomalyService.detectAnomalies(api.id, {
        errorRate,
        p95Latency,
        requestCount: total
      });
    }
  } catch (err) {
    logger.error('Error in anomaly detection batch job:', err);
  }
}

function initAnomalyDetectionJob() {
  if (isRedisAvailable()) {
    try {
      queue = new Queue(QUEUE_NAME, {
        connection: { url: env.REDIS_URL }
      });

      worker = new Worker(
        QUEUE_NAME,
        async (job) => {
          logger.debug(`Running anomaly detection job: ${job.name}`);
          await processAnomalyDetectionBatch();
        },
        { connection: { url: env.REDIS_URL } }
      );

      const { emitInfraEvent } = require('../websocket/socket');
      const infrastructureService = require('../services/infrastructure.service');

      worker.on('active', (job) => {
        emitInfraEvent({
          stage: 'WORKER',
          type: 'JOB_ACTIVE',
          label: `Worker evaluating anomaly baselines (job #${job.id})`,
          status: 'active',
          details: { queue: QUEUE_NAME, jobId: job.id }
        });
      });

      worker.on('completed', (job) => {
        emitInfraEvent({
          stage: 'PROCESSING',
          type: 'JOB_COMPLETED',
          label: `Anomaly detection sweep finished (${QUEUE_NAME})`,
          status: 'success',
          details: { queue: QUEUE_NAME, jobId: job.id }
        });
      });

      worker.on('failed', (job, err) => {
        emitInfraEvent({
          stage: 'PROCESSING',
          type: 'JOB_FAILED',
          label: `Anomaly detection failed on ${QUEUE_NAME}: ${err?.message || 'Error'}`,
          status: 'error',
          details: { queue: QUEUE_NAME, jobId: job?.id, error: err?.message }
        });
      });

      infrastructureService.registerQueue(QUEUE_NAME, queue, worker);

      queue.add('detect-anomalies', {}, {
        repeat: { every: 60 * 1000 },
        removeOnComplete: true
      }).catch((e) => logger.warn(`Queue schedule error: ${e.message}`));

      logger.info('BullMQ Anomaly Detection worker initialized');
      return;
    } catch (e) {
      logger.warn(`BullMQ init failed, using timer fallback: ${e.message}`);
    }
  }

  fallbackInterval = setInterval(processAnomalyDetectionBatch, 60 * 1000);
  logger.info('Local Anomaly Detection timer initialized (every 60s)');
}

module.exports = {
  initAnomalyDetectionJob,
  processAnomalyDetectionBatch
};
