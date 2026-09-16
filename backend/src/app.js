const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const env = require('./config/env');
const prisma = require('./config/database');
const { cache } = require('./config/redis');
const logger = require('./utils/logger');
const swaggerSpec = require('./docs/swagger.json');

// Middleware
const errorHandler = require('./middleware/error.middleware');
const { apiLimiter } = require('./middleware/rateLimit.middleware');
const { NotFoundError } = require('./utils/errors');

// Routes
const authRoutes = require('./routes/auth.routes');
const websiteRoutes = require('./routes/website.routes');
const apiRoutes = require('./routes/api.routes');
const metricRoutes = require('./routes/metric.routes');
const incidentRoutes = require('./routes/incident.routes');
const deploymentRoutes = require('./routes/deployment.routes');
const logRoutes = require('./routes/log.routes');
const apiKeyRoutes = require('./routes/apiKey.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Security & basic middlewares
app.use(helmet({ contentSecurityPolicy: false })); // Permissive CSP for Swagger UI
app.use(
  cors({
    origin: [env.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Request logging in development
if (!env.isProduction && !env.isTest) {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.url}`);
    next();
  });
}

// Swagger Documentation UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'FaultLens API Documentation'
}));

// Root Health Check Endpoint
app.get('/health', async (req, res) => {
  let dbStatus = 'connected';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (_) {
    dbStatus = 'disconnected';
  }

  const redisStatus = cache.isAvailable() ? 'connected' : 'in-memory-fallback';

  res.json({
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    database: dbStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString()
  });
});

// Mount API v1 Routes
app.use('/api/v1', apiLimiter);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/websites', websiteRoutes);
app.use('/api/v1/websites/:websiteId/apis', apiRoutes);
app.use('/api/v1/apis', apiRoutes);
app.use('/api/v1', metricRoutes); // Telemetry & Dashboard routes
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/v1/deployments', deploymentRoutes);
app.use('/api/v1/logs', logRoutes);
app.use('/api/v1/api-keys', apiKeyRoutes);
app.use('/api/v1/admin', adminRoutes);

// Catch-all 404 handler for undefined API routes
app.use('*', (req, res, next) => {
  next(new NotFoundError(`Route '${req.originalUrl}' not found`));
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;
