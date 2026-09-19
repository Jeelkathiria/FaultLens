const http = require('http');
const apiHealthChecker = require('../src/services/apiHealthChecker.service');
const prisma = require('../src/config/database');
const uptimeService = require('../src/services/uptime.service');
const monitoringService = require('../src/services/monitoring.service');

describe('Live API Health Checker Service', () => {
  let server;
  let serverPort;

  beforeAll((done) => {
    jest.spyOn(prisma.website, 'findUnique').mockResolvedValue({ id: 'test-web-1', url: 'http://127.0.0.1' });
    jest.spyOn(prisma.website, 'update').mockResolvedValue({});
    jest.spyOn(prisma.requestMetric, 'findMany').mockResolvedValue([]);
    jest.spyOn(prisma.requestMetric, 'create').mockResolvedValue({});
    jest.spyOn(prisma.log, 'create').mockResolvedValue({});
    jest.spyOn(uptimeService, 'calculateWebsiteHealth').mockResolvedValue('healthy');
    jest.spyOn(monitoringService, 'evaluateLiveTelemetry').mockResolvedValue();

    server = http.createServer((req, res) => {
      if (req.url === '/test-success') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', time: Date.now() }));
      } else if (req.url === '/test-error-500') {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      } else if (req.url === '/test-error-404') {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
      } else if (req.url === '/test-slow') {
        setTimeout(() => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ slow: true }));
        }, 300);
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(0, '127.0.0.1', () => {
      serverPort = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  test('URL resolution correctly handles full URLs and relative paths', () => {
    const apiAbsolute = { endpoint: 'https://jsonplaceholder.typicode.com/posts/1', healthCheckEndpoint: null };
    const website = { url: 'https://example.com' };
    expect(apiHealthChecker.resolveTargetUrl(apiAbsolute, website)).toBe('https://jsonplaceholder.typicode.com/posts/1');

    const apiRelative = { endpoint: '/api/v1/users', healthCheckEndpoint: '/health' };
    expect(apiHealthChecker.resolveTargetUrl(apiRelative, website)).toBe('https://example.com/health');

    const apiNoLeadingSlash = { endpoint: 'posts/1' };
    expect(apiHealthChecker.resolveTargetUrl(apiNoLeadingSlash, website)).toBe('https://example.com/posts/1');
  });

  test('Performs real HTTP check and returns HEALTHY on 200 OK with measured responseTime', async () => {
    const mockApi = {
      id: 'test-api-200',
      websiteId: 'test-web-1',
      name: 'Test 200 API',
      endpoint: `http://127.0.0.1:${serverPort}/test-success`,
      method: 'GET',
      expectedStatusCode: 200,
      timeout: 5000,
      status: 'UNKNOWN'
    };

    jest.spyOn(prisma.api, 'findUnique').mockResolvedValue(mockApi);
    jest.spyOn(prisma.api, 'update').mockImplementation(({ data }) => Promise.resolve({ ...mockApi, ...data }));
    jest.spyOn(prisma.requestMetric, 'create').mockResolvedValue({ id: 'metric-1' });

    const result = await apiHealthChecker.checkApiHealth(mockApi.id);

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.status).toBe('HEALTHY');
    expect(result.responseTime).toBeGreaterThanOrEqual(0);
    expect(result.error).toBeNull();
  });

  test('Performs real HTTP check and returns DEGRADED / not HEALTHY on 404', async () => {
    const mockApi = {
      id: 'test-api-404',
      websiteId: 'test-web-1',
      name: 'Test 404 API',
      endpoint: `http://127.0.0.1:${serverPort}/test-error-404`,
      method: 'GET',
      expectedStatusCode: 200,
      timeout: 5000,
      status: 'UNKNOWN'
    };

    jest.spyOn(prisma.api, 'findUnique').mockResolvedValue(mockApi);
    jest.spyOn(prisma.api, 'update').mockImplementation(({ data }) => Promise.resolve({ ...mockApi, ...data }));
    jest.spyOn(prisma.requestMetric, 'create').mockResolvedValue({ id: 'metric-2' });

    const result = await apiHealthChecker.checkApiHealth(mockApi.id);

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(404);
    expect(result.status).not.toBe('HEALTHY');
    expect(result.error).toContain('404');
  });

  test('Performs real HTTP check and returns CRITICAL on 500', async () => {
    const mockApi = {
      id: 'test-api-500',
      websiteId: 'test-web-1',
      name: 'Test 500 API',
      endpoint: `http://127.0.0.1:${serverPort}/test-error-500`,
      method: 'GET',
      expectedStatusCode: 200,
      timeout: 5000,
      status: 'UNKNOWN'
    };

    jest.spyOn(prisma.api, 'findUnique').mockResolvedValue(mockApi);
    jest.spyOn(prisma.api, 'update').mockImplementation(({ data }) => Promise.resolve({ ...mockApi, ...data }));
    jest.spyOn(prisma.requestMetric, 'create').mockResolvedValue({ id: 'metric-3' });

    const result = await apiHealthChecker.checkApiHealth(mockApi.id);

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(500);
    expect(result.status).toBe('CRITICAL');
  });

  test('Handles timeout gracefully without crashing', async () => {
    const mockApi = {
      id: 'test-api-timeout',
      websiteId: 'test-web-1',
      name: 'Test Timeout API',
      endpoint: `http://127.0.0.1:${serverPort}/test-slow`,
      method: 'GET',
      expectedStatusCode: 200,
      timeout: 50, // Short timeout
      status: 'UNKNOWN'
    };

    jest.spyOn(prisma.api, 'findUnique').mockResolvedValue(mockApi);
    jest.spyOn(prisma.api, 'update').mockImplementation(({ data }) => Promise.resolve({ ...mockApi, ...data }));
    jest.spyOn(prisma.requestMetric, 'create').mockResolvedValue({ id: 'metric-4' });

    const result = await apiHealthChecker.checkApiHealth(mockApi.id);

    expect(result.success).toBe(false);
    expect(result.status).toBe('CRITICAL');
    expect(result.error).toContain('timed out');
  });

  test('Handles connection failure / invalid host gracefully', async () => {
    const mockApi = {
      id: 'test-api-refused',
      websiteId: 'test-web-1',
      name: 'Test Connection Refused',
      endpoint: `http://127.0.0.1:1`, // Unreachable port
      method: 'GET',
      expectedStatusCode: 200,
      timeout: 1000,
      status: 'UNKNOWN'
    };

    jest.spyOn(prisma.api, 'findUnique').mockResolvedValue(mockApi);
    jest.spyOn(prisma.api, 'update').mockImplementation(({ data }) => Promise.resolve({ ...mockApi, ...data }));
    jest.spyOn(prisma.requestMetric, 'create').mockResolvedValue({ id: 'metric-5' });

    const result = await apiHealthChecker.checkApiHealth(mockApi.id);

    expect(result.success).toBe(false);
    expect(result.status).toBe('CRITICAL');
    expect(result.error).toBeDefined();
  });
});
