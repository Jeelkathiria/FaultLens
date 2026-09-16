const prisma = require('../config/database');
const env = require('../config/env');
const logger = require('../utils/logger');
const { evaluateAnomaly } = require('../utils/calculations');
const { emitAnomalyDetected } = require('../websocket/socket');

class AnomalyService {
  /**
   * Run statistical anomaly evaluation on an API's current metrics against historical baseline
   * @param {string} apiId
   * @param {Object} currentValues - { errorRate, p95Latency, requestCount, uptime }
   * @param {number} [sensitivity]
   * @returns {Promise<Object[]>} - Array of detected anomalies
   */
  async detectAnomalies(apiId, currentValues = {}, sensitivity = env.ANOMALY_SENSITIVITY) {
    const detectedAnomalies = [];

    // 1. Fetch recent historical aggregates (up to last 24 records)
    const history = await prisma.metricAggregate.findMany({
      where: { apiId },
      orderBy: { timestamp: 'desc' },
      take: 24
    });

    // 2. Fetch API details for websiteId
    const api = await prisma.api.findUnique({
      where: { id: apiId },
      select: { id: true, name: true, websiteId: true, status: true }
    });

    if (!api) return [];

    // --- EVALUATE ERROR RATE ---
    if (typeof currentValues.errorRate === 'number') {
      const errorRateHistory = history.map((h) =>
        h.requestCount > 0 ? +((h.errorCount / h.requestCount) * 100).toFixed(2) : 0
      );

      const errorEval = evaluateAnomaly(currentValues.errorRate, errorRateHistory, sensitivity, 2.0);

      if (errorEval.isAnomaly) {
        const severity = currentValues.errorRate > 15.0 || errorEval.deviation > 4.0 ? 'critical' : 'warning';
        const anomaly = await this.recordAnomaly({
          apiId,
          metricType: 'ERROR_RATE',
          detectedValue: currentValues.errorRate,
          baselineValue: errorEval.baselineValue,
          deviation: errorEval.deviation,
          severity
        });

        emitAnomalyDetected(api.id, api.websiteId, anomaly);
        detectedAnomalies.push(anomaly);
      }
    }

    // --- EVALUATE LATENCY (P95) ---
    if (typeof currentValues.p95Latency === 'number') {
      const latencyHistory = history.map((h) => h.p95).filter((val) => val > 0);
      const latencyEval = evaluateAnomaly(currentValues.p95Latency, latencyHistory, sensitivity, 500);

      if (latencyEval.isAnomaly) {
        const severity = currentValues.p95Latency > 2000 || latencyEval.deviation > 4.0 ? 'critical' : 'warning';
        const anomaly = await this.recordAnomaly({
          apiId,
          metricType: 'LATENCY',
          detectedValue: currentValues.p95Latency,
          baselineValue: latencyEval.baselineValue,
          deviation: latencyEval.deviation,
          severity
        });

        emitAnomalyDetected(api.id, api.websiteId, anomaly);
        detectedAnomalies.push(anomaly);
      }
    }

    // --- EVALUATE REQUEST VOLUME SPIKE ---
    if (typeof currentValues.requestCount === 'number' && history.length >= 3) {
      const volumeHistory = history.map((h) => h.requestCount);
      const volumeEval = evaluateAnomaly(currentValues.requestCount, volumeHistory, sensitivity * 1.2, 50);

      if (volumeEval.isAnomaly) {
        const anomaly = await this.recordAnomaly({
          apiId,
          metricType: 'REQUEST_VOLUME',
          detectedValue: currentValues.requestCount,
          baselineValue: volumeEval.baselineValue,
          deviation: volumeEval.deviation,
          severity: 'warning'
        });

        emitAnomalyDetected(api.id, api.websiteId, anomaly);
        detectedAnomalies.push(anomaly);
      }
    }

    // If anomalies were detected, trigger incident creation/update
    if (detectedAnomalies.length > 0) {
      // Lazy-load IncidentService to avoid circular dependency
      const incidentService = require('./incident.service');
      for (const anomaly of detectedAnomalies) {
        await incidentService.processAnomaly(anomaly, currentValues);
      }

      // Update API & Website status
      const highestSeverity = detectedAnomalies.some((a) => a.severity === 'critical') ? 'critical' : 'degraded';
      await prisma.api.update({
        where: { id: apiId },
        data: { status: highestSeverity }
      });
      await prisma.website.update({
        where: { id: api.websiteId },
        data: { status: highestSeverity }
      });
    }

    return detectedAnomalies;
  }

  /**
   * Save detected anomaly to the database
   */
  async recordAnomaly({ apiId, metricType, detectedValue, baselineValue, deviation, severity }) {
    return prisma.anomaly.create({
      data: {
        apiId,
        metricType,
        detectedValue,
        baselineValue,
        deviation,
        severity,
        status: 'OPEN',
        detectedAt: new Date()
      },
      include: {
        api: {
          select: {
            id: true,
            name: true,
            endpoint: true,
            websiteId: true
          }
        }
      }
    });
  }

  /**
   * Query recent anomalies
   */
  async getAnomalies(apiId = null, limit = 20) {
    const where = {};
    if (apiId) where.apiId = apiId;

    return prisma.anomaly.findMany({
      where,
      orderBy: { detectedAt: 'desc' },
      take: limit,
      include: {
        api: { select: { id: true, name: true, endpoint: true, websiteId: true } }
      }
    });
  }
}

module.exports = new AnomalyService();
