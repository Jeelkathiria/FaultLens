const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const env = require('../src/config/env');
const prisma = require('../src/config/database');
const bcrypt = require('bcryptjs');

jest.mock('../src/config/database', () => {
  const users = new Map();
  return {
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.email) {
          return Promise.resolve(users.get(where.email.toLowerCase()) || null);
        }
        if (where.id) {
          for (const u of users.values()) {
            if (u.id === where.id) return Promise.resolve(u);
          }
        }
        return Promise.resolve(null);
      }),
      create: jest.fn().mockImplementation(({ data }) => {
        const user = {
          id: `usr-${Date.now()}`,
          name: data.name,
          email: data.email.toLowerCase(),
          passwordHash: data.passwordHash,
          role: data.role || 'DEVELOPER',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        users.set(user.email, user);
        return Promise.resolve(user);
      }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 })
    },
    website: {
      create: jest.fn().mockImplementation(({ data }) => {
        return Promise.resolve({
          id: 'w-new',
          name: data.name,
          url: data.url,
          userId: data.userId,
          status: 'healthy',
          environment: data.environment || 'PRODUCTION',
          createdAt: new Date()
        });
      }),
      findUnique: jest.fn().mockResolvedValue(null)
    },
    api: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([])
    },
    incident: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([])
    },
    requestMetric: {
      count: jest.fn().mockResolvedValue(0)
    },
    websiteCheck: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0)
    },
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    $disconnect: jest.fn().mockResolvedValue()
  };
});

describe('Authentication & Authorization Integration Tests', () => {
  const testUser = {
    name: 'Dev Tester',
    email: 'tester_101@faultlens.dev',
    password: 'SecurePassword123!',
    role: 'DEVELOPER'
  };

  let devToken = null;

  beforeAll(async () => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(testUser.password, salt);

    await prisma.user.create({
      data: {
        name: testUser.name,
        email: testUser.email,
        passwordHash,
        role: testUser.role
      }
    });
  });

  it('successfully registers a new user with hashed password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'New Developer',
        email: 'new_dev@faultlens.dev',
        password: 'Password123!'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('new_dev@faultlens.dev');
  });

  it('successfully logs in with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.passwordHash).toBeUndefined(); // Never expose passwordHash!

    devToken = res.body.data.token;
  });

  it('rejects login with invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: 'WrongPassword!' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('allows access to protected route with valid JWT token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${devToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.email).toBe(testUser.email);
  });

  it('rejects protected route without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('denies DEVELOPER access to ADMIN-only system endpoints', async () => {
    const res = await request(app)
      .get('/api/v1/admin/system-health')
      .set('Authorization', `Bearer ${devToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('authenticates developer via Google OAuth endpoint', async () => {
    const res = await request(app)
      .post('/api/v1/auth/google')
      .send({
        name: 'Google Dev User',
        email: 'google_dev@faultlens.dev',
        googleId: 'g-123456789'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('DEVELOPER');
    expect(res.body.data.user.email).toBe('google_dev@faultlens.dev');
  });

  it('creates a website when authenticated with Bearer token', async () => {
    const res = await request(app)
      .post('/api/v1/websites')
      .set('Authorization', `Bearer ${devToken}`)
      .send({
        name: 'My New Website',
        url: 'https://mynewsite.dev',
        environment: 'PRODUCTION'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('My New Website');
  });

  it('rejects website creation when unauthenticated (returns 401)', async () => {
    const res = await request(app)
      .post('/api/v1/websites')
      .send({
        name: 'Unauth Site',
        url: 'https://unauth.dev'
      });

    expect(res.statusCode).toBe(401);
  });

  it('rejects website creation with expired token (returns 401)', async () => {
    const expiredToken = jwt.sign(
      { userId: 'usr-dev', role: 'DEVELOPER' },
      env.JWT_SECRET,
      { expiresIn: '-1s' }
    );

    const res = await request(app)
      .post('/api/v1/websites')
      .set('Authorization', `Bearer ${expiredToken}`)
      .send({
        name: 'Expired Token Site',
        url: 'https://expired.dev'
      });

    expect(res.statusCode).toBe(401);
  });
});
