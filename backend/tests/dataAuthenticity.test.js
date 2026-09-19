const prisma = require('../src/config/database');
const websiteController = require('../src/controllers/website.controller');
const apiController = require('../src/controllers/api.controller');
const adminController = require('../src/controllers/admin.controller');
const uptimeService = require('../src/services/uptime.service');

describe('DATA AUTHENTICITY RULE — NON-NEGOTIABLE Verification', () => {
  beforeEach(() => {
    jest.spyOn(prisma.api, 'findMany').mockResolvedValue([]);
    jest.spyOn(prisma.api, 'count').mockResolvedValue(0);
    jest.spyOn(prisma.requestMetric, 'count').mockResolvedValue(0);
    jest.spyOn(prisma.requestMetric, 'findMany').mockResolvedValue([]);
    if (prisma.metricAggregate) {
      jest.spyOn(prisma.metricAggregate, 'findMany').mockResolvedValue([]);
    }
    if (prisma.models?.RequestMetric?.aggregate) {
      jest.spyOn(prisma.models.RequestMetric, 'aggregate').mockResolvedValue([]);
    }
    jest.spyOn(prisma.incident, 'count').mockResolvedValue(0);
    jest.spyOn(prisma.incident, 'findMany').mockResolvedValue([]);
    jest.spyOn(prisma.incident, 'findFirst').mockResolvedValue(null);
    jest.spyOn(prisma.website, 'count').mockResolvedValue(0);
    if (prisma.websiteCheck) {
      jest.spyOn(prisma.websiteCheck, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.websiteCheck, 'count').mockResolvedValue(0);
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Website Data Authenticity', () => {
    it('must return totalRequests24h = 0 (never fallback 12400) when no request metrics exist', async () => {
      const mockWebsite = {
        id: 'w-portfolio-authentic',
        name: 'Portfolio',
        url: 'https://jeel.dev',
        environment: 'PRODUCTION',
        healthStatus: 'UP',
        monitoringEnabled: true,
        monitoringInterval: 60,
        expectedStatusCodes: [200],
        lastResponseTime: 45,
        lastStatusCode: 200,
        lastCheckedAt: new Date(),
        consecutiveFailures: 0
      };

      const formatted = await websiteController.formatWebsite(mockWebsite);
      expect(formatted.totalRequests24h).toBe(0);
      expect(formatted.totalRequests24h).not.toBe(12400);
    });

    it('must return daily uptime history with null for unmonitored days instead of fake 1.0 or artificial dips', async () => {
      const history = await uptimeService.getWebsiteDailyUptimeHistory('w-non-existent-site', 7);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(7);
      // All 7 days should be null since no checks exist
      expect(history.every((val) => val === null)).toBe(true);
      // Must NOT contain synthetic dip values like 0.95 or 0.91
      expect(history).not.toContain(0.95);
      expect(history).not.toContain(0.91);
    });
  });

  describe('API Data Authenticity', () => {
    it('must return 0 requests and null latency (never 1200 or 120ms fallback) for unmonitored APIs', async () => {
      const mockApi = {
        id: 'api-fresh',
        websiteId: 'w-portfolio',
        name: 'Health Endpoint',
        endpoint: '/health',
        method: 'GET',
        status: 'unknown',
        monitoringInterval: 60
      };

      const formatted = await apiController.formatApi(mockApi);
      expect(formatted.requestsCount).toBe(0);
      expect(formatted.requestsCount).not.toBe(1200);
      expect(formatted.errorRate).toBe(0.0);
      expect(formatted.errorRate).not.toBe(17.8);
      expect(formatted.errorRate).not.toBe(0.1);
      expect(formatted.p95Latency).toBeNull();
      expect(formatted.p50Latency).toBeNull();
      expect(formatted.p99Latency).toBeNull();
    });

    it('must return only genuine registered endpoint (never synthetic /charge or /refund) when no routes have telemetry', async () => {
      const mockApi = {
        id: 'api-payment-fresh',
        websiteId: 'w-shopsphere',
        name: 'Payment API',
        endpoint: '/api/v1/payments',
        method: 'POST'
      };

      const rows = await apiController.getSubEndpointBreakdown(mockApi, 0, 0, 0, '24h');
      expect(Array.isArray(rows)).toBe(true);
      // Must contain only the registered primary endpoint with 0 requests
      expect(rows.length).toBe(1);
      expect(rows[0].endpoint).toBe('POST /api/v1/payments');
      expect(rows[0].requests).toBe(0);

      // Must NOT contain synthetic demo routes
      const hasFakeCharge = rows.some((r) => r.path?.includes('/charge'));
      const hasFakeRefund = rows.some((r) => r.path?.includes('/refund'));
      expect(hasFakeCharge).toBe(false);
      expect(hasFakeRefund).toBe(false);
    });
  });

  describe('Admin Platform Observability Authenticity', () => {
    it('must return genuine Node.js memory and system metrics', async () => {
      let responseData = null;
      const mockReq = {};
      const mockRes = {
        json: (payload) => {
          responseData = payload;
        }
      };
      const mockNext = jest.fn();

      await adminController.getSystemHealth(mockReq, mockRes, mockNext);

      expect(responseData).toBeDefined();
      expect(responseData.success).toBe(true);
      expect(responseData.data.systemMetrics).toBeDefined();

      const { memoryUsage, eventsPerSec, queueSize } = responseData.data.systemMetrics;
      // Memory usage must be formatted from actual process.memoryUsage()
      expect(memoryUsage).toMatch(/\d+%\s\(\d+MB\s\/\s\d+MB\)/);
      expect(typeof eventsPerSec).toBe('number');
      expect(typeof queueSize).toBe('number');

      // 24-hour platform throughput must be a 24-point array derived from real database timestamps
      expect(Array.isArray(responseData.data.hourlyThroughput)).toBe(true);
      expect(responseData.data.hourlyThroughput.length).toBe(24);
    });
  });
});
