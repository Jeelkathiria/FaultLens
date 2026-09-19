const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');
const db = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError } = require('../utils/errors');
const { cache } = require('../config/redis');
const incidentService = require('./incident.service');
const {
  emitWebsiteHealthUpdated,
  emitWebsiteCheckFailed,
  emitWebsiteCheckRecovered,
  emitWebsiteIncidentCreated,
  emitInfraEvent
} = require('../websocket/socket');

class WebsiteMonitoringService {
  /**
   * Safe HTTP/HTTPS probe execution against the website's configured URL.
   * Measures reachability, response time, status code, timeout, connection/DNS errors, and SSL certificate validity.
   *
   * @param {string} targetUrl
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async executeProbe(targetUrl, options = {}) {
    const timeoutMs = Number(options.timeoutMs) || 10000;
    const expectedStatusCodes = Array.isArray(options.expectedStatusCodes) && options.expectedStatusCodes.length > 0
      ? options.expectedStatusCodes
      : [200];

    return new Promise((resolve) => {
      let parsedUrl;
      try {
        parsedUrl = new URL(targetUrl);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          return resolve({
            statusCode: 0,
            responseTime: 0,
            timeout: false,
            errorType: 'NETWORK_ERROR',
            errorMessage: `Unsupported protocol '${parsedUrl.protocol}'. Only http and https are supported.`,
            sslValid: null,
            isSuccess: false
          });
        }
      } catch (err) {
        return resolve({
          statusCode: 0,
          responseTime: 0,
          timeout: false,
          errorType: 'NETWORK_ERROR',
          errorMessage: `Invalid URL: ${err.message}`,
          sslValid: null,
          isSuccess: false
        });
      }

      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const reqOptions = {
        method: 'GET',
        headers: {
          'User-Agent': 'FaultLens-WebsiteMonitor/1.0 (HealthProbe)',
          'Accept': '*/*'
        },
        timeout: timeoutMs,
        // For HTTPS: inspect certificate directly even if self-signed or expired to measure validity
        rejectUnauthorized: false
      };

      const startTime = performance.now();
      let timedOut = false;
      let settled = false;

      const req = client.request(targetUrl, reqOptions, (res) => {
        const endTime = performance.now();
        const responseTime = Math.max(1, Math.round(endTime - startTime));
        const statusCode = res.statusCode || 0;

        // Inspect SSL details if HTTPS
        let sslValid = null;
        if (isHttps && res.socket) {
          try {
            const cert = res.socket.getPeerCertificate ? res.socket.getPeerCertificate() : null;
            const authorized = res.socket.authorized !== false;
            let notExpired = true;
            if (cert && cert.valid_to) {
              notExpired = new Date(cert.valid_to).getTime() > Date.now();
            }
            sslValid = authorized && notExpired;
          } catch (_) {
            sslValid = false;
          }
        }

        // Drain response data so socket is released
        res.resume();
        res.on('end', () => {
          if (settled) return;
          settled = true;

          const isSuccess = expectedStatusCodes.includes(statusCode);
          let errorType = null;
          let errorMessage = null;

          if (!isSuccess) {
            if (statusCode >= 500) {
              errorType = 'HTTP_ERROR';
              errorMessage = `Server returned HTTP ${statusCode} (expected ${expectedStatusCodes.join(', ')})`;
            } else if (statusCode >= 400) {
              errorType = 'HTTP_ERROR';
              errorMessage = `HTTP client error ${statusCode} (expected ${expectedStatusCodes.join(', ')})`;
            } else {
              errorType = 'HTTP_ERROR';
              errorMessage = `Unexpected HTTP status ${statusCode} (expected ${expectedStatusCodes.join(', ')})`;
            }
          }

          resolve({
            statusCode,
            responseTime,
            timeout: false,
            errorType,
            errorMessage,
            sslValid,
            isSuccess
          });
        });
      });

      req.on('timeout', () => {
        timedOut = true;
        req.destroy(new Error('TIMEOUT'));
      });

      req.on('error', (err) => {
        if (settled) return;
        settled = true;

        const endTime = performance.now();
        const responseTime = timedOut ? timeoutMs : Math.max(1, Math.round(endTime - startTime));

        let errorType = 'NETWORK_ERROR';
        let errorMessage = err.message || 'Connection failure';

        if (timedOut || err.message === 'TIMEOUT' || err.code === 'ETIMEDOUT') {
          errorType = 'TIMEOUT';
          errorMessage = `Request timed out after ${timeoutMs}ms`;
        } else if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
          errorType = 'DNS_FAILURE';
          errorMessage = `DNS lookup failed for ${parsedUrl.hostname}`;
        } else if (err.code === 'ECONNREFUSED') {
          errorType = 'CONNECTION_REFUSED';
          errorMessage = `Connection refused by ${parsedUrl.hostname}:${parsedUrl.port || (isHttps ? 443 : 80)}`;
        } else if (err.code && (err.code.startsWith('ERR_TLS') || err.code.startsWith('CERT_'))) {
          errorType = 'SSL_ERROR';
          errorMessage = `SSL/TLS handshake error: ${err.message}`;
        }

        resolve({
          statusCode: 0,
          responseTime,
          timeout: timedOut,
          errorType,
          errorMessage,
          sslValid: isHttps ? false : null,
          isSuccess: false
        });
      });

      req.end();
    });
  }

  /**
   * Perform an automated or on-demand check for a website.
   * Stores check, computes health, triggers incidents/recoveries, invalidates cache, and emits WebSocket events.
   *
   * @param {string} websiteId
   * @returns {Promise<Object>}
   */
  async checkWebsite(websiteId) {
    const website = await db.website.findUnique({
      where: { id: websiteId }
    });

    if (!website) {
      throw new NotFoundError('Website not found');
    }

    const targetUrl = website.url.startsWith('http') ? website.url : `https://${website.url}`;
    const timeoutMs = (Number(website.monitoringTimeout) || 10) * 1000;
    const expectedStatusCodes = Array.isArray(website.expectedStatusCodes) && website.expectedStatusCodes.length > 0
      ? website.expectedStatusCodes
      : [200];

    // 1. Execute live HTTP GET probe
    emitInfraEvent({
      stage: 'PROCESSING',
      type: 'WEBSITE_PROBE',
      label: `Probing website URL: ${targetUrl}`,
      status: 'active',
      details: { websiteId, targetUrl }
    });

    const probeResult = await this.executeProbe(targetUrl, {
      timeoutMs,
      expectedStatusCodes
    });

    // 2. Fetch recent successful checks to compute baseline response time statistics
    const recentChecks = await db.websiteCheck.findMany({
      where: {
        websiteId: website.id,
        status: { in: ['UP', 'DEGRADED'] },
        responseTime: { gt: 0 }
      },
      orderBy: { timestamp: 'desc' },
      take: 30
    });

    let baselineMean = 0;
    let baselineStdDev = 0;
    if (recentChecks.length >= 3) {
      const times = recentChecks.map((c) => c.responseTime);
      baselineMean = times.reduce((a, b) => a + b, 0) / times.length;
      const variance = times.reduce((acc, val) => acc + Math.pow(val - baselineMean, 2), 0) / times.length;
      baselineStdDev = Math.sqrt(variance);
    }

    // 3. Determine check status (UP, DEGRADED, DOWN)
    let checkStatus = 'DOWN';
    if (probeResult.isSuccess) {
      // If we have a statistical baseline, check if response time is significantly abnormal (> 2.5σ above mean)
      const hasHighLatencyAnomaly = baselineMean > 0 &&
        baselineStdDev > 0 &&
        (probeResult.responseTime - baselineMean) > 2.5 * baselineStdDev &&
        (probeResult.responseTime - baselineMean) > 50; // Minimum 50ms buffer to prevent microsecond noise

      if (hasHighLatencyAnomaly) {
        checkStatus = 'DEGRADED';
        if (!probeResult.errorMessage) {
          probeResult.errorMessage = `Latency regression detected: ${probeResult.responseTime}ms is >2.5σ above baseline (${Math.round(baselineMean)}ms)`;
        }
      } else {
        checkStatus = 'UP';
      }
    } else {
      if (probeResult.statusCode >= 400 && probeResult.statusCode < 500) {
        checkStatus = 'DEGRADED';
      } else {
        checkStatus = 'DOWN';
      }
    }

    const now = new Date();

    // 4. Store WebsiteCheck record
    let storedCheck = null;
    try {
      storedCheck = await db.websiteCheck.create({
        data: {
          websiteId: website.id,
          timestamp: now,
          status: checkStatus,
          statusCode: probeResult.statusCode,
          responseTime: probeResult.responseTime,
          timeout: probeResult.timeout,
          errorType: probeResult.errorType,
          errorMessage: probeResult.errorMessage,
          sslValid: probeResult.sslValid
        }
      });

      emitInfraEvent({
        stage: 'DATABASE',
        type: 'MONGODB_WRITE',
        label: `Persisted WebsiteCheck for ${website.name || website.url} (${probeResult.responseTime}ms, ${checkStatus})`,
        status: checkStatus === 'DOWN' ? 'error' : 'success',
        details: { websiteId, status: checkStatus, responseTime: probeResult.responseTime }
      });
    } catch (dbErr) {
      logger.error(`Failed to store WebsiteCheck for ${website.id}: ${dbErr.message}`);
    }

    // 5. Update consecutive failures count & website fields
    let consecutiveFailures = website.consecutiveFailures || 0;
    let lastSuccessfulCheckAt = website.lastSuccessfulCheckAt;
    let lastError = null;

    if (checkStatus === 'UP') {
      consecutiveFailures = 0;
      lastSuccessfulCheckAt = now;
      lastError = null;
    } else if (checkStatus === 'DEGRADED') {
      consecutiveFailures = 0; // Still reachable
      lastError = probeResult.errorMessage;
    } else {
      consecutiveFailures += 1;
      lastError = probeResult.errorMessage;
    }

    // 6. Aggregate Overall Website Health (incorporating APIs if any exist)
    const overallHealth = await this.calculateOverallWebsiteHealth(website.id, checkStatus);

    // 7. Update Website record
    const updatedWebsite = await db.website.update({
      where: { id: website.id },
      data: {
        healthStatus: checkStatus,
        status: overallHealth.overallStatus,
        lastCheckedAt: now,
        lastSuccessfulCheckAt,
        lastResponseTime: probeResult.responseTime,
        lastStatusCode: probeResult.statusCode,
        lastError,
        consecutiveFailures,
        sslValid: probeResult.sslValid
      }
    });

    // 8. Handle Incidents (consecutive failures -> incident; recovery -> resolve)
    await this.handleIncidentsAndRecovery(updatedWebsite, {
      checkStatus,
      consecutiveFailures,
      probeResult,
      now
    });

    // 9. Invalidate Redis Caches
    cache.del(`website:${website.id}:health`).catch(() => {});
    cache.del(`website:${website.id}:metrics`).catch(() => {});
    cache.del(`website:${website.id}:checks`).catch(() => {});

    // 10. Emit WebSocket events
    const healthPayload = {
      healthStatus: checkStatus,
      status: overallHealth.overallStatus,
      reason: overallHealth.reason,
      statusCode: probeResult.statusCode,
      responseTime: probeResult.responseTime,
      checkedAt: now.toISOString(),
      sslValid: probeResult.sslValid,
      error: probeResult.errorMessage
    };

    emitWebsiteHealthUpdated(updatedWebsite, healthPayload);

    emitInfraEvent({
      stage: 'WEBSOCKET',
      type: 'WEBSOCKET_BROADCAST',
      label: `Broadcast health (${overallHealth.overallStatus}) for ${website.name || website.url}`,
      status: 'success',
      details: { websiteId, status: overallHealth.overallStatus }
    });

    if (checkStatus === 'DOWN') {
      emitWebsiteCheckFailed(updatedWebsite, {
        errorType: probeResult.errorType,
        errorMessage: probeResult.errorMessage,
        statusCode: probeResult.statusCode,
        timestamp: now.toISOString()
      });
    }

    return {
      success: true,
      check: storedCheck,
      website: updatedWebsite,
      health: healthPayload
    };
  }

  /**
   * Calculate overall website status combining Website HTTP health and API health.
   * Separate signals: Website up != all APIs healthy; API down != website down.
   *
   * @param {string} websiteId
   * @param {string} httpHealth - 'UP' | 'DEGRADED' | 'DOWN'
   * @returns {Promise<{ overallStatus: string, reason: string }>}
   */
  async calculateOverallWebsiteHealth(websiteId, httpHealth) {
    const apis = await db.api.findMany({
      where: { websiteId },
      select: { id: true, name: true, status: true }
    });

    // Case B: Website with NO APIs
    if (apis.length === 0) {
      if (httpHealth === 'UP') return { overallStatus: 'healthy', reason: 'Website HTTP endpoint is operational' };
      if (httpHealth === 'DEGRADED') return { overallStatus: 'degraded', reason: 'Website HTTP endpoint is experiencing degraded performance' };
      return { overallStatus: 'critical', reason: 'Website HTTP endpoint is unavailable' };
    }

    // Case A: Website WITH APIs
    if (httpHealth === 'DOWN') {
      return { overallStatus: 'critical', reason: 'Website HTTP endpoint is unreachable' };
    }

    const criticalApis = apis.filter((a) => (a.status || '').toLowerCase() === 'critical');
    const degradedApis = apis.filter((a) => (a.status || '').toLowerCase() === 'degraded');

    if (criticalApis.length > 0) {
      const names = criticalApis.map((a) => a.name).join(', ');
      return {
        overallStatus: 'critical',
        reason: `Website reachable, but critical API is failing (${names})`
      };
    }

    if (httpHealth === 'DEGRADED') {
      return { overallStatus: 'degraded', reason: 'Website HTTP probe performance is degraded' };
    }

    if (degradedApis.length > 0) {
      const names = degradedApis.map((a) => a.name).join(', ');
      return {
        overallStatus: 'degraded',
        reason: `Website reachable, but API performance is degraded (${names})`
      };
    }

    return { overallStatus: 'healthy', reason: 'Website and all registered APIs are operational' };
  }

  /**
   * Handle incident auto-creation upon repeated/consecutive failures and auto-resolution upon recovery
   */
  async handleIncidentsAndRecovery(website, { checkStatus, consecutiveFailures, probeResult, now }) {
    try {
      // Find active website-level incident (apiId: null)
      const activeIncident = await db.incident.findFirst({
        where: {
          websiteId: website.id,
          apiId: null,
          status: { in: ['DETECTED', 'INVESTIGATING'] }
        }
      });

      // FAILURE: If consecutive failures >= 2 and website is DOWN, create or update incident
      if (checkStatus === 'DOWN' && consecutiveFailures >= 2) {
        const errorDesc = probeResult.errorMessage || 'Website HTTP probe is unreachable';

        if (activeIncident) {
          // Update existing incident with new timeline probe failure
          await incidentService.addIncidentEvent(
            activeIncident.id,
            'warning',
            `Probe failure persisted: ${errorDesc} (attempt ${consecutiveFailures})`,
            { consecutiveFailures, errorType: probeResult.errorType }
          );
        } else {
          // Create NEW incident for website outage
          const title = `Website Outage: ${website.name} is Unavailable`;
          const description = `Repeated health check failure detected: ${errorDesc}. Last successful check: ${website.lastSuccessfulCheckAt ? new Date(website.lastSuccessfulCheckAt).toLocaleTimeString() : 'N/A'}`;

          const newIncident = await db.incident.create({
            data: {
              websiteId: website.id,
              apiId: null,
              title,
              description,
              severity: 'critical',
              status: 'DETECTED',
              detectedAt: now
            }
          });

          await incidentService.addIncidentEvent(
            newIncident.id,
            'incident',
            `Automated website monitoring detected outage (${consecutiveFailures} consecutive probe failures)`,
            { consecutiveFailures, errorType: probeResult.errorType }
          );

          logger.info(`Automated website outage incident ${newIncident.id} created for ${website.name}`);
          const formatted = await incidentService.getIncidentById(newIncident.id);
          emitWebsiteIncidentCreated(formatted);
        }
      }

      // RECOVERY: If website check is UP and an active website incident exists, auto-resolve it
      if (checkStatus === 'UP' && activeIncident) {
        await db.incident.update({
          where: { id: activeIncident.id },
          data: {
            status: 'RESOLVED',
            severity: 'resolved',
            resolvedAt: now
          }
        });

        await incidentService.addIncidentEvent(
          activeIncident.id,
          'resolved',
          `Website probe recovered. HTTP ${probeResult.statusCode} OK received (${probeResult.responseTime}ms)`,
          { responseTime: probeResult.responseTime, recoveredAt: now }
        );

        logger.info(`Resolved website outage incident ${activeIncident.id} for ${website.name}`);
        const formatted = await incidentService.getIncidentById(activeIncident.id);
        emitWebsiteCheckRecovered(website, {
          responseTime: probeResult.responseTime,
          timestamp: now.toISOString()
        });
      }
    } catch (err) {
      logger.error(`Error in handleIncidentsAndRecovery for website ${website.id}: ${err.message}`);
    }
  }

  /**
   * Retrieve aggregated metrics for a website calculated strictly from stored WebsiteCheck records.
   * Computes Uptime %, Response Time, P50, P95, P99, and HTTP status distribution.
   *
   * @param {string} websiteId
   * @param {string} [timeRange='24h']
   * @returns {Promise<Object>}
   */
  async getWebsiteMetrics(websiteId, timeRange = '24h') {
    const hours = timeRange === '7d' ? 168 : timeRange === '30d' ? 720 : 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const checks = await db.websiteCheck.findMany({
      where: {
        websiteId,
        timestamp: { gte: since }
      },
      orderBy: { timestamp: 'desc' }
    });

    const totalChecks = checks.length;
    if (totalChecks === 0) {
      return {
        uptime: 100.0,
        availability: '100.00%',
        totalChecks: 0,
        successfulChecks: 0,
        degradedChecks: 0,
        failedChecks: 0,
        timeouts: 0,
        averageResponseTime: 0,
        currentResponseTime: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        httpStatusDistribution: {},
        lastChecked: null,
        lastSuccessfulCheck: null
      };
    }

    let successfulChecks = 0;
    let degradedChecks = 0;
    let failedChecks = 0;
    let timeouts = 0;
    let totalResponseTime = 0;
    const statusDistribution = {};
    const validLatencies = [];

    for (const check of checks) {
      if (check.status === 'UP') successfulChecks++;
      else if (check.status === 'DEGRADED') degradedChecks++;
      else failedChecks++;

      if (check.timeout) timeouts++;

      if (check.statusCode) {
        statusDistribution[check.statusCode] = (statusDistribution[check.statusCode] || 0) + 1;
      }

      if (check.responseTime > 0) {
        validLatencies.push(check.responseTime);
        totalResponseTime += check.responseTime;
      }
    }

    // Availability / Uptime percentage
    const uptime = +(((successfulChecks + degradedChecks) / totalChecks) * 100).toFixed(2);

    // Calculate P50, P95, P99 from sorted stored response times
    validLatencies.sort((a, b) => a - b);
    const p50 = validLatencies.length ? validLatencies[Math.floor(validLatencies.length * 0.50)] : 0;
    const p95 = validLatencies.length ? validLatencies[Math.floor(validLatencies.length * 0.95)] : (validLatencies[validLatencies.length - 1] || 0);
    const p99 = validLatencies.length ? validLatencies[Math.floor(validLatencies.length * 0.99)] : (validLatencies[validLatencies.length - 1] || 0);

    const averageResponseTime = validLatencies.length ? Math.round(totalResponseTime / validLatencies.length) : 0;
    const latestCheck = checks[0];
    const latestSuccess = checks.find((c) => c.status === 'UP');

    return {
      uptime,
      availability: `${uptime.toFixed(2)}%`,
      totalChecks,
      successfulChecks,
      degradedChecks,
      failedChecks,
      timeouts,
      averageResponseTime,
      currentResponseTime: latestCheck ? latestCheck.responseTime : 0,
      p50,
      p95,
      p99,
      httpStatusDistribution: statusDistribution,
      lastChecked: latestCheck ? latestCheck.timestamp : null,
      lastSuccessfulCheck: latestSuccess ? latestSuccess.timestamp : null
    };
  }

  /**
   * Get paginated checks for a website
   */
  async getWebsiteChecks(websiteId, { limit = 50, page = 1 } = {}) {
    const take = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (Math.max(1, Number(page) || 1) - 1) * take;

    const [checks, total] = await Promise.all([
      db.websiteCheck.findMany({
        where: { websiteId },
        orderBy: { timestamp: 'desc' },
        take,
        skip
      }),
      db.websiteCheck.count({ where: { websiteId } })
    ]);

    return {
      checks,
      pagination: {
        total,
        page: Math.max(1, Number(page) || 1),
        limit: take,
        pages: Math.ceil(total / take)
      }
    };
  }
}

module.exports = new WebsiteMonitoringService();
