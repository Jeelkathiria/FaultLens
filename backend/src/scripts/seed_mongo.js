const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const env = require('../config/env');
const models = require('../models');

function hashApiKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

async function seed() {
  console.log('🌱 Connecting to MongoDB for FaultLens seeding...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected to MongoDB:', env.MONGODB_URI);

  console.log('🧹 Cleaning existing collections...');
  await Promise.all([
    models.IncidentEvent.deleteMany({}),
    models.Incident.deleteMany({}),
    models.Anomaly.deleteMany({}),
    models.Log.deleteMany({}),
    models.MetricAggregate.deleteMany({}),
    models.RequestMetric.deleteMany({}),
    models.Deployment.deleteMany({}),
    models.ApiKey.deleteMany({}),
    models.Api.deleteMany({}),
    models.Website.deleteMany({}),
    models.User.deleteMany({})
  ]);

  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('Admin@12345', salt);
  const devHash = await bcrypt.hash('Developer@12345', salt);
  const legacyHash = await bcrypt.hash('Password123!', salt);

  console.log('👤 Creating users...');
  // 1. Admin
  const adminUser = await models.User.create({
    _id: 'usr-admin-01',
    name: 'Platform Admin',
    email: 'admin@faultlens.dev',
    passwordHash: adminHash,
    role: 'ADMIN'
  });

  // 2. Developer 1 (owns ShopSphere + FoodRush)
  const dev1User = await models.User.create({
    _id: 'usr-dev-01',
    name: 'Developer 1',
    email: 'developer@faultlens.dev',
    passwordHash: devHash,
    role: 'DEVELOPER'
  });

  // 3. Developer 2 (owns TaskFlow)
  const dev2User = await models.User.create({
    _id: 'usr-dev-02',
    name: 'Developer 2',
    email: 'dev2@faultlens.dev',
    passwordHash: devHash,
    role: 'DEVELOPER'
  });

  // 4. Legacy Account
  await models.User.create({
    _id: 'usr-dev-legacy',
    name: 'Jeel Kathiria',
    email: 'jeel@faultlens.dev',
    passwordHash: legacyHash,
    role: 'DEVELOPER'
  });

  console.log(`✅ Users provisioned:
    - Admin: admin@faultlens.dev (Admin@12345)
    - Dev 1: developer@faultlens.dev (Developer@12345)
    - Dev 2: dev2@faultlens.dev (Developer@12345)
    - Dev: jeel@faultlens.dev (Password123!)`);

  // Provision API Keys
  console.log('🔑 Provisioning API Keys...');
  const dev1ApiKeyRaw = 'fl_live_dev1_shopsphere_948a';
  await models.ApiKey.create({
    _id: 'key-dev-01',
    userId: dev1User._id,
    name: 'ShopSphere Ingest Key',
    keyHash: hashApiKey(dev1ApiKeyRaw),
    keyPrefix: 'fl_live_dev1...',
    lastUsedAt: new Date()
  });

  const dev2ApiKeyRaw = 'fl_live_dev2_taskflow_881c';
  await models.ApiKey.create({
    _id: 'key-dev-02',
    userId: dev2User._id,
    name: 'TaskFlow Ingest Key',
    keyHash: hashApiKey(dev2ApiKeyRaw),
    keyPrefix: 'fl_live_dev2...',
    lastUsedAt: new Date()
  });

  // Create Websites
  console.log('🌐 Provisioning Websites...');
  // Dev 1: ShopSphere + FoodRush
  const shopSphereWeb = await models.Website.create({
    _id: 'w-shopsphere',
    userId: dev1User._id,
    name: 'ShopSphere',
    url: 'https://shopsphere.dev',
    environment: 'PRODUCTION',
    status: 'critical',
    description: 'E-commerce storefront and payments gateway'
  });

  const foodRushWeb = await models.Website.create({
    _id: 'w-foodrush',
    userId: dev1User._id,
    name: 'FoodRush',
    url: 'https://foodrush.dev',
    environment: 'PRODUCTION',
    status: 'healthy',
    description: 'Courier delivery routing and restaurants platform'
  });

  // Dev 2: TaskFlow
  const taskFlowWeb = await models.Website.create({
    _id: 'w-taskflow',
    userId: dev2User._id,
    name: 'TaskFlow',
    url: 'https://taskflow.dev',
    environment: 'PRODUCTION',
    status: 'healthy',
    description: 'Project task management and developer workspaces'
  });

  console.log('✅ Websites created: ShopSphere & FoodRush (Dev 1), TaskFlow (Dev 2)');

  // Create APIs
  console.log('⚡ Provisioning APIs...');
  // ShopSphere APIs
  const paymentsApi = await models.Api.create({
    _id: 'api-payments',
    websiteId: shopSphereWeb._id,
    name: 'Payments API',
    endpoint: '/api/v1/payments',
    method: 'POST',
    status: 'critical',
    monitoringInterval: '30s',
    healthCheckEndpoint: '/api/v1/payments/health'
  });

  const inventoryApi = await models.Api.create({
    _id: 'api-inventory',
    websiteId: shopSphereWeb._id,
    name: 'Inventory API',
    endpoint: '/api/v1/inventory',
    method: 'GET',
    status: 'healthy',
    monitoringInterval: '60s',
    healthCheckEndpoint: '/api/v1/inventory/health'
  });

  const ordersApi = await models.Api.create({
    _id: 'api-orders',
    websiteId: shopSphereWeb._id,
    name: 'Orders API',
    endpoint: '/api/v1/orders',
    method: 'POST',
    status: 'degraded',
    monitoringInterval: '30s',
    healthCheckEndpoint: '/api/v1/orders/health'
  });

  // FoodRush APIs
  await models.Api.create({
    _id: 'api-restaurants',
    websiteId: foodRushWeb._id,
    name: 'Restaurants API',
    endpoint: '/api/v1/restaurants',
    method: 'GET',
    status: 'healthy',
    monitoringInterval: '60s',
    healthCheckEndpoint: '/api/v1/restaurants/health'
  });

  await models.Api.create({
    _id: 'api-courier',
    websiteId: foodRushWeb._id,
    name: 'Courier Routing API',
    endpoint: '/api/v1/courier/route',
    method: 'POST',
    status: 'healthy',
    monitoringInterval: '60s',
    healthCheckEndpoint: '/api/v1/courier/health'
  });

  // TaskFlow APIs (Developer 2)
  const taskApi = await models.Api.create({
    _id: 'api-tasks',
    websiteId: taskFlowWeb._id,
    name: 'Task Management API',
    endpoint: '/api/v1/tasks',
    method: 'GET',
    status: 'healthy',
    monitoringInterval: '60s',
    healthCheckEndpoint: '/api/v1/tasks/health'
  });

  await models.Api.create({
    _id: 'api-workspaces',
    websiteId: taskFlowWeb._id,
    name: 'Team Workspace API',
    endpoint: '/api/v1/workspaces',
    method: 'GET',
    status: 'healthy',
    monitoringInterval: '60s',
    healthCheckEndpoint: '/api/v1/workspaces/health'
  });

  // Deployments
  console.log('🚀 Provisioning Deployments...');
  const depTime = new Date(Date.now() - 20 * 60 * 1000);
  await models.Deployment.create({
    _id: 'dep-108',
    websiteId: shopSphereWeb._id,
    apiId: paymentsApi._id,
    version: 'v1.8',
    commitHash: 'a8f192bf42',
    branch: 'main',
    environment: 'PRODUCTION',
    deployedAt: depTime,
    status: 'incident',
    message: 'feat(payments): switch to asynchronous 3DS validation pipeline',
    author: 'alex.chen'
  });

  await models.Deployment.create({
    _id: 'dep-107',
    websiteId: shopSphereWeb._id,
    apiId: ordersApi._id,
    version: 'v2.4.1',
    commitHash: '7e2a84c889',
    branch: 'release/v2.4',
    environment: 'PRODUCTION',
    deployedAt: new Date(Date.now() - 36 * 3600 * 1000),
    status: 'stable',
    message: 'fix: optimize nested database index on order customer query',
    author: 'david.miller'
  });

  await models.Deployment.create({
    _id: 'dep-201',
    websiteId: taskFlowWeb._id,
    apiId: taskApi._id,
    version: 'v3.0.0',
    commitHash: '3c89df1a44',
    branch: 'main',
    environment: 'PRODUCTION',
    deployedAt: new Date(Date.now() - 12 * 3600 * 1000),
    status: 'stable',
    message: 'feat: drag and drop kanban board indexing',
    author: 'dev2'
  });

  // Telemetry Aggregates & Metrics
  console.log('📊 Provisioning Telemetry & Metrics...');
  const now = Date.now();
  const aggregatePoints = 24;

  for (let i = aggregatePoints; i >= 0; i--) {
    const pointTime = new Date(now - i * 3600 * 1000);
    const isAnomalyZone = i <= 3;

    const requests = 2400 + Math.round(Math.sin(i) * 600);
    const errorCount = isAnomalyZone ? Math.round(requests * 0.178) : Math.round(requests * 0.012);
    const clientErrorCount = Math.round(errorCount * 0.2);
    const serverErrorCount = errorCount - clientErrorCount;

    const p50 = isAnomalyZone ? 620 : 95;
    const p95 = isAnomalyZone ? 2800 : 210;
    const p99 = isAnomalyZone ? 4200 : 310;
    const avgLatency = isAnomalyZone ? 740 : 120;

    await models.MetricAggregate.create({
      apiId: paymentsApi._id,
      timestamp: pointTime,
      requestCount: requests,
      errorCount,
      clientErrorCount,
      serverErrorCount,
      avgLatency,
      p50,
      p95,
      p99
    });

    if (i <= 1) {
      for (let j = 0; j < 10; j++) {
        const isErr = isAnomalyZone && j % 3 === 0;
        await models.RequestMetric.create({
          apiId: paymentsApi._id,
          timestamp: new Date(now - (j * 40 + i * 600) * 1000),
          statusCode: isErr ? 500 : 200,
          responseTime: isErr ? Math.round(1800 + Math.random() * 1200) : Math.round(75 + Math.random() * 80),
          method: 'POST',
          endpoint: '/api/v1/payments',
          errorMessage: isErr ? 'Upstream payment gateway timeout after 3DS callback' : null
        });
      }
    }
  }

  // TaskFlow Metrics (Dev 2)
  for (let i = aggregatePoints; i >= 0; i--) {
    const pointTime = new Date(now - i * 3600 * 1000);
    await models.MetricAggregate.create({
      apiId: taskApi._id,
      timestamp: pointTime,
      requestCount: 1200 + Math.round(Math.random() * 200),
      errorCount: 1,
      clientErrorCount: 1,
      serverErrorCount: 0,
      avgLatency: 42,
      p50: 38,
      p95: 85,
      p99: 130
    });
  }

  // Anomalies & Incidents (Dev 1)
  console.log('🚨 Provisioning Incidents & Anomalies...');
  const anomalyTime = new Date(depTime.getTime() + 6 * 60 * 1000);
  const anomaly = await models.Anomaly.create({
    apiId: paymentsApi._id,
    metricType: 'ERROR_RATE',
    detectedValue: 17.8,
    baselineValue: 1.2,
    deviation: 4.8,
    severity: 'critical',
    status: 'OPEN',
    detectedAt: anomalyTime
  });

  const incident1042 = await models.Incident.create({
    _id: 'inc-1042',
    apiId: paymentsApi._id,
    websiteId: shopSphereWeb._id,
    anomalyId: anomaly._id,
    title: 'Error rate & latency spike on Payments API',
    description: 'Error rate increased sharply to 17.8% with P95 latency degraded to 2.8s',
    severity: 'critical',
    status: 'INVESTIGATING',
    detectedAt: anomalyTime,
    acknowledgedAt: new Date(anomalyTime.getTime() + 4 * 60 * 1000)
  });

  const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  await models.IncidentEvent.insertMany([
    {
      _id: 'evt-01',
      incidentId: incident1042._id,
      type: 'deployment',
      message: 'Release v1.8 deployed to production by alex.chen (commit a8f192b)',
      timestamp: depTime,
      metadata: {
        version: 'v1.8',
        service: 'Payments API',
        deployedAt: formatTime(depTime),
        detectedAt: formatTime(anomalyTime),
        timeDifference: '6 minutes',
        commit: 'a8f192b',
        author: 'alex.chen',
        message: 'feat(payments): switch to asynchronous 3DS validation pipeline'
      }
    },
    {
      _id: 'evt-02',
      incidentId: incident1042._id,
      type: 'warning',
      message: 'P95 response time rose from 210ms baseline to 1,420ms',
      timestamp: new Date(depTime.getTime() + 4 * 60 * 1000)
    },
    {
      _id: 'evt-03',
      incidentId: incident1042._id,
      type: 'anomaly',
      message: 'FaultLens statistical engine detected 4.8σ deviation on payment worker throughput',
      timestamp: anomalyTime,
      metadata: { anomalyId: anomaly._id }
    },
    {
      _id: 'evt-04',
      incidentId: incident1042._id,
      type: 'action',
      message: 'Status moved to Investigating by Developer 1',
      timestamp: new Date(anomalyTime.getTime() + 4 * 60 * 1000),
      metadata: { updatedBy: 'Developer 1' }
    }
  ]);

  // Logs
  console.log('📜 Provisioning Logs...');
  await models.Log.insertMany([
    {
      _id: 'log-001',
      apiId: paymentsApi._id,
      timestamp: new Date(now - 12 * 1000),
      level: 'ERROR',
      message: 'Timeout waiting for 3DS verification callback from upstream banking provider after 1800ms',
      statusCode: 500,
      metadata: { method: 'POST', endpoint: '/api/v1/payments', responseTime: 1842 }
    },
    {
      _id: 'log-002',
      apiId: inventoryApi._id,
      timestamp: new Date(now - 45 * 1000),
      level: 'INFO',
      message: 'Inventory stock count refreshed for catalog 1042 items',
      statusCode: 200,
      metadata: { method: 'GET', endpoint: '/api/v1/inventory', responseTime: 48 }
    },
    {
      _id: 'log-003',
      apiId: taskApi._id,
      timestamp: new Date(now - 30 * 1000),
      level: 'INFO',
      message: 'Workspace sync completed for user session',
      statusCode: 200,
      metadata: { method: 'GET', endpoint: '/api/v1/tasks', responseTime: 36 }
    }
  ]);

  console.log('🎉 FaultLens MongoDB Seed Complete!');
  await mongoose.disconnect();
}

seed()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  });
