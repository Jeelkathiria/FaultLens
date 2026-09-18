const request = require('supertest');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const app = require('../src/app');
const env = require('../src/config/env');
const prisma = require('../src/config/database');

function hashApiKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

// In-memory tenant dataset for isolation tests (prefixed with mock for Jest out-of-scope access)
const mockUsers = {
  admin: { id: 'usr-admin', name: 'Platform Admin', email: 'admin@faultlens.dev', role: 'ADMIN' },
  dev1: { id: 'usr-dev1', name: 'Developer 1', email: 'developer@faultlens.dev', role: 'DEVELOPER' },
  dev2: { id: 'usr-dev2', name: 'Developer 2', email: 'dev2@faultlens.dev', role: 'DEVELOPER' }
};

const mockDev1KeyRaw = 'fl_live_dev1_test_key';
const mockDev2KeyRaw = 'fl_live_dev2_test_key';

const mockApiKeys = [
  { id: 'k1', userId: 'usr-dev1', keyHash: hashApiKey(mockDev1KeyRaw), name: 'Dev 1 Key' },
  { id: 'k2', userId: 'usr-dev2', keyHash: hashApiKey(mockDev2KeyRaw), name: 'Dev 2 Key' }
];

const mockWebsites = [
  { id: 'w-shopsphere', userId: 'usr-dev1', name: 'ShopSphere', url: 'https://shopsphere.dev', status: 'critical', environment: 'PRODUCTION', createdAt: new Date() },
  { id: 'w-foodrush', userId: 'usr-dev1', name: 'FoodRush', url: 'https://foodrush.dev', status: 'healthy', environment: 'PRODUCTION', createdAt: new Date() },
  { id: 'w-taskflow', userId: 'usr-dev2', name: 'TaskFlow', url: 'https://taskflow.dev', status: 'healthy', environment: 'PRODUCTION', createdAt: new Date() }
];

const mockApis = [
  { id: 'api-payments', websiteId: 'w-shopsphere', name: 'Payments API', endpoint: '/api/v1/payments', method: 'POST', status: 'critical' },
  { id: 'api-inventory', websiteId: 'w-shopsphere', name: 'Inventory API', endpoint: '/api/v1/inventory', method: 'GET', status: 'healthy' },
  { id: 'api-orders', websiteId: 'w-shopsphere', name: 'Orders API', endpoint: '/api/v1/orders', method: 'POST', status: 'degraded' },
  { id: 'api-restaurants', websiteId: 'w-foodrush', name: 'Restaurants API', endpoint: '/api/v1/restaurants', method: 'GET', status: 'healthy' },
  { id: 'api-courier', websiteId: 'w-foodrush', name: 'Courier Routing API', endpoint: '/api/v1/courier/route', method: 'POST', status: 'healthy' },
  { id: 'api-tasks', websiteId: 'w-taskflow', name: 'Task Management API', endpoint: '/api/v1/tasks', method: 'GET', status: 'healthy' },
  { id: 'api-workspaces', websiteId: 'w-taskflow', name: 'Team Workspace API', endpoint: '/api/v1/workspaces', method: 'GET', status: 'healthy' }
];

// Mock database interactions
jest.mock('../src/config/database', () => {
  return {
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id) {
          const u = Object.values(mockUsers).find((x) => x.id === where.id);
          return Promise.resolve(u || null);
        }
        if (where.email) {
          const u = Object.values(mockUsers).find((x) => x.email.toLowerCase() === where.email.toLowerCase());
          return Promise.resolve(u || null);
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockImplementation(() => {
        return Promise.resolve(
          Object.values(mockUsers).map((u) => ({
            ...u,
            websites: mockWebsites.filter((w) => w.userId === u.id)
          }))
        );
      })
    },
    apiKey: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.keyHash) {
          const k = mockApiKeys.find((x) => x.keyHash === where.keyHash);
          if (k) {
            const user = Object.values(mockUsers).find((u) => u.id === k.userId);
            return Promise.resolve({ ...k, user });
          }
        }
        return Promise.resolve(null);
      }),
      update: jest.fn().mockResolvedValue({})
    },
    website: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const w = mockWebsites.find((x) => x.id === where.id);
        if (w) {
          const childApis = mockApis.filter((a) => a.websiteId === w.id);
          const user = Object.values(mockUsers).find((u) => u.id === w.userId);
          return Promise.resolve({ ...w, apis: childApis, user });
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        let list = [...mockWebsites];
        if (where && where.userId) {
          list = list.filter((w) => w.userId === where.userId);
        }
        return Promise.resolve(
          list.map((w) => ({
            ...w,
            apis: mockApis.filter((a) => a.websiteId === w.id),
            user: Object.values(mockUsers).find((u) => u.id === w.userId)
          }))
        );
      })
    },
    api: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const a = mockApis.find((x) => x.id === where.id);
        if (a) {
          const parentWebsite = mockWebsites.find((w) => w.id === a.websiteId);
          return Promise.resolve({ ...a, website: parentWebsite });
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        let list = [...mockApis];
        if (where && where.website && where.website.userId) {
          const userWebsites = mockWebsites.filter((w) => w.userId === where.website.userId).map((w) => w.id);
          list = list.filter((a) => userWebsites.includes(a.websiteId));
        }
        return Promise.resolve(
          list.map((a) => ({
            ...a,
            website: mockWebsites.find((w) => w.id === a.websiteId)
          }))
        );
      }),
      count: jest.fn().mockImplementation(({ where }) => {
        if (where && where.websiteId) {
          return Promise.resolve(mockApis.filter((a) => a.websiteId === where.websiteId).length);
        }
        return Promise.resolve(mockApis.length);
      })
    },
    requestMetric: {
      create: jest.fn().mockResolvedValue({ id: 'metric-123' }),
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([])
    },
    metricAggregate: {
      findMany: jest.fn().mockResolvedValue([])
    },
    incident: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0)
    },
    log: {
      create: jest.fn().mockResolvedValue({ id: 'log-123' }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0)
    },
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    $disconnect: jest.fn().mockResolvedValue()
  };
});

