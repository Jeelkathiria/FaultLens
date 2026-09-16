const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashApiKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

async function main() {
  console.log('🌱 Starting FaultLens Database Seeder...');

  // 1. Clean existing records in reverse dependency order
  await prisma.incidentEvent.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.anomaly.deleteMany();
  await prisma.log.deleteMany();
  await prisma.metricAggregate.deleteMany();
  await prisma.requestMetric.deleteMany();
  await prisma.deployment.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.api.deleteMany();
  await prisma.website.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  // 2. Create Users
  const adminUser = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      email: 'sarah.c@cyberdyne.io',
      passwordHash,
      role: 'ADMIN'
    }
  });

  const devUser = await prisma.user.create({
    data: {
      name: 'Jeel Kathiria',
      email: 'jeel@faultlens.dev',
      passwordHash,
      role: 'DEVELOPER'
    }
  });

  console.log(`✅ Users created: Admin (${adminUser.email}), Developer (${devUser.email})`);

  // 3. Create API Keys for Developer
  const devApiKeyRaw = 'fl_live_948a92bb4f01c8';
  await prisma.apiKey.create({
    data: {
      userId: devUser.id,
      name: 'Production Telemetry Ingest',
      keyHash: hashApiKey(devApiKeyRaw),
      keyPrefix: 'fl_live_948a...',
      lastUsedAt: new Date()
    }
  });

  const stageApiKeyRaw = 'fl_stage_881c201a44e99b';
  await prisma.apiKey.create({
    data: {
      userId: devUser.id,
      name: 'Staging CI Agent',
      keyHash: hashApiKey(stageApiKeyRaw),
      keyPrefix: 'fl_stage_881...',
      lastUsedAt: new Date(Date.now() - 3 * 3600 * 1000)
    }
  });

  console.log('✅ API Keys provisioned');

  // 4. Create Websites
  const ecommerceWeb = await prisma.website.create({
    data: {
      id: 'w-ecommerce',
      userId: devUser.id,
      name: 'My E-Commerce',
      url: 'https://mystore.com',
      environment: 'PRODUCTION',
      status: 'critical',
      description: 'Main production customer checkout & storefront gateway'
    }
  });

  const foodWeb = await prisma.website.create({
    data: {
      id: 'w-foodapp',
      userId: devUser.id,
      name: 'Food Delivery',
      url: 'https://foodapp.com',
      environment: 'PRODUCTION',
      status: 'degraded',
      description: 'Courier routing & live restaurant ordering system'
    }
  });

  const portfolioWeb = await prisma.website.create({
    data: {
      id: 'w-portfolio',
      userId: devUser.id,
      name: 'Portfolio',
      url: 'https://jeel.dev',
      environment: 'PRODUCTION',
      status: 'healthy',
      description: 'Personal projects and developer sandbox showcase'
    }
  });

  const fintechWeb = await prisma.website.create({
    data: {
      id: 'w-fintech',
      userId: devUser.id,
      name: 'Fintech Core',
      url: 'https://api.fintech.io',
      environment: 'STAGING',
      status: 'healthy',
      description: 'Internal ledger processing and bank reconciliation engine'
    }
  });

  console.log('✅ Websites created');

  // 5. Create APIs
  const paymentApi = await prisma.api.create({
    data: {
      id: 'api-payment',
      websiteId: ecommerceWeb.id,
      name: 'Payment API',
      endpoint: '/api/payment',
      method: 'POST',
      status: 'critical',
      monitoringInterval: '30s',
      healthCheckEndpoint: '/api/payment/health'
    }
  });

  const loginApi = await prisma.api.create({
    data: {
      id: 'api-login',
      websiteId: ecommerceWeb.id,
      name: 'Login API',
      endpoint: '/api/login',
      method: 'POST',
      status: 'healthy',
      monitoringInterval: '60s',
      healthCheckEndpoint: '/api/login/status'
    }
  });

  const ordersApi = await prisma.api.create({
    data: {
      id: 'api-orders',
      websiteId: ecommerceWeb.id,
      name: 'Orders API',
      endpoint: '/api/orders',
      method: 'GET',
      status: 'degraded',
      monitoringInterval: '30s',
      healthCheckEndpoint: '/api/orders/health'
    }
  });

  const checkoutApi = await prisma.api.create({
    data: {
      id: 'api-checkout',
      websiteId: ecommerceWeb.id,
      name: 'Checkout API',
      endpoint: '/api/checkout',
      method: 'POST',
      status: 'healthy',
      monitoringInterval: '60s',
      healthCheckEndpoint: '/api/checkout/live'
    }
  });

  const restaurantsApi = await prisma.api.create({
    data: {
      id: 'api-restaurants',
      websiteId: foodWeb.id,
      name: 'Restaurants Catalog API',
      endpoint: '/api/v1/restaurants',
      method: 'GET',
      status: 'healthy',
      monitoringInterval: '60s',
      healthCheckEndpoint: '/api/v1/restaurants/health'
    }
  });

  const contactApi = await prisma.api.create({
    data: {
      id: 'api-contact',
      websiteId: portfolioWeb.id,
      name: 'Contact Form API',
      endpoint: '/api/contact',
      method: 'POST',
      status: 'healthy',
      monitoringInterval: '60s',
      healthCheckEndpoint: '/api/contact/health'
    }
  });

  console.log('✅ APIs created');

  // 6. Create Deployments
  const depTime = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
  const dep108 = await prisma.deployment.create({
    data: {
      id: 'dep-108',
      websiteId: ecommerceWeb.id,
      apiId: paymentApi.id,
      version: 'v1.8',
      commitHash: 'a8f192bf42',
      branch: 'main',
      environment: 'PRODUCTION',
      deployedAt: depTime,
      status: 'incident',
      message: 'feat(payments): switch to asynchronous 3DS validation pipeline',
      author: 'alex.chen'
    }
  });

  await prisma.deployment.create({
    data: {
      id: 'dep-107',
      websiteId: ecommerceWeb.id,
      apiId: paymentApi.id,
      version: 'v1.7',
      commitHash: '3b90df1a12',
      branch: 'main',
      environment: 'PRODUCTION',
      deployedAt: new Date(Date.now() - 24 * 3600 * 1000),
      status: 'stable',
      message: 'perf: add redis cache for merchant tax lookup table',
      author: 'jeel.kathiria'
    }
  });

  await prisma.deployment.create({
    data: {
      id: 'dep-106',
      websiteId: ecommerceWeb.id,
      apiId: ordersApi.id,
      version: 'v2.4.1',
      commitHash: '7e2a84c889',
      branch: 'release/v2.4',
      environment: 'PRODUCTION',
      deployedAt: new Date(Date.now() - 36 * 3600 * 1000),
      status: 'stable',
      message: 'fix: optimize nested SQL join on order customer query',
      author: 'david.miller'
    }
  });

  await prisma.deployment.create({
    data: {
      id: 'dep-105',
      websiteId: foodWeb.id,
      apiId: restaurantsApi.id,
      version: 'v3.1.0',
      commitHash: '9c4b12f451',
      branch: 'main',
      environment: 'PRODUCTION',
      deployedAt: new Date(Date.now() - 48 * 3600 * 1000),
      status: 'stable',
      message: 'feat(geo): add spatial index for restaurant radius lookup',
      author: 'elena.rostova'
    }
  });

  console.log('✅ Deployments created');

  // 7. Generate Time-series RequestMetrics and MetricAggregates for Payment API
  console.log('📊 Generating time-series telemetry metrics...');
  const now = Date.now();
  const aggregatePoints = 24;

  for (let i = aggregatePoints; i >= 0; i--) {
    const pointTime = new Date(now - i * 3600 * 1000);
    const isAnomalyZone = i <= 3; // Recent spike!

    const requests = 2400 + Math.round(Math.sin(i) * 600);
    const errorCount = isAnomalyZone ? Math.round(requests * 0.178) : Math.round(requests * 0.012);
    const clientErrorCount = Math.round(errorCount * 0.2);
    const serverErrorCount = errorCount - clientErrorCount;

    const p50 = isAnomalyZone ? 620 : 95;
    const p95 = isAnomalyZone ? 2800 : 210;
    const p99 = isAnomalyZone ? 4200 : 310;
    const avgLatency = isAnomalyZone ? 740 : 120;

    await prisma.metricAggregate.create({
      data: {
        apiId: paymentApi.id,
        timestamp: pointTime,
        requestCount: requests,
        errorCount,
        clientErrorCount,
        serverErrorCount,
        avgLatency,
        p50,
        p95,
        p99
      }
    });

    // Also write a few sample raw RequestMetrics for current hour
    if (i <= 1) {
      for (let j = 0; j < 15; j++) {
        const isErr = isAnomalyZone && j % 3 === 0;
        await prisma.requestMetric.create({
          data: {
            apiId: paymentApi.id,
            timestamp: new Date(now - (j * 40 + i * 600) * 1000),
            statusCode: isErr ? 500 : 200,
            responseTime: isErr ? Math.round(1800 + Math.random() * 1200) : Math.round(75 + Math.random() * 80),
            method: 'POST',
            endpoint: '/api/payment',
            errorMessage: isErr ? 'Database connection pool exhausted after upstream 3DS callback timeout' : null
          }
        });
      }
    }
  }

  // Also seed healthy metrics for Login API
  for (let i = aggregatePoints; i >= 0; i--) {
    const pointTime = new Date(now - i * 3600 * 1000);
    await prisma.metricAggregate.create({
      data: {
        apiId: loginApi.id,
        timestamp: pointTime,
        requestCount: 3800 + Math.round(Math.random() * 400),
        errorCount: 3,
        clientErrorCount: 3,
        serverErrorCount: 0,
        avgLatency: 55,
        p50: 45,
        p95: 120,
        p99: 180
      }
    });
  }

  console.log('✅ MetricAggregates and RequestMetrics seeded');

  // 8. Create Anomalies
  const anomalyTime = new Date(depTime.getTime() + 6 * 60 * 1000); // 6 minutes after deploy!
  const anomaly = await prisma.anomaly.create({
    data: {
      apiId: paymentApi.id,
      metricType: 'ERROR_RATE',
      detectedValue: 17.8,
      baselineValue: 1.2,
      deviation: 4.8,
      severity: 'critical',
      status: 'OPEN',
      detectedAt: anomalyTime
    }
  });

  const latencyAnomaly = await prisma.anomaly.create({
    data: {
      apiId: paymentApi.id,
      metricType: 'LATENCY',
      detectedValue: 2800,
      baselineValue: 210,
      deviation: 5.2,
      severity: 'critical',
      status: 'OPEN',
      detectedAt: anomalyTime
    }
  });

  console.log('✅ Anomalies created');

  // 9. Create Active Incident #1042
  const incident1042 = await prisma.incident.create({
    data: {
      id: 'inc-1042',
      apiId: paymentApi.id,
      anomalyId: anomaly.id,
      title: 'Error rate & latency spike on Payment Gateway',
      description: 'Error rate increased sharply to 17.8% with P95 latency degraded to 2.8s',
      severity: 'critical',
      status: 'INVESTIGATING',
      detectedAt: anomalyTime,
      acknowledgedAt: new Date(anomalyTime.getTime() + 4 * 60 * 1000)
    }
  });

  // Timeline events for Incident #1042
  const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  await prisma.incidentEvent.createMany({
    data: [
      {
        incidentId: incident1042.id,
        type: 'deployment',
        message: 'Release v1.8 deployed to production by alex.chen (commit a8f192b)',
        timestamp: depTime,
        metadata: {
          version: 'v1.8',
          service: 'Payment API',
          deployedAt: formatTime(depTime),
          detectedAt: formatTime(anomalyTime),
          timeDifference: '6 minutes',
          commit: 'a8f192b',
          author: 'alex.chen',
          message: 'feat(payments): switch to asynchronous 3DS validation pipeline',
          description: 'Error rate increased shortly after deployment. Latency degradation began 4 minutes post-deploy.'
        }
      },
      {
        incidentId: incident1042.id,
        type: 'warning',
        message: 'P95 response time rose from 210ms baseline to 1,420ms',
        timestamp: new Date(depTime.getTime() + 4 * 60 * 1000)
      },
      {
        incidentId: incident1042.id,
        type: 'warning',
        message: 'HTTP 500 status returns climbed from 0.8% to 11.4%',
        timestamp: new Date(depTime.getTime() + 5 * 60 * 1000)
      },
      {
        incidentId: incident1042.id,
        type: 'anomaly',
        message: 'FaultLens statistical engine detected 4.8σ deviation on payment worker throughput',
        timestamp: anomalyTime,
        metadata: { anomalyId: anomaly.id }
      },
      {
        incidentId: incident1042.id,
        type: 'incident',
        message: 'Automated alert dispatched to On-Call (Jeel) and Slack channel #eng-incidents',
        timestamp: anomalyTime
      },
      {
        incidentId: incident1042.id,
        type: 'action',
        message: 'Status moved to Investigating by Jeel (Developer)',
        timestamp: new Date(anomalyTime.getTime() + 4 * 60 * 1000),
        metadata: { updatedBy: 'Jeel (Developer)' }
      }
    ]
  });

  // Create Resolved Incident #1040 for Contact API
  const pastIncidentTime = new Date(Date.now() - 3 * 24 * 3600 * 1000);
  const incident1040 = await prisma.incident.create({
    data: {
      id: 'inc-1040',
      apiId: contactApi.id,
      title: 'SMTP Timeout on Contact Submission',
      description: 'Nodemailer connection timeout to upstream mail server',
      severity: 'resolved',
      status: 'RESOLVED',
      detectedAt: pastIncidentTime,
      acknowledgedAt: new Date(pastIncidentTime.getTime() + 5 * 60 * 1000),
      resolvedAt: new Date(pastIncidentTime.getTime() + 25 * 60 * 1000)
    }
  });

  await prisma.incidentEvent.createMany({
    data: [
      {
        incidentId: incident1040.id,
        type: 'anomaly',
        message: 'Outbound port 587 socket timeout exceeded 5000ms',
        timestamp: pastIncidentTime
      },
      {
        incidentId: incident1040.id,
        type: 'resolved',
        message: 'Incident marked as RESOLVED after cert rotation',
        timestamp: new Date(pastIncidentTime.getTime() + 25 * 60 * 1000),
        metadata: { updatedBy: 'Jeel (Developer)' }
      }
    ]
  });

  console.log('✅ Incidents and chronological timeline events seeded');

  // 10. Seed Realistic Logs for Logs Page
  await prisma.log.createMany({
    data: [
      {
        id: 'log-001',
        apiId: paymentApi.id,
        timestamp: new Date(now - 12 * 1000),
        level: 'ERROR',
        message: 'Unhandled Promise Rejection: Timeout waiting for 3DS verification callback from upstream banking provider after 1800ms',
        statusCode: 500,
        metadata: {
          method: 'POST',
          endpoint: '/api/payment',
          responseTime: 1842,
          ip: '192.168.4.11',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': 'req_98fa27a6c9',
            'Authorization': 'Bearer sk_live_***8942'
          },
          payload: { amount: 149.99, currency: 'USD', method: 'credit_card', card_brand: 'visa' },
          stackTrace: 'Error: Timeout waiting for 3DS verification callback\n    at PaymentPipeline.process3DS (src/services/paymentPipeline.ts:142:19)\n    at async PaymentController.charge (src/controllers/payment.ts:58:12)'
        }
      },
      {
        id: 'log-002',
        apiId: paymentApi.id,
        timestamp: new Date(now - 25 * 1000),
        level: 'ERROR',
        message: 'Gateway Error: Connection reset by peer while reading upstream payment intent payload',
        statusCode: 500,
        metadata: {
          method: 'POST',
          endpoint: '/api/payment',
          responseTime: 1920,
          ip: '104.28.210.4',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': 'req_22ea11b8df'
          },
          payload: { amount: 42.0, currency: 'USD', method: 'apple_pay' },
          stackTrace: 'Error: Connection reset by peer\n    at Socket.socketError (node_modules/http2/lib/core.js:421:11)'
        }
      },
      {
        id: 'log-003',
        apiId: loginApi.id,
        timestamp: new Date(now - 60 * 1000),
        level: 'INFO',
        message: 'JWT authentication token successfully issued for customer account',
        statusCode: 200,
        metadata: {
          method: 'POST',
          endpoint: '/api/login',
          responseTime: 64,
          ip: '198.51.100.22',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      },
      {
        id: 'log-004',
        apiId: ordersApi.id,
        timestamp: new Date(now - 90 * 1000),
        level: 'WARN',
        message: 'Slow database query: SQL query execution exceeded 500ms warning threshold on recent orders join',
        statusCode: 200,
        metadata: {
          method: 'GET',
          endpoint: '/api/orders',
          responseTime: 680,
          ip: '172.56.21.9'
        }
      }
    ]
  });

  console.log('✅ Realistic logs seeded');
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
