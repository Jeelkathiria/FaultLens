const prisma = require('../config/database');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const uptimeService = require('../services/uptime.service');
const metricService = require('../services/metric.service');
const apiHealthChecker = require('../services/apiHealthChecker.service');

class ApiController {
  constructor() {
    this.createApi = this.createApi.bind(this);
    this.getApisByWebsite = this.getApisByWebsite.bind(this);
    this.getApiById = this.getApiById.bind(this);
    this.updateApi = this.updateApi.bind(this);
    this.deleteApi = this.deleteApi.bind(this);
    this.checkApiHealthNow = this.checkApiHealthNow.bind(this);
    this.formatApi = this.formatApi.bind(this);
    this.getSubEndpointBreakdown = this.getSubEndpointBreakdown.bind(this);
    this.getSubEndpoints = this.getSubEndpoints.bind(this);
  }

  /**
   * Create an API monitor under a website
   */
  async createApi(req, res, next) {
    try {
      const { websiteId } = req.params;
      const {
        name,
        endpoint,
        method,
        healthCheckEndpoint,
        monitoringInterval,
        expectedStatusCode,
        timeout
      } = req.body;

      const website = await prisma.website.findUnique({
        where: { id: websiteId }
      });

      if (!website || (req.user.role !== 'ADMIN' && website.userId !== req.user.id)) {
        throw new NotFoundError('Website not found');
      }

      // Format endpoint (allow absolute URLs or relative paths)
      const trimmedEndpoint = (endpoint || '').trim();
      const isAbsolute = /^https?:\/\//i.test(trimmedEndpoint);
      const formattedEndpoint = isAbsolute
        ? trimmedEndpoint
        : trimmedEndpoint.startsWith('/')
        ? trimmedEndpoint
        : `/${trimmedEndpoint}`;

      // Format health check endpoint
      let formattedHealthCheck = null;
      if (healthCheckEndpoint && healthCheckEndpoint.trim()) {
        const trimmedHealth = healthCheckEndpoint.trim();
        formattedHealthCheck = /^https?:\/\//i.test(trimmedHealth)
          ? trimmedHealth
          : trimmedHealth.startsWith('/')
          ? trimmedHealth
          : `/${trimmedHealth}`;
      } else {
        formattedHealthCheck = isAbsolute ? formattedEndpoint : `${formattedEndpoint}/health`;
      }

      // Parse monitoring interval to seconds
      let parsedInterval = 60;
      if (typeof monitoringInterval === 'number') {
        parsedInterval = monitoringInterval;
      } else if (typeof monitoringInterval === 'string') {
        const match = monitoringInterval.trim().match(/^(\d+)([smhd]?)$/i);
        if (match) {
          const val = parseInt(match[1], 10);
          const unit = (match[2] || 's').toLowerCase();
          if (unit === 'm') parsedInterval = val * 60;
          else if (unit === 'h') parsedInterval = val * 3600;
          else parsedInterval = val;
        }
      }

      const api = await prisma.api.create({
        data: {
          websiteId,
          name: name.trim(),
          endpoint: formattedEndpoint,
          method: (method || 'GET').toUpperCase(),
          healthCheckEndpoint: formattedHealthCheck,
          monitoringInterval: parsedInterval,
          expectedStatusCode: Number(expectedStatusCode) || 200,
          timeout: Number(timeout) || 10000,
          status: 'UNKNOWN'
        }
      });

      const formatted = await this.formatApi(api);

      res.status(201).json({
        success: true,
        data: formatted
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List APIs belonging to a specific website
   */
  async getApisByWebsite(req, res, next) {
    try {
      const { websiteId } = req.params;

      const website = await prisma.website.findUnique({
        where: { id: websiteId }
      });

      if (!website || (req.user.role !== 'ADMIN' && website.userId !== req.user.id)) {
        throw new NotFoundError('Website not found');
      }

      const apis = await prisma.api.findMany({
        where: { websiteId },
        orderBy: { createdAt: 'desc' }
      });

      const formattedApis = await Promise.all(apis.map((a) => this.formatApi(a)));

      res.json({
        success: true,
        data: formattedApis
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single API details by ID
   */
  async getApiById(req, res, next) {
    try {
      const { id } = req.params;

      const api = await prisma.api.findUnique({
        where: { id },
        include: {
          website: true
        }
      });

      if (!api || (req.user.role !== 'ADMIN' && api.website?.userId !== req.user.id)) {
        throw new NotFoundError('API not found');
      }

      const formatted = await this.formatApi(api);

      res.json({
        success: true,
        data: formatted
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update API monitor configuration
   */
  async updateApi(req, res, next) {
    try {
      const { id } = req.params;
      const { name, endpoint, method, healthCheckEndpoint, monitoringInterval, status } = req.body;

      const existing = await prisma.api.findUnique({
        where: { id },
        include: { website: true }
      });

      if (!existing || (req.user.role !== 'ADMIN' && existing.website?.userId !== req.user.id)) {
        throw new NotFoundError('API not found');
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (endpoint) updateData.endpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      if (method) updateData.method = method.toUpperCase();
      if (healthCheckEndpoint !== undefined) updateData.healthCheckEndpoint = healthCheckEndpoint;
      if (monitoringInterval) updateData.monitoringInterval = monitoringInterval;
      if (status) updateData.status = status.toLowerCase();

      const updated = await prisma.api.update({
        where: { id },
        data: updateData
      });

      const formatted = await this.formatApi(updated);

      res.json({
        success: true,
        data: formatted
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete API monitor
   */
  async deleteApi(req, res, next) {
    try {
      const { id } = req.params;

      const existing = await prisma.api.findUnique({
        where: { id },
        include: { website: true }
      });

      if (!existing || (req.user.role !== 'ADMIN' && existing.website?.userId !== req.user.id)) {
        throw new NotFoundError('API not found');
      }

      await prisma.api.delete({ where: { id } });

      res.json({
        success: true,
        data: {
          message: 'API monitor deleted successfully'
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Manually trigger an on-demand live health check for an API
   * POST /api/v1/apis/:id/check
   */
  async checkApiHealthNow(req, res, next) {
    try {
      const { id } = req.params;

      const api = await prisma.api.findUnique({
        where: { id },
        include: { website: true }
      });

      // Strict tenant isolation: unowned APIs return 404
      if (!api || (req.user.role !== 'ADMIN' && api.website?.userId !== req.user.id)) {
        throw new NotFoundError('API not found');
      }

      const result = await apiHealthChecker.checkApiHealth(id);

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Format API entity with calculated percentiles, error rate, uptime, and correlated incident
   */
  async formatApi(api) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Fetch uptime
    const { uptime, totalRequests } = await uptimeService.getApiUptime(api.id, oneDayAgo);

    // Fetch metrics summary
    const metricData = await metricService.getApiMetrics(api.id, '24h');
    const { summary } = metricData;

    // Check for active correlated incident
    const activeIncident = await prisma.incident.findFirst({
      where: {
        apiId: api.id,
        status: { in: ['DETECTED', 'INVESTIGATING'] }
      },
      select: { id: true }
    });

    const isUnknown = api.status === 'UNKNOWN' || api.status === 'unknown';
    const isCritical = api.status === 'critical' || api.status === 'CRITICAL';
    const isDegraded = api.status === 'degraded' || api.status === 'DEGRADED';

    const requestsCount = summary.totalRequests || totalRequests || 0;
    const errorRate = summary.overallErrorRate !== undefined
      ? summary.overallErrorRate
      : 0.0;

    const p95Latency = summary.p95Latency || api.lastResponseTime || null;
    const p50Latency = summary.p50Latency || (api.lastResponseTime ? Math.round(api.lastResponseTime * 0.8) : null);
    const p99Latency = summary.p99Latency || (api.lastResponseTime ? Math.round(api.lastResponseTime * 1.5) : null);

    const intervalVal = Number(api.monitoringInterval) || 60;

    let lastResponseStr = '—';
    if (api.lastStatusCode) {
      lastResponseStr = `${api.lastStatusCode} ${api.lastCheckSuccess ? 'OK' : 'ERR'}`;
    }

    return {
      id: api.id,
      websiteId: api.websiteId,
      name: api.name,
      endpoint: api.endpoint,
      method: api.method,
      status: api.status,
      uptime: totalRequests > 0 ? uptime : null,
      p95Latency,
      p50Latency,
      p99Latency,
      errorRate,
      clientErrorRate: summary.clientErrorRate || 0,
      serverErrorRate: summary.serverErrorRate || 0,
      requestsCount,
      monitoringInterval: `${intervalVal}s`,
      monitoringIntervalSec: intervalVal,
      healthCheckEndpoint: api.healthCheckEndpoint || `${api.endpoint}/health`,
      expectedStatusCode: api.expectedStatusCode || 200,
      timeout: api.timeout || 10000,
      lastCheckedAt: api.lastCheckedAt || null,
      lastResponseTime: api.lastResponseTime || null,
      lastStatusCode: api.lastStatusCode || null,
      lastCheckSuccess: api.lastCheckSuccess !== undefined ? api.lastCheckSuccess : null,
      lastError: api.lastError || null,
      lastChecked: api.lastCheckedAt ? new Date(api.lastCheckedAt).toLocaleString() : 'Never',
      lastResponse: lastResponseStr,
      correlatedIncidentId: activeIncident ? activeIncident.id : null,
      endpointsTable: await this.getSubEndpointBreakdown(api, requestsCount, errorRate, p95Latency)
    };
  }

  /**
  /**
   * Dedicated endpoint handler: Get sub-endpoint breakdown for an API
   * GET /api/v1/apis/:id/sub-endpoints?timeRange=24h
   */
  async getSubEndpoints(req, res, next) {
    try {
      const { id } = req.params;
      const { timeRange = '24h' } = req.query;

      const api = await prisma.api.findUnique({
        where: { id },
        include: { website: true }
      });

      // Strict tenant isolation: unowned APIs return 404
      if (!api || (req.user.role !== 'ADMIN' && api.website?.userId !== req.user.id)) {
        throw new NotFoundError('API not found');
      }

      const formatted = await this.formatApi(api);
      const rows = await this.getSubEndpointBreakdown(
        api,
        formatted.requestsCount,
        formatted.errorRate,
        formatted.p95Latency,
        timeRange
      );

      res.json({
        success: true,
        data: rows
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Aggregate route-level performance dynamically from RequestMetric collection
   */
  async getSubEndpointBreakdown(api, requestsCount, errorRate, p95Latency, timeRange = '24h') {
    try {
      const db = require('../config/database');
      const RequestMetric = db?.models?.RequestMetric || db?.RequestMetric;
      const apiId = String(api.id || api._id);

      // Time range filter
      let timeFilter = null;
      const tr = String(timeRange || '24h').toLowerCase();
      if (tr === '1h') {
        timeFilter = new Date(Date.now() - 60 * 60 * 1000);
      } else if (tr === '7d') {
        timeFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      } else if (tr === '30d') {
        timeFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      } else {
        timeFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
      }

      const rows = [];
      const seenRoutes = new Set();

      // 1. Group metrics by endpoint and method using MongoDB aggregation if model supports it
      if (RequestMetric && typeof RequestMetric.aggregate === 'function') {
        const matchStage = { apiId };
        if (timeFilter) {
          matchStage.timestamp = { $gte: timeFilter };
        }

        const routeMetrics = await RequestMetric.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: {
                endpoint: '$endpoint',
                method: '$method'
              },
              total: { $sum: 1 },
              errors: {
                $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] }
              },
              latencies: { $push: '$responseTime' },
              lastStatus: { $last: '$statusCode' }
            }
          },
          { $sort: { total: -1 } }
        ]);

        for (const m of (routeMetrics || [])) {
          if (!m._id || !m._id.endpoint) continue;
          const method = (m._id.method || api.method || 'GET').toUpperCase();
          let ep = m._id.endpoint;
          try {
            if (ep.startsWith('http://') || ep.startsWith('https://')) {
              const parsed = new URL(ep);
              ep = parsed.pathname + (parsed.search || '');
            }
          } catch (_) {}
          if (!ep.startsWith('/')) ep = '/' + ep;

          const key = `${method} ${ep}`;
          if (seenRoutes.has(key)) continue;
          seenRoutes.add(key);

          const sorted = (m.latencies || []).sort((a, b) => a - b);
          const p95Idx = Math.floor(sorted.length * 0.95);
          const p95 = sorted[p95Idx] || sorted[sorted.length - 1] || Math.round(p95Latency || 50);
          const routeErrRate = m.total > 0 ? +((m.errors / m.total) * 100).toFixed(1) : 0;
          const status = m.lastStatus || (routeErrRate > 10 ? 500 : 200);

          rows.push({
            method,
            path: ep,
            endpoint: key,
            requests: m.total,
            errorRate: `${routeErrRate}%`,
            errorRateNum: routeErrRate,
            p95: `${p95}ms`,
            p95Num: p95,
            status
          });
        }
      }

      if (rows.length === 0 && api.endpoint) {
        let ep = api.endpoint;
        try {
          if (ep.startsWith('http://') || ep.startsWith('https://')) {
            const parsed = new URL(ep);
            ep = parsed.pathname + (parsed.search || '');
          }
        } catch (_) {}
        if (!ep.startsWith('/')) ep = '/' + ep;
        const method = (api.method || 'GET').toUpperCase();
        rows.push({
          method,
          path: ep,
          endpoint: `${method} ${ep}`,
          requests: requestsCount || 0,
          errorRate: `${errorRate || 0}%`,
          errorRateNum: errorRate || 0,
          p95: p95Latency ? `${p95Latency}ms` : '—',
          p95Num: p95Latency || 0,
          status: (errorRate || 0) > 10 ? 500 : 200
        });
      }

      return rows;
    } catch (err) {
      logger.error('Error computing sub-endpoints:', err);
      return [];
    }
  }
}

module.exports = new ApiController();