describe('Multi-Tenant Isolation & 404 Enumeration Defense Tests', () => {
  let dev1Token;
  let dev2Token;
  let adminToken;

  beforeAll(() => {
    dev1Token = jwt.sign({ userId: mockUsers.dev1.id, role: mockUsers.dev1.role }, env.JWT_SECRET, { expiresIn: '1h' });
    dev2Token = jwt.sign({ userId: mockUsers.dev2.id, role: mockUsers.dev2.role }, env.JWT_SECRET, { expiresIn: '1h' });
    adminToken = jwt.sign({ userId: mockUsers.admin.id, role: mockUsers.admin.role }, env.JWT_SECRET, { expiresIn: '1h' });
  });

  describe('1. Website Scoping & 404 Enumeration Defense', () => {
    it('Developer 1 lists only their own websites (ShopSphere, FoodRush)', async () => {
      const res = await request(app)
        .get('/api/v1/websites')
        .set('Authorization', `Bearer ${dev1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      const names = res.body.data.map((w) => w.name);
      expect(names).toContain('ShopSphere');
      expect(names).toContain('FoodRush');
      expect(names).not.toContain('TaskFlow');
    });

    it('Developer 2 lists only their own website (TaskFlow)', async () => {
      const res = await request(app)
        .get('/api/v1/websites')
        .set('Authorization', `Bearer ${dev2Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('TaskFlow');
    });

    it('Developer 1 requests Developer 2 website ID -> returns 404 (not 403) to prevent enumeration', async () => {
      const res = await request(app)
        .get('/api/v1/websites/w-taskflow')
        .set('Authorization', `Bearer ${dev1Token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    it('Developer 2 requests Developer 1 website ID -> returns 404 (not 403) to prevent enumeration', async () => {
      const res = await request(app)
        .get('/api/v1/websites/w-shopsphere')
        .set('Authorization', `Bearer ${dev2Token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    it('Admin can access any website', async () => {
      const res = await request(app)
        .get('/api/v1/websites/w-taskflow')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('TaskFlow');
    });
  });

  describe('2. API Scoping & 404 Defense', () => {
    it('Developer 1 requests Developer 2 API ID -> returns 404 Not Found', async () => {
      const res = await request(app)
        .get('/api/v1/apis/api-tasks')
        .set('Authorization', `Bearer ${dev1Token}`);

      expect(res.statusCode).toBe(404);
    });

    it('Developer 2 requests Developer 1 API ID -> returns 404 Not Found', async () => {
      const res = await request(app)
        .get('/api/v1/apis/api-payments')
        .set('Authorization', `Bearer ${dev2Token}`);

      expect(res.statusCode).toBe(404);
    });

    it('Developer 1 requests their own API ID -> returns 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/apis/api-payments')
        .set('Authorization', `Bearer ${dev1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe('Payments API');
    });
  });

  describe('3. Telemetry Ingestion Ownership Chain (x-api-key -> user -> website -> api)', () => {
    it('Developer 1 key ingests telemetry for Developer 1 API -> Success (200/202)', async () => {
      const res = await request(app)
        .post('/api/v1/telemetry')
        .set('x-api-key', mockDev1KeyRaw)
        .send({
          apiId: 'api-payments',
          responseTime: 120,
          statusCode: 200,
          method: 'POST',
          endpoint: '/api/v1/payments'
        });

      expect([200, 202]).toContain(res.statusCode);
      expect(res.body.success).toBe(true);
    });

    it('Developer 1 key attempting to ingest telemetry for Developer 2 API -> returns 404 Not Found', async () => {
      const res = await request(app)
        .post('/api/v1/telemetry')
        .set('x-api-key', mockDev1KeyRaw)
        .send({
          apiId: 'api-tasks', // Belongs to Developer 2
          responseTime: 85,
          statusCode: 200,
          method: 'GET',
          endpoint: '/api/v1/tasks'
        });

      // Must return 404 without revealing api-tasks exists for another user
      expect(res.statusCode).toBe(404);
    });
  });

  describe('4. RBAC Role Restrictions (403 Forbidden)', () => {
    it('Developer attempting to access Admin users endpoint -> returns 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${dev1Token}`);

      expect(res.statusCode).toBe(403);
    });

    it('Developer attempting to access Admin websites endpoint -> returns 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/websites')
        .set('Authorization', `Bearer ${dev2Token}`);

      expect(res.statusCode).toBe(403);
    });

    it('Admin accessing Admin users endpoint -> returns 200 OK with all platform users', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    });
  });
});
