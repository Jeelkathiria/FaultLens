const prisma = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError } = require('../utils/errors');
const { cache } = require('../config/redis');
const uptimeService = require('./uptime.service');
const { emitApiHealthUpdated, emitInfraEvent } = require('../websocket/socket');

class ApiHealthCheckerService {
  /**
   * Resolve destination URL from API and parent Website configuration
   * @param {Object} api
   * @param {Object} website
   * @returns {string}
   */
  resolveTargetUrl(api, website) {
    const rawPath = (api.healthCheckEndpoint && api.healthCheckEndpoint.trim())
      ? api.healthCheckEndpoint.trim()
      : (api.endpoint && api.endpoint.trim()) ? api.endpoint.trim() : '/';

    // If it's already an absolute URL (e.g. https://jsonplaceholder.typicode.com/posts/1)
    if (/^https?:\/\//i.test(rawPath)) {
      return rawPath;
    }

    // Combine with website base URL
    if (!website || !website.url) {
      throw new Error(`Cannot resolve health check URL: API ${api.id} has relative path '${rawPath}' but website has no valid URL.`);
    }

    const baseUrl = website.url.replace(/\/+$/, '');
    const cleanPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    return `${baseUrl}${cleanPath}`;
  }

  /**
   * Perform live health check on a specific API
   * @param {string} apiId
   * @param {Object} [options]
   * @returns {Promise<Object>}
   */
  async checkApiHealth(apiId, options = {}) {
    // 1. Load API and parent Website from MongoDB
    const api = await prisma.api.findUnique({
      where: { id: apiId },
      include: { website: true }
    });

    if (!api) {
      throw new NotFoundError('API not found');
    }

    const website = api.website || (await prisma.website.findUnique({ where: { id: api.websiteId } }));

    // 2. Resolve target URL & validate protocol
    let targetUrl;
    try {
      targetUrl = this.resolveTargetUrl(api, website);
      const parsed = new URL(targetUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error(`Unsupported protocol: ${parsed.protocol}. Only http and https are permitted.`);
      }
    } catch (urlErr) {
      logger.error(`URL resolution error for API ${apiId}: ${urlErr.message}`);
      return this.recordFailureResult(api, 0, 0, `Invalid URL configuration: ${urlErr.message}`);
    }

    // 3. Determine safe method (safety rule: never use mutating methods for automated health checks)
    const method = 'GET';
    const expectedStatusCode = Number(api.expectedStatusCode) || 200;
    const timeoutMs = Number(api.timeout) || 10000;

    // 4. Execute real HTTP request with timeout
    const startTime = performance.now();
    let responseTime = 0;
    let statusCode = 0;
    let isSuccess = false;
    let errorMessage = null;
    let status = 'UNKNOWN';

    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), timeoutMs);

    emitInfraEvent({
      stage: 'PROCESSING',
      type: 'API_PROBE',
      label: `Probing API [${method}] ${targetUrl}`,
      status: 'active',
      details: { apiId, targetUrl }
    });

    try {
      const response = await fetch(targetUrl, {
        method,
        signal: controller.signal,
        headers: {
          'User-Agent': 'FaultLens-HealthChecker/1.0',
          'Accept': '*/*'
        }
      });

      clearTimeout(timerId);
      const endTime = performance.now();
      responseTime = Math.round(endTime - startTime);
      statusCode = response.status;

      isSuccess = (statusCode === expectedStatusCode);

      if (isSuccess) {
        // Evaluate if degraded based on statistical baseline (last 30 measurements)
        let recentMetrics = [];
        try {
          if (prisma.requestMetric && typeof prisma.requestMetric.findMany === 'function') {
            recentMetrics = await prisma.requestMetric.findMany({
              where: {
                apiId: api.id,
                responseTime: { gt: 0 }
              },
              orderBy: { timestamp: 'desc' },
              take: 30
            });
          }
        } catch (_) {
          recentMetrics = [];
        }

        let baselineMean = 0;
        let baselineStdDev = 0;
        if (recentMetrics.length >= 3) {
          const times = recentMetrics.map((m) => m.responseTime);
          baselineMean = times.reduce((a, b) => a + b, 0) / times.length;
          const variance = times.reduce((acc, val) => acc + Math.pow(val - baselineMean, 2), 0) / times.length;
          baselineStdDev = Math.sqrt(variance);
        }

        const hasHighLatencyAnomaly = baselineMean > 0 &&
          baselineStdDev > 0 &&
          (responseTime - baselineMean) > 2.5 * baselineStdDev &&
          (responseTime - baselineMean) > 50; // Minimum 50ms buffer to prevent microsecond noise

        if (hasHighLatencyAnomaly) {
          status = 'DEGRADED';
          errorMessage = `Latency regression detected: ${responseTime}ms is >2.5σ above baseline (${Math.round(baselineMean)}ms)`;
        } else {
          status = 'HEALTHY';
        }
      } else {
        if (statusCode >= 500) {
          status = 'CRITICAL';
          errorMessage = `Server returned HTTP ${statusCode} (expected ${expectedStatusCode})`;
        } else if (statusCode >= 400) {
          status = 'DEGRADED';
          errorMessage = `Client error HTTP ${statusCode} (expected ${expectedStatusCode})`;
        } else {
          status = 'DEGRADED';
          errorMessage = `Unexpected HTTP status ${statusCode} (expected ${expectedStatusCode})`;
        }
      }

      logger.info(`API health check completed: apiId=${api.id} endpoint=${targetUrl} statusCode=${statusCode} responseTime=${responseTime}ms success=${isSuccess}`);
    } catch (reqErr) {
      clearTimeout(timerId);
      const endTime = performance.now();
      responseTime = Math.round(endTime - startTime);
      isSuccess = false;
      status = 'CRITICAL';

      if (reqErr.name === 'AbortError' || reqErr.name === 'TimeoutError') {
        errorMessage = 'Request timed out';
        responseTime = timeoutMs;
      } else {
        errorMessage = reqErr.message || 'Connection failure';
      }

      logger.warn(`API health check failed: apiId=${api.id} endpoint=${targetUrl} error="${errorMessage}" responseTime=${responseTime}ms`);
    }

    return this.persistHealthCheckResult(api, {
      targetUrl,
      method,
      statusCode,
      responseTime,
      isSuccess,
      status,
      errorMessage
    });
  }

  /**
   * Helper to persist failure when target URL is unresolvable
   */
  async recordFailureResult(api, statusCode, responseTime, errorMessage) {
    return this.persistHealthCheckResult(api, {
      targetUrl: api.endpoint || 'N/A',
      method: 'GET',
      statusCode,
      responseTime,
      isSuccess: false,
      status: 'CRITICAL',
      errorMessage
    });
  }

  /**
   * Persist health check result into MongoDB, update API, metric, website, and broadcast
   */
  async persistHealthCheckResult(api, { targetUrl, method, statusCode, responseTime, isSuccess, status, errorMessage }) {
    const now = new Date();

    // 1. Update API record in MongoDB
    const updatedApi = await prisma.api.update({
      where: { id: api.id },
      data: {
        status,
        lastCheckedAt: now,
        lastResponseTime: responseTime,
        lastStatusCode: statusCode,
        lastCheckSuccess: isSuccess,
        lastError: errorMessage || null
      }
    });

    // 2. Persist raw RequestMetric
    try {
      await prisma.requestMetric.create({
        data: {
          apiId: api.id,
          statusCode: statusCode || 500,
          responseTime: Math.max(1, responseTime),
          method,
          endpoint: targetUrl,
          errorMessage: errorMessage || null,
          timestamp: now,
          isHealthCheck: true,
          success: isSuccess
        }
      });

      emitInfraEvent({
        stage: 'DATABASE',
        type: 'MONGODB_WRITE',
        label: `Persisted API Health Check for ${api.name || api.id} (${responseTime}ms, ${status})`,
        status: isSuccess ? 'success' : 'error',
        details: { apiId: api.id, status, responseTime }
      });
    } catch (metricErr) {
      logger.warn(`Failed to store RequestMetric for API ${api.id}: ${metricErr.message}`);
    }

    // 3. If failed/error, record a Log entry
    if (!isSuccess || statusCode >= 400 || errorMessage) {
      prisma.log.create({
        data: {
          apiId: api.id,
          timestamp: now,
          level: statusCode >= 500 || status === 'CRITICAL' ? 'ERROR' : 'WARN',
          message: errorMessage || `Health check failed with HTTP ${statusCode}`,
          statusCode: statusCode || 500,
          metadata: {
            targetUrl,
            responseTime,
            isHealthCheck: true,
            status
          }
        }
      }).catch((e) => logger.warn(`Failed to auto-log health check error: ${e.message}`));
    }

    // 3b. If failed/critical status, automatically trigger/update an active Incident
    if (!isSuccess && (statusCode >= 500 || status === 'CRITICAL' || statusCode === 0)) {
      try {
        const incidentService = require('./incident.service');
        incidentService.triggerIncidentForApiFailure(api, {
          targetUrl,
          statusCode,
          responseTime,
          errorMessage,
          status
        }).catch((err) => {
          logger.warn(`Failed to auto-raise incident on health check failure: ${err.message}`);
        });
      } catch (_) {}
    }

    // 4. Invalidate related metric caches
    cache.del(`api:${api.id}:metrics:1h`).catch(() => {});
    cache.del(`api:${api.id}:metrics:24h`).catch(() => {});

    // 5. Re-calculate and update parent Website health
    try {
      if (api.websiteId) {
        const websiteHealth = await uptimeService.calculateWebsiteHealth(api.websiteId);
        await prisma.website.update({
          where: { id: api.websiteId },
          data: { status: websiteHealth }
        });
      }
    } catch (webErr) {
      logger.warn(`Failed to update website health for ${api.websiteId}: ${webErr.message}`);
    }

    // 6. Trigger live telemetry anomaly evaluation
    try {
      const monitoringService = require('./monitoring.service');
      monitoringService.evaluateLiveTelemetry(api).catch((err) => {
        logger.debug(`Live telemetry evaluation note: ${err.message}`);
      });
    } catch (_) {}

    // 7. Emit realtime update via Socket.IO
    const resultPayload = {
      apiId: api.id,
      websiteId: api.websiteId,
      status,
      statusCode,
      responseTime,
      success: isSuccess,
      checkedAt: now.toISOString(),
      error: errorMessage
    };

    emitApiHealthUpdated(api, resultPayload);

    emitInfraEvent({
      stage: 'WEBSOCKET',
      type: 'WEBSOCKET_BROADCAST',
      label: `Broadcast API health update (${status}) for ${api.name || api.id}`,
      status: 'success',
      details: { apiId: api.id, status }
    });

    return resultPayload;
  }
}

module.exports = new ApiHealthCheckerService();
