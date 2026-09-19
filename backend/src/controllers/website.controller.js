const prisma = require('../config/database');
const { NotFoundError } = require('../utils/errors');
const uptimeService = require('../services/uptime.service');
const websiteMonitoringService = require('../services/websiteMonitoring.service');
const logger = require('../utils/logger');

class WebsiteController {
  constructor() {
    this.createWebsite = this.createWebsite.bind(this);
    this.getWebsites = this.getWebsites.bind(this);
    this.getWebsiteById = this.getWebsiteById.bind(this);
    this.updateWebsite = this.updateWebsite.bind(this);
    this.deleteWebsite = this.deleteWebsite.bind(this);
    this.formatWebsite = this.formatWebsite.bind(this);
    this.getWebsiteHealth = this.getWebsiteHealth.bind(this);
    this.getWebsiteChecks = this.getWebsiteChecks.bind(this);
    this.getWebsiteMetrics = this.getWebsiteMetrics.bind(this);
    this.updateWebsiteMonitoring = this.updateWebsiteMonitoring.bind(this);
    this.checkWebsiteNow = this.checkWebsiteNow.bind(this);
  }

  /**
   * Create a new monitored website.
   * Can be created with zero APIs (Case B) or with APIs later (Case A).
   * Automatically initializes website-level HTTP monitoring.
   */
  async createWebsite(req, res, next) {
    try {
      const {
        name,
        url,
        environment,
        description,
        monitoringEnabled,
        monitoringInterval,
        monitoringTimeout,
        expectedStatusCodes
      } = req.body;

      const website = await prisma.website.create({
        data: {
          userId: req.user.id,
          name,
          url: url.startsWith('http') ? url : `https://${url}`,
          environment: (environment || 'PRODUCTION').toUpperCase(),
          description: description || null,
          status: 'healthy',
          healthStatus: 'UNKNOWN',
          monitoringEnabled: monitoringEnabled !== undefined ? Boolean(monitoringEnabled) : true,
          monitoringInterval: Number(monitoringInterval) || 60,
          monitoringTimeout: Number(monitoringTimeout) || 10,
          expectedStatusCodes: Array.isArray(expectedStatusCodes) && expectedStatusCodes.length > 0
            ? expectedStatusCodes.map(Number)
            : [200]
        }
      });

      // Asynchronously trigger initial HTTP GET check
      websiteMonitoringService.checkWebsite(website.id).catch((err) => {
        logger.debug(`Initial website check note for ${website.id}: ${err.message}`);
      });

      const formatted = await this.formatWebsite(website);

      res.status(201).json({
        success: true,
        data: formatted
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List websites belonging to the user (or all if admin)
   */
  async getWebsites(req, res, next) {
    try {
      const where = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };

      const websites = await prisma.website.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          apis: {
            select: {
              id: true,
              status: true
            }
          }
        }
      });

      const formattedWebsites = await Promise.all(websites.map((w) => this.formatWebsite(w)));

      res.json({
        success: true,
        data: formattedWebsites
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single website details by ID (with strict tenant isolation)
   */
  async getWebsiteById(req, res, next) {
    try {
      const { id } = req.params;

      const website = await prisma.website.findUnique({
        where: { id },
        include: {
          apis: {
            include: {
              incidents: {
                where: { status: { in: ['DETECTED', 'INVESTIGATING'] } }
              }
            }
          }
        }
      });

      // Prefer 404 when outside accessible scope to avoid leaking existence
      if (!website || (req.user.role !== 'ADMIN' && website.userId !== req.user.id)) {
        throw new NotFoundError('Website not found');
      }

      const formatted = await this.formatWebsite(website);

      res.json({
        success: true,
        data: formatted
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update website details
   */
  async updateWebsite(req, res, next) {
    try {
      const { id } = req.params;
      const { name, url, environment, description, status } = req.body;

      const existing = await prisma.website.findUnique({ where: { id } });
      if (!existing || (req.user.role !== 'ADMIN' && existing.userId !== req.user.id)) {
        throw new NotFoundError('Website not found');
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (url) updateData.url = url.startsWith('http') ? url : `https://${url}`;
      if (environment) updateData.environment = environment.toUpperCase();
      if (description !== undefined) updateData.description = description;
      if (status) updateData.status = status.toLowerCase();

      const updated = await prisma.website.update({
        where: { id },
        data: updateData
      });

      const formatted = await this.formatWebsite(updated);

      res.json({
        success: true,
        data: formatted
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete website and cascade its child resources
   */
  async deleteWebsite(req, res, next) {
    try {
      const { id } = req.params;

      const existing = await prisma.website.findUnique({ where: { id } });
      if (!existing || (req.user.role !== 'ADMIN' && existing.userId !== req.user.id)) {
        throw new NotFoundError('Website not found');
      }

      await prisma.website.delete({ where: { id } });

      // Clean up website checks
      await prisma.websiteCheck.deleteMany({ where: { websiteId: id } });

      res.json({
        success: true,
        data: {
          message: 'Website and associated monitors deleted successfully'
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/websites/:id/health
   * Returns website HTTP health, child API health breakdown, and overall health
   */
  async getWebsiteHealth(req, res, next) {
    try {
      const { id } = req.params;

      const website = await prisma.website.findUnique({
        where: { id },
        include: { apis: true }
      });

      if (!website || (req.user.role !== 'ADMIN' && website.userId !== req.user.id)) {
        throw new NotFoundError('Website not found');
      }

      const httpHealth = website.healthStatus || 'UNKNOWN';
      const overall = await websiteMonitoringService.calculateOverallWebsiteHealth(website.id, httpHealth);

      res.json({
        success: true,
        data: {
          websiteId: website.id,
          name: website.name,
          url: website.url,
          httpHealth,
          overallStatus: overall.overallStatus,
          reason: overall.reason,
          lastCheckedAt: website.lastCheckedAt,
          lastSuccessfulCheckAt: website.lastSuccessfulCheckAt,
          lastResponseTime: website.lastResponseTime,
          lastStatusCode: website.lastStatusCode,
          sslValid: website.sslValid,
          consecutiveFailures: website.consecutiveFailures || 0,
          apisCount: (website.apis || []).length,
          apis: (website.apis || []).map((a) => ({
            id: a.id,
            name: a.name,
            endpoint: a.endpoint,
            status: a.status
          }))
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/websites/:id/checks
   * Returns historical HTTP probe checks
   */
  async getWebsiteChecks(req, res, next) {
    try {
      const { id } = req.params;
      const { limit, page } = req.query;

      const website = await prisma.website.findUnique({ where: { id } });
      if (!website || (req.user.role !== 'ADMIN' && website.userId !== req.user.id)) {
        throw new NotFoundError('Website not found');
      }

      const result = await websiteMonitoringService.getWebsiteChecks(id, { limit, page });

      res.json({
        success: true,
        data: result.checks,
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/websites/:id/metrics
   * Returns uptime, P50, P95, P99, status distribution, timeouts
   */
  async getWebsiteMetrics(req, res, next) {
    try {
      const { id } = req.params;
      const { timeRange = '24h' } = req.query;

      const website = await prisma.website.findUnique({ where: { id } });
      if (!website || (req.user.role !== 'ADMIN' && website.userId !== req.user.id)) {
        throw new NotFoundError('Website not found');
      }

      const metrics = await websiteMonitoringService.getWebsiteMetrics(id, timeRange);

      res.json({
        success: true,
        data: metrics
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/websites/:id/monitoring
   * Update website monitoring configuration
   */
  async updateWebsiteMonitoring(req, res, next) {
    try {
      const { id } = req.params;
      const {
        monitoringEnabled,
        monitoringInterval,
        monitoringTimeout,
        expectedStatusCodes
      } = req.body;

      const website = await prisma.website.findUnique({ where: { id } });
      if (!website || (req.user.role !== 'ADMIN' && website.userId !== req.user.id)) {
        throw new NotFoundError('Website not found');
      }

      const updateData = {};
      if (monitoringEnabled !== undefined) updateData.monitoringEnabled = Boolean(monitoringEnabled);
      if (monitoringInterval !== undefined) updateData.monitoringInterval = Number(monitoringInterval);
      if (monitoringTimeout !== undefined) updateData.monitoringTimeout = Number(monitoringTimeout);
      if (expectedStatusCodes !== undefined && Array.isArray(expectedStatusCodes)) {
        updateData.expectedStatusCodes = expectedStatusCodes.map(Number);
      }

      const updated = await prisma.website.update({
        where: { id },
        data: updateData
      });

      const formatted = await this.formatWebsite(updated);

      res.json({
        success: true,
        data: formatted
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/websites/:id/check
   * Run immediate on-demand HTTP health check
   */
  async checkWebsiteNow(req, res, next) {
    try {
      const { id } = req.params;

      const website = await prisma.website.findUnique({ where: { id } });
      if (!website || (req.user.role !== 'ADMIN' && website.userId !== req.user.id)) {
        throw new NotFoundError('Website not found');
      }

      const result = await websiteMonitoringService.checkWebsite(id);

      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Format website for frontend view
   */
  async formatWebsite(w) {
    const apiCount = await prisma.api.count({ where: { websiteId: w.id } });
    const activeIncidents = await prisma.incident.count({
      where: {
        websiteId: w.id,
        status: { in: ['DETECTED', 'INVESTIGATING'] }
      }
    });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const totalRequests24h = await prisma.requestMetric.count({
      where: {
        api: { websiteId: w.id },
        timestamp: { gte: oneDayAgo }
      }
    });

    const uptime = await uptimeService.getWebsiteUptime(w.id);

    // Fetch authentic rolling daily uptime history (30 days) from checks & incidents
    const uptimeHistory = await uptimeService.getWebsiteDailyUptimeHistory(w.id, 30);

    let lastCheckedStr = 'Never';
    if (w.lastCheckedAt) {
      const diffMs = Date.now() - new Date(w.lastCheckedAt).getTime();
      const sec = Math.floor(diffMs / 1000);
      if (sec < 60) lastCheckedStr = `${Math.max(1, sec)}s ago`;
      else if (sec < 3600) lastCheckedStr = `${Math.floor(sec / 60)}m ago`;
      else lastCheckedStr = `${Math.floor(sec / 3600)}h ago`;
    }

    return {
      id: w.id,
      name: w.name,
      url: w.url,
      displayUrl: w.url.replace(/^https?:\/\//, ''),
      environment: w.environment.charAt(0) + w.environment.slice(1).toLowerCase(),
      health: w.status || (w.healthStatus === 'UNKNOWN' ? 'unknown' : 'healthy'), // overall health
      healthStatus: w.healthStatus || 'UNKNOWN', // website HTTP health (UP, DEGRADED, DOWN, UNKNOWN)
      monitoringEnabled: w.monitoringEnabled !== false,
      monitoringInterval: w.monitoringInterval || 60,
      monitoringTimeout: w.monitoringTimeout || 10,
      expectedStatusCodes: w.expectedStatusCodes || [200],
      lastResponseTime: w.lastResponseTime,
      lastStatusCode: w.lastStatusCode,
      lastCheckedAt: w.lastCheckedAt,
      lastSuccessfulCheckAt: w.lastSuccessfulCheckAt,
      lastError: w.lastError,
      sslValid: w.sslValid,
      consecutiveFailures: w.consecutiveFailures || 0,
      uptime,
      apiCount,
      totalRequests24h: totalRequests24h || 0,
      activeIncidents,
      lastChecked: lastCheckedStr,
      description: w.description || 'Configured application gateway',
      createdDate: w.createdAt ? new Date(w.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      uptimeHistory
    };
  }
}

module.exports = new WebsiteController();
