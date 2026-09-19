const prisma = require('../config/database');
const { NotFoundError, UnauthorizedError } = require('../utils/errors');
const logger = require('../utils/logger');

class LogController {
  /**
   * List logs with filtering (website, api, level, statusCode, search, date range)
   */
  async getLogs(req, res, next) {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User authentication required');
      }

      const { websiteId, apiId, level, statusCode, search, startDate, endDate, limit = 50 } = req.query;

      const where = {};

      if (req.user.role !== 'ADMIN') {
        const userWebsites = await prisma.website.findMany({
          where: { userId: req.user.id },
          select: { id: true }
        });
        const userWebsiteIds = userWebsites.map((w) => w.id);

        if (websiteId && !userWebsiteIds.includes(websiteId)) {
          throw new NotFoundError('Website not found');
        }

        if (apiId) {
          const api = await prisma.api.findUnique({
            where: { id: apiId },
            select: { websiteId: true }
          });
          if (!api || !userWebsiteIds.includes(api.websiteId)) {
            throw new NotFoundError('API not found');
          }
        }

        where.api = { website: { userId: req.user.id } };
      }

      if (apiId) {
        where.apiId = apiId;
      }

      if (websiteId) {
        where.api = { ...(where.api || {}), websiteId };
      }

      if (level && level !== 'ALL') where.level = level.toUpperCase();
      if (statusCode && statusCode !== 'ALL') where.statusCode = parseInt(statusCode, 10);

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }

      if (search) {
        where.OR = [
          { message: { contains: search, mode: 'insensitive' } },
          { api: { name: { contains: search, mode: 'insensitive' } } },
          { api: { endpoint: { contains: search, mode: 'insensitive' } } }
        ];
      }

      const logs = await prisma.log.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit, 10),
        include: {
          api: {
            include: { website: true }
          }
        }
      });

      const formatted = logs.map((l) => {
        const d = new Date(l.timestamp);
        const timeStr = d.toTimeString().split(' ')[0];
        const meta = l.metadata || {};

        return {
          id: l.id,
          timestamp: timeStr,
          fullTimestamp: d.toISOString().replace('T', ' ').replace('Z', ''),
          method: meta.method || l.api?.method || null,
          endpoint: meta.endpoint || l.api?.endpoint || null,
          statusCode: l.statusCode || null,
          latency: meta.responseTime !== undefined ? meta.responseTime : meta.latency !== undefined ? meta.latency : null,
          severity: l.level ? l.level.toLowerCase() : 'info',
          websiteId: l.api?.websiteId || null,
          websiteName: l.api?.website?.name || null,
          apiId: l.apiId || null,
          apiName: l.api?.name || null,
          ip: meta.ip || null,
          userAgent: meta.userAgent || null,
          message: l.message,
          headers: meta.headers || null,
          payload: meta.payload || meta.body || null,
          stackTrace: meta.stackTrace || null
        };
      });

      res.json({
        success: true,
        data: formatted
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single log entry by ID
   */
  async getLogById(req, res, next) {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User authentication required');
      }

      const { id } = req.params;

      const log = await prisma.log.findUnique({
        where: { id },
        include: {
          api: { include: { website: true } }
        }
      });

      if (!log || (req.user.role !== 'ADMIN' && log.api?.website?.userId !== req.user.id)) {
        throw new NotFoundError('Log entry not found');
      }

      res.json({
        success: true,
        data: log
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new LogController();
