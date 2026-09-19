const metricService = require('../services/metric.service');
const monitoringService = require('../services/monitoring.service');
const prisma = require('../config/database');
const { NotFoundError, UnauthorizedError } = require('../utils/errors');

class MetricController {
  /**
   * Ingest incoming telemetry payload from client or SDK
   */
  async ingestTelemetry(req, res, next) {
    try {
      // req.user is hydrated from the API Key in authenticateApiKey middleware
      const result = await monitoringService.ingestTelemetry(req.body, req.user);

      res.status(202).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get dashboard summary overview
   */
  async getDashboardSummary(req, res, next) {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const summary = await metricService.getDashboardSummary(
        req.user.id,
        req.user.role === 'ADMIN'
      );

      res.json({
        success: true,
        data: summary
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get global or tenant dashboard time-series metrics
   */
  async getDashboardMetrics(req, res, next) {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const timeRange = req.query.timeRange || '24h';
      const metricType = req.query.metricType || 'requests'; // requests | errorRate | latency

      // Find user's first API or Payment API as key sample, or aggregates across user's APIs
      const userWebsiteWhere = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
      const apis = await prisma.api.findMany({
        where: { website: userWebsiteWhere },
        select: { id: true, name: true }
      });

      const primaryApi = apis.find((a) => a.name.toLowerCase().includes('payment')) || apis[0];

      if (primaryApi) {
        const metrics = await metricService.getApiMetrics(primaryApi.id, timeRange);
        return res.json({
          success: true,
          data: metrics
        });
      }

      // Return empty timeseries if no APIs exist yet for this developer
      res.json({
        success: true,
        data: {
          timeRange,
          summary: { totalRequests: 0, overallErrorRate: 0, p95Latency: 0 },
          timeSeries: []
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get specific API's time-series metrics
   */
  async getApiMetrics(req, res, next) {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const { apiId } = req.params;
      const timeRange = req.query.timeRange || '24h';

      const api = await prisma.api.findUnique({
        where: { id: apiId },
        include: { website: true }
      });

      // Prefer 404 when outside accessible scope to avoid revealing existence
      if (!api || (req.user.role !== 'ADMIN' && api.website?.userId !== req.user.id)) {
        throw new NotFoundError('API not found');
      }

      const metrics = await metricService.getApiMetrics(apiId, timeRange);

      res.json({
        success: true,
        data: metrics
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * System health status check
   */
  async getHealth(req, res, next) {
    try {
      const health = await metricService.getSystemHealthMetrics();
      res.json({
        success: true,
        data: health
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MetricController();
