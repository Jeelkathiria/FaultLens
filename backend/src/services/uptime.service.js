const prisma = require('../config/database');
const { calculateUptime } = require('../utils/calculations');

class UptimeService {
  /**
   * Calculate API uptime percentage over a specific time window
   * @param {string} apiId
   * @param {Date} startTime
   * @param {Date} endTime
   * @returns {Promise<{ uptime: number, totalRequests: number, successfulRequests: number, errorRequests: number }>}
   */
  async getApiUptime(apiId, startTime, endTime = new Date()) {
    const aggregates = await prisma.metricAggregate.findMany({
      where: {
        apiId,
        timestamp: { gte: startTime, lte: endTime }
      }
    });

    if (aggregates.length === 0) {
      // Check raw metrics fallback
      const total = await prisma.requestMetric.count({
        where: { apiId, timestamp: { gte: startTime, lte: endTime } }
      });
      const errors = await prisma.requestMetric.count({
        where: { apiId, timestamp: { gte: startTime, lte: endTime }, statusCode: { gte: 500 } }
      });

      if (total === 0) return { uptime: 100.0, totalRequests: 0, successfulRequests: 0, errorRequests: 0 };
      return {
        uptime: calculateUptime(total, errors),
        totalRequests: total,
        successfulRequests: total - errors,
        errorRequests: errors
      };
    }

    const totalRequests = aggregates.reduce((acc, a) => acc + a.requestCount, 0);
    const serverErrors = aggregates.reduce((acc, a) => acc + a.serverErrorCount, 0);

    return {
      uptime: calculateUptime(totalRequests, serverErrors),
      totalRequests,
      successfulRequests: totalRequests - serverErrors,
      errorRequests: serverErrors
    };
  }

  /**
   * Get historical uptime slices for frontend UptimeBar (e.g. 32 or 90 bars)
   * @param {string} apiId
   * @param {number} barsCount - default 32
   * @returns {Promise<number[]>} - array of ratios (e.g. 1.0, 0.95, 0.88)
   */
  async getApiUptimeHistory(apiId, barsCount = 32) {
    const history = [];
    const now = Date.now();
    const intervalMs = (24 * 60 * 60 * 1000) / barsCount; // slice of 24h

    for (let i = barsCount - 1; i >= 0; i--) {
      const sliceStart = new Date(now - (i + 1) * intervalMs);
      const sliceEnd = new Date(now - i * intervalMs);

      const total = await prisma.requestMetric.count({
        where: { apiId, timestamp: { gte: sliceStart, lte: sliceEnd } }
      });
      const errors = await prisma.requestMetric.count({
        where: { apiId, timestamp: { gte: sliceStart, lte: sliceEnd }, statusCode: { gte: 500 } }
      });

      if (total === 0) {
        history.push(1.0);
      } else {
        const ratio = Math.max(0, Math.min(1.0, +((total - errors) / total).toFixed(2)));
        history.push(ratio);
      }
    }

    return history;
  }

  /**
   * Calculate website overall rolling uptime from its child APIs
   * @param {string} websiteId
   * @returns {Promise<number>}
   */
  async getWebsiteUptime(websiteId) {
    const apis = await prisma.api.findMany({
      where: { websiteId },
      select: { id: true }
    });

    if (apis.length === 0) return 100.0;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let totalUptime = 0;

    for (const api of apis) {
      const { uptime } = await this.getApiUptime(api.id, oneDayAgo);
      totalUptime += uptime;
    }

    return +(totalUptime / apis.length).toFixed(2);
  }
}

module.exports = new UptimeService();
