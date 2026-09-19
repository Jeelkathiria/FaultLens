const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const env = require('../src/config/env');
const infrastructureService = require('../src/services/infrastructure.service');

const adminToken = jwt.sign({ userId: 'usr-admin', role: 'ADMIN' }, env.JWT_SECRET);
const devToken = jwt.sign({ userId: 'usr-dev', role: 'DEVELOPER' }, env.JWT_SECRET);

jest.mock('../src/config/database', () => ({
  user: {
    findUnique: jest.fn().mockImplementation(({ where }) => {
      if (where.id === 'usr-admin') {
        return Promise.resolve({ id: 'usr-admin', role: 'ADMIN', name: 'Platform Admin', email: 'admin@faultlens.dev' });
      }
      if (where.id === 'usr-dev') {
        return Promise.resolve({ id: 'usr-dev', role: 'DEVELOPER', name: 'Dev User', email: 'dev@faultlens.dev' });
      }
      return Promise.resolve(null);
    })
  }
}));

describe('Admin Infrastructure Flow & Telemetry API', () => {
  beforeEach(() => {
    // Clear recent events buffer
    infrastructureService.recentEvents = [];
  });

  describe('GET /api/v1/admin/infrastructure', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/admin/infrastructure');
      expect(res.status).toBe(401);
    });

    it('rejects developer role requests with 403 (strict RBAC)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/infrastructure')
        .set('Authorization', `Bearer ${devToken}`);

      expect(res.status).toBe(403);
    });

    it('returns truthful infrastructure snapshot for ADMIN', async () => {
      // Add a couple of real events
      infrastructureService.addEvent({
        stage: 'INGEST',
        type: 'HTTP_PROBE',
        label: 'Probing website URL: https://example.com',
        status: 'active'
      });

      const res = await request(app)
        .get('/api/v1/admin/infrastructure')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();

      const { queues, redis, workers, recentEvents } = res.body.data;
      expect(Array.isArray(queues)).toBe(true);
      expect(typeof redis).toBe('object');
      expect(Array.isArray(workers)).toBe(true);
      expect(Array.isArray(recentEvents)).toBe(true);
      expect(recentEvents.length).toBeGreaterThanOrEqual(1);
      expect(recentEvents[0].stage).toBe('INGEST');
      expect(recentEvents[0].label).toBe('Probing website URL: https://example.com');
    });
  });

  describe('GET /api/v1/admin/infrastructure/queues/:name/jobs', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/admin/infrastructure/queues/website-health-check/jobs');
      expect(res.status).toBe(401);
    });

    it('rejects developer role requests with 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/infrastructure/queues/website-health-check/jobs')
        .set('Authorization', `Bearer ${devToken}`);

      expect(res.status).toBe(403);
    });

    it('returns jobs array for valid queue name for ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/admin/infrastructure/queues/website-health-check/jobs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('infrastructureService event ring buffer', () => {
    it('maintains maximum 50 events and prepends newest', () => {
      for (let i = 1; i <= 60; i++) {
        infrastructureService.addEvent({
          stage: 'INGEST',
          type: 'TEST_EVENT',
          label: `Event ${i}`,
          status: 'success'
        });
      }

      expect(infrastructureService.recentEvents.length).toBe(50);
      expect(infrastructureService.recentEvents[0].label).toBe('Event 60');
      expect(infrastructureService.recentEvents[49].label).toBe('Event 11');
    });
  });
});
