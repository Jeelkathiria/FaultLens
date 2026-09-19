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
   * Calculate website overall rolling uptime from its child APIs or WebsiteChecks
   * @param {string} websiteId
   * @returns {Promise<number|null>}
   */
  async getWebsiteUptime(websiteId) {
    const apis = await prisma.api.findMany({
      where: { websiteId },
      select: { id: true }
    });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (apis.length === 0) {
      const checks = (prisma.websiteCheck && typeof prisma.websiteCheck.findMany === 'function')
        ? await prisma.websiteCheck.findMany({ where: { websiteId, timestamp: { gte: oneDayAgo } } })
        : [];
      if (checks.length === 0) return null;
      const successful = checks.filter((c) => c.status === 'UP' || c.status === 'DEGRADED').length;
      return +((successful / checks.length) * 100).toFixed(2);
    }

    let totalUptime = 0;
    let measuredApis = 0;

    for (const api of apis) {
      const { uptime, totalRequests } = await this.getApiUptime(api.id, oneDayAgo);
      if (totalRequests > 0) {
        totalUptime += uptime;
        measuredApis++;
      }
    }

    if (measuredApis === 0) {
      // Check if website checks exist as fallback
      const checks = (prisma.websiteCheck && typeof prisma.websiteCheck.findMany === 'function')
        ? await prisma.websiteCheck.findMany({ where: { websiteId, timestamp: { gte: oneDayAgo } } })
        : [];
      if (checks.length === 0) return null;
      const successful = checks.filter((c) => c.status === 'UP' || c.status === 'DEGRADED').length;
      return +((successful / checks.length) * 100).toFixed(2);
    }

    return +(totalUptime / measuredApis).toFixed(2);
  }

  /**
   * Compute actual daily uptime history from WebsiteCheck records and Incidents
   * @param {string} websiteId
   * @param {number} days
   * @returns {Promise<Array<number|null>>}
   */
  async getWebsiteDailyUptimeHistory(websiteId, days = 30) {
    const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const checks = (prisma.websiteCheck && typeof prisma.websiteCheck.findMany === 'function')
      ? await prisma.websiteCheck.findMany({
          where: { websiteId, timestamp: { gte: startTime } },
          orderBy: { timestamp: 'asc' }
        })
      : [];

    const incidents = (prisma.incident && typeof prisma.incident.findMany === 'function')
      ? await prisma.incident.findMany({
          where: {
            websiteId,
            detectedAt: { gte: startTime }
          },
          select: { detectedAt: true, resolvedAt: true, severity: true }
        })
      : [];

    const dayDurationMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const history = [];

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now - (i + 1) * dayDurationMs);
      const dayEnd = new Date(now - i * dayDurationMs);

      const dayChecks = checks.filter((c) => c.timestamp >= dayStart && c.timestamp < dayEnd);
      if (dayChecks.length > 0) {
        const successful = dayChecks.filter((c) => c.status === 'UP' || c.status === 'DEGRADED').length;
        history.push(+(successful / dayChecks.length).toFixed(2));
      } else {
        const dayIncident = incidents.find((inc) => {
          const dAt = new Date(inc.detectedAt);
          const rAt = inc.resolvedAt ? new Date(inc.resolvedAt) : new Date();
          return dAt <= dayEnd && rAt >= dayStart;
        });

        if (dayIncident) {
          history.push(dayIncident.severity === 'critical' ? 0.0 : 0.95);
        } else {
          history.push(null);
        }
      }
    }

    return history;
  }

  /**
   * Calculate API health state (healthy, degraded, critical, unknown)
   * @param {string} apiId
   * @returns {Promise<'healthy' | 'degraded' | 'critical' | 'unknown'>}
   */
  async calculateApiHealth(apiId) {
    const activeIncidents = await prisma.incident.findMany({
      where: {
        apiId,
        status: { in: ['DETECTED', 'INVESTIGATING'] }
      },
      select: { severity: true }
    });

    const hasCriticalIncident = activeIncidents.some((i) => i.severity === 'critical');
    if (hasCriticalIncident) return 'critical';

    const hasWarningIncident = activeIncidents.some((i) => i.severity === 'warning');

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const total = await prisma.requestMetric.count({
      where: { apiId, timestamp: { gte: oneHourAgo } }
    });

    if (total === 0) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const dayTotal = await prisma.requestMetric.count({
        where: { apiId, timestamp: { gte: oneDayAgo } }
      });
      if (dayTotal === 0) {
        return hasWarningIncident ? 'degraded' : 'unknown';
      }
      return hasWarningIncident ? 'degraded' : 'healthy';
    }

    const errors = await prisma.requestMetric.count({
      where: { apiId, timestamp: { gte: oneHourAgo }, statusCode: { gte: 500 } }
    });

    const errorRate = (errors / total) * 100;
    if (errorRate > 5) return 'critical';
    if (hasWarningIncident || errorRate >= 1) return 'degraded';

    return 'healthy';
  }

  /**
   * Calculate Website health state based on both Website HTTP health and child API statuses
   * (critical > degraded > unknown > healthy)
   * @param {string} websiteId
   * @returns {Promise<'healthy' | 'degraded' | 'critical' | 'unknown'>}
   */
  async calculateWebsiteHealth(websiteId) {
    const website = await prisma.website.findUnique({ where: { id: websiteId } });
    const httpHealth = website?.healthStatus || 'UP';

    const apis = await prisma.api.findMany({
      where: { websiteId },
      select: { id: true }
    });

    if (apis.length === 0) {
      if (httpHealth === 'DOWN') return 'critical';
      if (httpHealth === 'DEGRADED') return 'degraded';
      if (httpHealth === 'UNKNOWN') return 'unknown';
      return 'healthy';
    }

    if (httpHealth === 'DOWN') return 'critical';

    const healths = await Promise.all(apis.map((a) => this.calculateApiHealth(a.id)));

    if (healths.includes('critical')) return 'critical';
    if (httpHealth === 'DEGRADED' || healths.includes('degraded')) return 'degraded';
    if (healths.includes('unknown')) return 'unknown';
    return 'healthy';
  }
}

module.exports = new UptimeService();
