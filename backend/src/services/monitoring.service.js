const prisma = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const { emitMetricUpdated, emitInfraEvent } = require('../websocket/socket');
const anomalyService = require('./anomaly.service');
const { cache } = require('../config/redis');

class MonitoringService {
  /**
   * Ingest telemetry event submitted from monitored client or SDK
   * @param {Object} telemetryData
   * @param {Object} authenticatedUser - from API Key
   * @returns {Promise<Object>}
   */
  async ingestTelemetry(telemetryData, authenticatedUser) {
    const { apiId, statusCode, responseTime, method, endpoint, errorMessage, timestamp } = telemetryData;

    // 1. Verify that the API exists and belongs to a website owned by this user (or admin)
    const api = await prisma.api.findUnique({
      where: { id: apiId },
      include: { website: true }
    });

    if (!api || (authenticatedUser.role !== 'ADMIN' && api.website?.userId !== authenticatedUser.id)) {
      throw new NotFoundError(`API not found`);
    }

    emitInfraEvent({
      stage: 'INGEST',
      type: 'TELEMETRY_INGEST',
      label: `POST /telemetry -> ${(method || 'GET').toUpperCase()} ${endpoint || api.name}`,
      status: 'active',
      details: { apiId, statusCode, responseTime }
    });

    const eventTime = timestamp ? new Date(timestamp) : new Date();

    // 2. Persist raw telemetry
    const metric = await prisma.requestMetric.create({
      data: {
        apiId,
        statusCode: parseInt(statusCode, 10),
        responseTime: Math.round(responseTime),
        method: (method || 'GET').toUpperCase(),
        endpoint,
        errorMessage: errorMessage || null,
        timestamp: eventTime
      }
    });

    emitInfraEvent({
      stage: 'DATABASE',
      type: 'MONGODB_WRITE',
      label: `Persisted RequestMetric in MongoDB (${responseTime}ms)`,
      status: 'success',
      details: { metricId: metric.id, apiId }
    });

    // 3. If it is an error status (>= 400), also persist an entry in the Log table
    if (statusCode >= 400 || errorMessage) {
      prisma.log.create({
        data: {
          apiId,
          timestamp: eventTime,
          level: statusCode >= 500 ? 'ERROR' : 'WARN',
          message: errorMessage || `HTTP ${statusCode} encountered on ${method} ${endpoint}`,
          statusCode,
          metadata: {
            method,
            endpoint,
            responseTime,
            error: errorMessage
          }
        }
      }).catch((e) => logger.warn(`Failed to auto-log error telemetry: ${e.message}`));
    }

    // 4. Invalidate related caches
    cache.del(`api:${apiId}:metrics:1h`).catch(() => {});
    cache.del(`api:${apiId}:metrics:24h`).catch(() => {});

    // 5. Asynchronously trigger live anomaly evaluation on recent batch
    this.evaluateLiveTelemetry(api).catch((err) => {
      logger.warn(`Anomaly evaluation error for API ${apiId}: ${err.message}`);
    });

    return {
      ingested: true,
      metricId: metric.id,
      timestamp: metric.timestamp
    };
  }

  /**
   * Lightweight evaluation on recent stream to detect real-time spikes and emit WebSocket update
   */
  async evaluateLiveTelemetry(api) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const recent = await prisma.requestMetric.findMany({
      where: {
        apiId: api.id,
        timestamp: { gte: fiveMinutesAgo }
      }
    });

    if (recent.length === 0) return;

    const total = recent.length;
    const errors = recent.filter((m) => m.statusCode >= 400).length;
    const errorRate = +((errors / total) * 100).toFixed(2);

    const latencies = recent.map((m) => m.responseTime).sort((a, b) => a - b);
    const p95Idx = Math.floor(latencies.length * 0.95);
    const p95Latency = latencies[p95Idx] || latencies[latencies.length - 1];

    emitInfraEvent({
      stage: 'PROCESSING',
      type: 'METRIC_EVALUATION',
      label: `Evaluated live window for API ${api.name || api.id} (${total} reqs)`,
      status: 'active',
      details: { apiId: api.id, total, errorRate, p95Latency }
    });

    // Emit live WebSocket update
    emitMetricUpdated(api.id, api.websiteId, {
      requestsCount: total,
      errorRate,
      p95Latency
    });

    emitInfraEvent({
      stage: 'WEBSOCKET',
      type: 'METRIC_BROADCAST',
      label: `Broadcast live metrics update for API ${api.name || api.id}`,
      status: 'success',
      details: { apiId: api.id, websiteId: api.websiteId }
    });

    // Trigger statistical anomaly check
    await anomalyService.detectAnomalies(api.id, {
      errorRate,
      p95Latency,
      requestCount: total
    });
  }
}

module.exports = new MonitoringService();
