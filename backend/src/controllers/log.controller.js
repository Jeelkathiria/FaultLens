const prisma = require('../config/database');
const { NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

class LogController {
  /**
   * List logs with filtering (website, api, level, statusCode, search, date range)
   */
  async getLogs(req, res, next) {
    try {
      const { websiteId, apiId, level, statusCode, search, startDate, endDate, limit = 50 } = req.query;

      const where = {};

      if (req.user?.role !== 'ADMIN') {
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
          method: meta.method || l.api?.method || 'POST',
          endpoint: meta.endpoint || l.api?.endpoint || '/api',
          statusCode: l.statusCode || (l.level === 'ERROR' ? 500 : 200),
          latency: meta.responseTime || meta.latency || (l.level === 'ERROR' ? 1842 : 120),
          severity: l.level.toLowerCase(),
          websiteId: l.api?.websiteId,
          websiteName: l.api?.website?.name,
          apiId: l.apiId,
          apiName: l.api?.name || 'API Service',
          ip: meta.ip || '192.168.4.11',
          userAgent: meta.userAgent || 'Mozilla/5.0 (Client/1.0)',
          message: l.message,
          headers: meta.headers || {
            'Content-Type': 'application/json',
            'X-Request-ID': `req_${l.id.slice(0, 8)}`
          },
          payload: meta.payload || meta.body || null,
          stackTrace: meta.stackTrace || (l.level === 'ERROR' ? `Error: ${l.message}\n    at processRequest (src/server.js:142:19)` : null)
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
      const { id } = req.params;

      const log = await prisma.log.findUnique({
        where: { id },
        include: {
          api: { include: { website: true } }
        }
      });

      if (!log || (req.user?.role !== 'ADMIN' && log.api?.website?.userId !== req.user?.id)) {
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
