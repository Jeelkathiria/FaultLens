const http = require('http');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const env = require('../src/config/env');
const prisma = require('../src/config/database');
const websiteMonitoringService = require('../src/services/websiteMonitoring.service');

describe('Website HTTP Monitoring Service & Architecture Tests', () => {
  let server;
  let serverPort;
  let serverResponseCode = 200;
  let serverResponseDelay = 0;

  const mockUsers = {
    admin: { id: 'usr-admin', name: 'Platform Admin', email: 'admin@faultlens.dev', role: 'ADMIN' },
    dev1: { id: 'usr-dev1', name: 'Developer 1', email: 'developer@faultlens.dev', role: 'DEVELOPER' },
    dev2: { id: 'usr-dev2', name: 'Developer 2', email: 'dev2@faultlens.dev', role: 'DEVELOPER' }
  };

  let dev1Token;
  let dev2Token;
  let adminToken;

  // In-memory mock websites
  let mockWebsites = [];
  let mockChecks = [];
  let mockIncidents = [];
  let mockApis = [];

  beforeAll((done) => {
    dev1Token = jwt.sign({ userId: mockUsers.dev1.id, role: mockUsers.dev1.role }, env.JWT_SECRET, { expiresIn: '1h' });
    dev2Token = jwt.sign({ userId: mockUsers.dev2.id, role: mockUsers.dev2.role }, env.JWT_SECRET, { expiresIn: '1h' });
    adminToken = jwt.sign({ userId: mockUsers.admin.id, role: mockUsers.admin.role }, env.JWT_SECRET, { expiresIn: '1h' });

    server = http.createServer((req, res) => {
      const delay = serverResponseDelay;
      setTimeout(() => {
        res.writeHead(serverResponseCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: serverResponseCode === 200 ? 'ok' : 'error', time: Date.now() }));
      }, delay);
    });

    server.listen(0, '127.0.0.1', () => {
      serverPort = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    serverResponseCode = 200;
    serverResponseDelay = 0;

    mockWebsites = [
      {
        id: 'w-portfolio',
        userId: 'usr-dev1',
        name: 'Portfolio Website',
        url: `http://127.0.0.1:${serverPort}`,
        environment: 'PRODUCTION',
        status: 'healthy',
        healthStatus: 'UNKNOWN',
        monitoringEnabled: true,
        monitoringInterval: 60,
        monitoringTimeout: 5,
        expectedStatusCodes: [200],
        consecutiveFailures: 0,
        lastCheckedAt: null,
        lastResponseTime: null,
        lastStatusCode: null
      },
      {
        id: 'w-dev2site',
        userId: 'usr-dev2',
        name: 'Dev2 Site',
        url: `http://127.0.0.1:${serverPort}`,
        environment: 'PRODUCTION',
        status: 'healthy',
        healthStatus: 'UNKNOWN',
        monitoringEnabled: true,
        monitoringInterval: 60,
        monitoringTimeout: 5,
        expectedStatusCodes: [200],
        consecutiveFailures: 0,
        lastCheckedAt: null
      }
    ];

    mockChecks = [];
    mockIncidents = [];
    mockApis = [];

    // Mock DB operations
    jest.spyOn(prisma.user, 'findUnique').mockImplementation(({ where }) => {
      const u = Object.values(mockUsers).find((x) => x.id === where.id);
      return Promise.resolve(u || null);
    });

    jest.spyOn(prisma.website, 'findUnique').mockImplementation(({ where }) => {
      const w = mockWebsites.find((x) => x.id === where.id);
      if (w) {
        return Promise.resolve({
          ...w,
          apis: mockApis.filter((a) => a.websiteId === w.id)
        });
      }
      return Promise.resolve(null);
    });

    jest.spyOn(prisma.website, 'findMany').mockImplementation(({ where } = {}) => {
      let list = [...mockWebsites];
      if (where && where.userId) {
        list = list.filter((w) => w.userId === where.userId);
      }
      return Promise.resolve(list);
    });

    jest.spyOn(prisma.website, 'update').mockImplementation(({ where, data }) => {
      const idx = mockWebsites.findIndex((x) => x.id === where.id);
      if (idx !== -1) {
        mockWebsites[idx] = { ...mockWebsites[idx], ...data };
        return Promise.resolve(mockWebsites[idx]);
      }
      return Promise.resolve(null);
    });

    jest.spyOn(prisma.websiteCheck, 'create').mockImplementation(({ data }) => {
      const item = { id: `chk-${Date.now()}-${Math.random()}`, ...data };
      mockChecks.push(item);
      return Promise.resolve(item);
    });

    jest.spyOn(prisma.websiteCheck, 'findMany').mockImplementation(({ where } = {}) => {
      let list = [...mockChecks];
      if (where && where.websiteId) {
        list = list.filter((c) => c.websiteId === where.websiteId);
      }
      return Promise.resolve(list.reverse());
    });

    jest.spyOn(prisma.websiteCheck, 'count').mockImplementation(({ where } = {}) => {
      if (where && where.websiteId) {
        return Promise.resolve(mockChecks.filter((c) => c.websiteId === where.websiteId).length);
      }
      return Promise.resolve(mockChecks.length);
    });

    jest.spyOn(prisma.api, 'findMany').mockImplementation(({ where } = {}) => {
      let list = [...mockApis];
      if (where && where.websiteId) {
        list = list.filter((a) => a.websiteId === where.websiteId);
      }
      return Promise.resolve(list);
    });

    jest.spyOn(prisma.incident, 'findFirst').mockImplementation(({ where } = {}) => {
      const found = mockIncidents.find((i) => {
        if (where.websiteId && i.websiteId !== where.websiteId) return false;
        if (where.apiId === null && i.apiId !== null) return false;
        if (where.status && where.status.in && !where.status.in.includes(i.status)) return false;
        return true;
      });
      return Promise.resolve(found || null);
    });

    jest.spyOn(prisma.incident, 'findUnique').mockImplementation(({ where } = {}) => {
      const found = mockIncidents.find((i) => i.id === where.id);
      return Promise.resolve(found || null);
    });

    jest.spyOn(prisma.incident, 'create').mockImplementation(({ data }) => {
      const inc = {
        id: `inc-${mockIncidents.length + 1}`,
        apiId: data.apiId || null,
        websiteId: data.websiteId,
        title: data.title,
        description: data.description,
        severity: data.severity || 'critical',
        status: data.status || 'DETECTED',
        events: []
      };
      mockIncidents.push(inc);
      return Promise.resolve(inc);
    });

    jest.spyOn(prisma.incident, 'update').mockImplementation(({ where, data }) => {
      const idx = mockIncidents.findIndex((i) => i.id === where.id);
      if (idx !== -1) {
        mockIncidents[idx] = { ...mockIncidents[idx], ...data };
        return Promise.resolve(mockIncidents[idx]);
      }
      return Promise.resolve(null);
    });

    jest.spyOn(prisma.incidentEvent, 'create').mockResolvedValue({ id: 'evt-1' });
  });

  describe('1. Website with No APIs (Case B)', () => {
    test('HTTP probe runs, sets healthStatus to UP, overall to healthy, and records check', async () => {
      serverResponseCode = 200;

      const result = await websiteMonitoringService.checkWebsite('w-portfolio');

      expect(result.success).toBe(true);
      expect(result.health.healthStatus).toBe('UP');
      expect(result.health.status).toBe('healthy');
      expect(result.health.statusCode).toBe(200);
      expect(result.health.responseTime).toBeGreaterThanOrEqual(0);

      // Check stored in MongoDB
      expect(mockChecks.length).toBe(1);
      expect(mockChecks[0].status).toBe('UP');
      expect(mockChecks[0].statusCode).toBe(200);

      // Verify website was updated
      const updatedSite = mockWebsites.find((w) => w.id === 'w-portfolio');
      expect(updatedSite.healthStatus).toBe('UP');
      expect(updatedSite.status).toBe('healthy');
      expect(updatedSite.consecutiveFailures).toBe(0);
    });

    test('Uptime and P50/P95/P99 latency calculations calculate from real stored checks', async () => {
      // Simulate stored checks
      const latencies = [50, 60, 70, 80, 90, 100, 120, 150, 200, 300];
      for (const lat of latencies) {
        mockChecks.push({
          websiteId: 'w-portfolio',
          status: 'UP',
          statusCode: 200,
          responseTime: lat,
          timeout: false,
          timestamp: new Date()
        });
      }

      const metrics = await websiteMonitoringService.getWebsiteMetrics('w-portfolio', '24h');

      expect(metrics.totalChecks).toBe(10);
      expect(metrics.successfulChecks).toBe(10);
      expect(metrics.uptime).toBe(100.0);
      expect(metrics.p50).toBeGreaterThanOrEqual(50);
      expect(metrics.p95).toBeGreaterThanOrEqual(150);
      expect(metrics.p99).toBeGreaterThanOrEqual(200);
      expect(metrics.httpStatusDistribution['200']).toBe(10);
    });
  });

  describe('2. Website Failure & Consecutive Failure Incident Creation', () => {
    test('First failure sets DOWN and increments consecutiveFailures without immediately raising incident', async () => {
      serverResponseCode = 500;

      await websiteMonitoringService.checkWebsite('w-portfolio');

      const site = mockWebsites.find((w) => w.id === 'w-portfolio');
      expect(site.healthStatus).toBe('DOWN');
      expect(site.status).toBe('critical');
      expect(site.consecutiveFailures).toBe(1);
      expect(mockIncidents.length).toBe(0); // Not yet 2 consecutive failures
    });

    test('Second consecutive failure triggers automated website outage incident', async () => {
      serverResponseCode = 500;

      // 1st failure
      await websiteMonitoringService.checkWebsite('w-portfolio');
      // 2nd failure
      await websiteMonitoringService.checkWebsite('w-portfolio');

      const site = mockWebsites.find((w) => w.id === 'w-portfolio');
      expect(site.healthStatus).toBe('DOWN');
      expect(site.consecutiveFailures).toBe(2);

      expect(mockIncidents.length).toBe(1);
      expect(mockIncidents[0].websiteId).toBe('w-portfolio');
      expect(mockIncidents[0].apiId).toBeNull();
      expect(mockIncidents[0].severity).toBe('critical');
      expect(mockIncidents[0].title).toContain('Website Outage: Portfolio Website');
    });
  });

  describe('3. Website Degradation Detection (Statistical Baseline Anomaly)', () => {
    test('Significant latency regression beyond 2.5σ from historical baseline marks website DEGRADED', async () => {
      // Establish normal baseline (mean ~100ms, low variance)
      const normalLatencies = [95, 100, 105, 98, 102, 100, 97, 103];
      for (const lat of normalLatencies) {
        mockChecks.push({
          websiteId: 'w-portfolio',
          status: 'UP',
          statusCode: 200,
          responseTime: lat,
          timeout: false,
          timestamp: new Date()
        });
      }

      // Induce 500ms delay on mock server (> 2.5σ above 100ms baseline)
      serverResponseDelay = 500;
      serverResponseCode = 200;

      const result = await websiteMonitoringService.checkWebsite('w-portfolio');

      expect(result.health.healthStatus).toBe('DEGRADED');
      expect(result.health.status).toBe('degraded');

      const site = mockWebsites.find((w) => w.id === 'w-portfolio');
      expect(site.healthStatus).toBe('DEGRADED');
      expect(site.status).toBe('degraded');
    });
  });

  describe('4. Recovery Detection', () => {
    test('Website in DOWN state with active incident recovers to UP and auto-resolves incident', async () => {
      // 1. Induce failure and create incident
      serverResponseCode = 500;
      await websiteMonitoringService.checkWebsite('w-portfolio');
      await websiteMonitoringService.checkWebsite('w-portfolio');
      expect(mockIncidents.length).toBe(1);
      expect(mockIncidents[0].status).toBe('DETECTED');

      // 2. Recover server to 200 OK
      serverResponseCode = 200;
      serverResponseDelay = 0;
      await websiteMonitoringService.checkWebsite('w-portfolio');

      const site = mockWebsites.find((w) => w.id === 'w-portfolio');
      expect(site.healthStatus).toBe('UP');
      expect(site.status).toBe('healthy');
      expect(site.consecutiveFailures).toBe(0);

      // Incident should be resolved
      expect(mockIncidents[0].status).toBe('RESOLVED');
      expect(mockIncidents[0].severity).toBe('resolved');
    });
  });

  describe('5. Multi-Tenant Isolation & 404 Defense', () => {
    test('Developer 1 accessing Developer 2 website health -> returns 404 Not Found', async () => {
      const res = await request(app)
        .get('/api/v1/websites/w-dev2site/health')
        .set('Authorization', `Bearer ${dev1Token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    test('Developer 1 accessing Developer 2 website checks -> returns 404 Not Found', async () => {
      const res = await request(app)
        .get('/api/v1/websites/w-dev2site/checks')
        .set('Authorization', `Bearer ${dev1Token}`);

      expect(res.statusCode).toBe(404);
    });

    test('Developer 1 accessing Developer 2 website metrics -> returns 404 Not Found', async () => {
      const res = await request(app)
        .get('/api/v1/websites/w-dev2site/metrics')
        .set('Authorization', `Bearer ${dev1Token}`);

      expect(res.statusCode).toBe(404);
    });

    test('Developer 1 updating Developer 2 website monitoring config -> returns 404 Not Found', async () => {
      const res = await request(app)
        .patch('/api/v1/websites/w-dev2site/monitoring')
        .set('Authorization', `Bearer ${dev1Token}`)
        .send({ monitoringInterval: 120 });

      expect(res.statusCode).toBe(404);
    });

    test('Developer 1 accessing their own website monitoring endpoints -> returns 200 OK', async () => {
      const healthRes = await request(app)
        .get('/api/v1/websites/w-portfolio/health')
        .set('Authorization', `Bearer ${dev1Token}`);

      expect(healthRes.statusCode).toBe(200);
      expect(healthRes.body.data.websiteId).toBe('w-portfolio');

      const metricsRes = await request(app)
        .get('/api/v1/websites/w-portfolio/metrics')
        .set('Authorization', `Bearer ${dev1Token}`);

      expect(metricsRes.statusCode).toBe(200);
      expect(metricsRes.body.data).toHaveProperty('uptime');
      expect(metricsRes.body.data).toHaveProperty('p50');
      expect(metricsRes.body.data).toHaveProperty('p95');
      expect(metricsRes.body.data).toHaveProperty('p99');
    });

    test('Admin accessing Developer 2 website health -> returns 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/websites/w-dev2site/health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.websiteId).toBe('w-dev2site');
    });
  });

  describe('6. API Coexistence & Separate Health Signals', () => {
    test('Website HTTP probe UP but one child API is CRITICAL -> overall website is critical with reason', async () => {
      mockApis = [
        { id: 'api-login', websiteId: 'w-portfolio', name: 'Login API', status: 'healthy' },
        { id: 'api-payment', websiteId: 'w-portfolio', name: 'Payment API', status: 'critical' }
      ];

      const overall = await websiteMonitoringService.calculateOverallWebsiteHealth('w-portfolio', 'UP');

      expect(overall.overallStatus).toBe('critical');
      expect(overall.reason).toContain('Website reachable, but critical API is failing');
    });

    test('Website HTTP probe UP and child APIs healthy -> overall website is healthy', async () => {
      mockApis = [
        { id: 'api-login', websiteId: 'w-portfolio', name: 'Login API', status: 'healthy' },
        { id: 'api-products', websiteId: 'w-portfolio', name: 'Products API', status: 'healthy' }
      ];

      const overall = await websiteMonitoringService.calculateOverallWebsiteHealth('w-portfolio', 'UP');

      expect(overall.overallStatus).toBe('healthy');
      expect(overall.reason).toContain('Website and all registered APIs are operational');
    });

    test('Website HTTP probe DOWN makes overall website critical regardless of APIs', async () => {
      mockApis = [
        { id: 'api-login', websiteId: 'w-portfolio', name: 'Login API', status: 'healthy' }
      ];

      const overall = await websiteMonitoringService.calculateOverallWebsiteHealth('w-portfolio', 'DOWN');

      expect(overall.overallStatus).toBe('critical');
      expect(overall.reason).toContain('Website HTTP endpoint is unreachable');
    });
  });
});
