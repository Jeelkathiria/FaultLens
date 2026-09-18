const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const env = require('../src/config/env');
const prisma = require('../src/config/database');
const apiHealthChecker = require('../src/services/apiHealthChecker.service');

const mockUsers = {
  admin: { id: 'usr-admin', name: 'Platform Admin', email: 'admin@faultlens.dev', role: 'ADMIN' },
  dev1: { id: 'usr-dev1', name: 'Developer 1', email: 'developer@faultlens.dev', role: 'DEVELOPER' },
  dev2: { id: 'usr-dev2', name: 'Developer 2', email: 'dev2@faultlens.dev', role: 'DEVELOPER' }
};

const mockWebsites = {
  web1: { id: 'w-shopsphere', userId: 'usr-dev1', name: 'ShopSphere', url: 'https://shopsphere.dev' },
  web2: { id: 'w-taskflow', userId: 'usr-dev2', name: 'TaskFlow', url: 'https://taskflow.dev' }
};

const mockApis = {
  api1: { id: 'api-shopsphere-pay', websiteId: 'w-shopsphere', name: 'Pay API', endpoint: '/api/v1/pay', website: mockWebsites.web1 },
  api2: { id: 'api-taskflow-tasks', websiteId: 'w-taskflow', name: 'Tasks API', endpoint: '/api/v1/tasks', website: mockWebsites.web2 }
};

function generateToken(user) {
  return jwt.sign({ userId: user.id, email: user.email, role: user.role }, env.JWT_SECRET, { expiresIn: '1h' });
}

describe('POST /api/v1/apis/:id/check — Multi-Tenant Isolation & Authorization', () => {
  let dev1Token;
  let dev2Token;
  let adminToken;

  beforeAll(() => {
    dev1Token = generateToken(mockUsers.dev1);
    dev2Token = generateToken(mockUsers.dev2);
    adminToken = generateToken(mockUsers.admin);

    jest.spyOn(prisma.user, 'findUnique').mockImplementation(({ where }) => {
      const u = Object.values(mockUsers).find((x) => x.id === where.id);
      return Promise.resolve(u || null);
    });

    jest.spyOn(prisma.api, 'findUnique').mockImplementation(({ where }) => {
      const a = Object.values(mockApis).find((x) => x.id === where.id);
      return Promise.resolve(a || null);
    });

    jest.spyOn(apiHealthChecker, 'checkApiHealth').mockImplementation((apiId) => {
      return Promise.resolve({
        apiId,
        status: 'HEALTHY',
        statusCode: 200,
        responseTime: 42,
        success: true,
        checkedAt: new Date().toISOString(),
        error: null
      });
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('Developer 1 can check their own API (api-shopsphere-pay) -> 200 OK', async () => {
    const res = await request(app)
      .post('/api/v1/apis/api-shopsphere-pay/check')
      .set('Authorization', `Bearer ${dev1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('HEALTHY');
    expect(res.body.data.statusCode).toBe(200);
  });

  test("Developer 2 CANNOT check Developer 1's API -> returns 404 (prevents leakage)", async () => {
    const res = await request(app)
      .post('/api/v1/apis/api-shopsphere-pay/check')
      .set('Authorization', `Bearer ${dev2Token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test("Admin CAN check Developer 1's API -> 200 OK", async () => {
    const res = await request(app)
      .post('/api/v1/apis/api-shopsphere-pay/check')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.statusCode).toBe(200);
  });

  test('Unauthenticated request is rejected with 401 Unauthorized', async () => {
    const res = await request(app).post('/api/v1/apis/api-shopsphere-pay/check');
    expect(res.status).toBe(401);
  });
});
