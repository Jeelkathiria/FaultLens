/**
 * FaultLens Fallback Mock Datasets
 * Ensures the platform remains functional and resilient when database connections are offline/degraded.
 */

const mockWebsites = [
  {
    id: 'w-ecommerce',
    name: 'My E-Commerce',
    url: 'https://mystore.com',
    displayUrl: 'mystore.com',
    environment: 'Production',
    health: 'critical',
    uptime: 98.2,
    apiCount: 4,
    totalRequests24h: 38400,
    activeIncidents: 1,
    lastChecked: 'Just now',
    description: 'Main production customer checkout & storefront gateway',
    createdDate: new Date().toISOString().split('T')[0],
    uptimeHistory: Array(90).fill(1.0).map((v, i) => (i >= 88 ? 0.91 : 1.0))
  },
  {
    id: 'w-foodapp',
    name: 'Food Delivery',
    url: 'https://foodapp.com',
    displayUrl: 'foodapp.com',
    environment: 'Production',
    health: 'degraded',
    uptime: 99.4,
    apiCount: 1,
    totalRequests24h: 18200,
    activeIncidents: 0,
    lastChecked: 'Just now',
    description: 'Courier routing & live restaurant ordering system',
    createdDate: new Date().toISOString().split('T')[0],
    uptimeHistory: Array(90).fill(1.0).map((v, i) => (i >= 88 ? 0.96 : 1.0))
  },
  {
    id: 'w-portfolio',
    name: 'Portfolio',
    url: 'https://jeel.dev',
    displayUrl: 'jeel.dev',
    environment: 'Production',
    health: 'healthy',
    uptime: 100.0,
    apiCount: 1,
    totalRequests24h: 4200,
    activeIncidents: 0,
    lastChecked: 'Just now',
    description: 'Personal projects and developer sandbox showcase',
    createdDate: new Date().toISOString().split('T')[0],
    uptimeHistory: Array(90).fill(1.0)
  },
  {
    id: 'w-fintech',
    name: 'Fintech Core',
    url: 'https://api.fintech.io',
    displayUrl: 'api.fintech.io',
    environment: 'Staging',
    health: 'healthy',
    uptime: 99.95,
    apiCount: 0,
    totalRequests24h: 8900,
    activeIncidents: 0,
    lastChecked: 'Just now',
    description: 'Internal ledger processing and bank reconciliation engine',
    createdDate: new Date().toISOString().split('T')[0],
    uptimeHistory: Array(90).fill(1.0)
  }
];

const mockApis = [
  {
    id: 'api-payment',
    websiteId: 'w-ecommerce',
    name: 'Payment API',
    endpoint: '/api/payment',
    method: 'POST',
    status: 'critical',
    monitoringInterval: '30s',
    healthCheckEndpoint: '/api/payment/health',
    requestsCount: 2840,
    errorRate: 17.8,
    p95Latency: 2800
  },
  {
    id: 'api-login',
    websiteId: 'w-ecommerce',
    name: 'Login API',
    endpoint: '/api/login',
    method: 'POST',
    status: 'healthy',
    monitoringInterval: '60s',
    healthCheckEndpoint: '/api/login/status',
    requestsCount: 4120,
    errorRate: 0.1,
    p95Latency: 120
  },
  {
    id: 'api-orders',
    websiteId: 'w-ecommerce',
    name: 'Orders API',
    endpoint: '/api/orders',
    method: 'GET',
    status: 'degraded',
    monitoringInterval: '30s',
    healthCheckEndpoint: '/api/orders/health',
    requestsCount: 1940,
    errorRate: 3.2,
    p95Latency: 740
  },
  {
    id: 'api-checkout',
    websiteId: 'w-ecommerce',
    name: 'Checkout API',
    endpoint: '/api/checkout',
    method: 'POST',
    status: 'healthy',
    monitoringInterval: '60s',
    healthCheckEndpoint: '/api/checkout/live',
    requestsCount: 2200,
    errorRate: 0.4,
    p95Latency: 180
  },
  {
    id: 'api-restaurants',
    websiteId: 'w-foodapp',
    name: 'Restaurants Catalog API',
    endpoint: '/api/v1/restaurants',
    method: 'GET',
    status: 'healthy',
    monitoringInterval: '60s',
    healthCheckEndpoint: '/api/v1/restaurants/health',
    requestsCount: 3100,
    errorRate: 0.2,
    p95Latency: 95
  }
];

const mockDeployments = [
  {
    id: 'dep-108',
    version: 'v1.8',
    service: 'Payment API',
    apiId: 'api-payment',
    websiteId: 'w-ecommerce',
    websiteName: 'My E-Commerce',
    commit: 'a8f192b',
    commitMessage: 'feat(payments): switch to asynchronous 3DS validation pipeline',
    branch: 'main',
    author: 'alex.chen',
    authorAvatar: 'https://ui-avatars.com/api/?name=Alex+Chen&background=4f46e5&color=fff',
    deployedAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    deployedTimestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    status: 'incident',
    statusLabel: 'Incident Detected',
    environment: 'PRODUCTION'
  },
  {
    id: 'dep-107',
    version: 'v1.7',
    service: 'Payment API',
    apiId: 'api-payment',
    websiteId: 'w-ecommerce',
    websiteName: 'My E-Commerce',
    commit: '3b90df1',
    commitMessage: 'perf: add redis cache for merchant tax lookup table',
    branch: 'main',
    author: 'jeel.kathiria',
    authorAvatar: 'https://ui-avatars.com/api/?name=Jeel+Kathiria&background=4f46e5&color=fff',
    deployedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    deployedTimestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    status: 'stable',
    statusLabel: 'Stable',
    environment: 'PRODUCTION'
  },
  {
    id: 'dep-106',
    version: 'v2.4.1',
    service: 'Orders API',
    apiId: 'api-orders',
    websiteId: 'w-ecommerce',
    websiteName: 'My E-Commerce',
    commit: '7e2a84c',
    commitMessage: 'fix: optimize nested SQL join on order customer query',
    branch: 'release/v2.4',
    author: 'david.miller',
    authorAvatar: 'https://ui-avatars.com/api/?name=David+Miller&background=4f46e5&color=fff',
    deployedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    deployedTimestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    status: 'stable',
    statusLabel: 'Stable',
    environment: 'PRODUCTION'
  },
  {
    id: 'dep-105',
    version: 'v3.1.0',
    service: 'Restaurants Catalog API',
    apiId: 'api-restaurants',
    websiteId: 'w-foodapp',
    websiteName: 'Food Delivery',
    commit: '9c4b12f',
    commitMessage: 'feat(geo): add spatial index for restaurant radius lookup',
    branch: 'main',
    author: 'elena.rostova',
    authorAvatar: 'https://ui-avatars.com/api/?name=Elena+Rostova&background=4f46e5&color=fff',
    deployedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    deployedTimestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    status: 'stable',
    statusLabel: 'Stable',
    environment: 'PRODUCTION'
  }
];

const mockIncidents = [
  {
    id: 'inc-1042',
    number: '#1042',
    title: 'Error rate & latency spike on Payment Gateway',
    summary: 'Error rate increased sharply to 17.8% with P95 latency degraded to 2.8s',
    apiId: 'api-payment',
    apiName: 'Payment API',
    websiteId: 'w-ecommerce',
    websiteName: 'My E-Commerce',
    severity: 'critical',
    status: 'investigating',
    detectedAt: '12:44 PM',
    detectedTimestamp: new Date(Date.now() - 16 * 60 * 1000).toISOString(),
    duration: '16 minutes',
    timeAgo: '16 min ago',
    metrics: {
      errorRateBefore: '1.2%',
      errorRateCurrent: '17.8%',
      latencyBefore: '210ms',
      latencyCurrent: '2.8s',
      affectedRequests: '4,210 requests',
      impactedUsers: '~1,450 sessions'
    },
    correlatedDeployment: {
      version: 'v1.8',
      service: 'Payment API',
      deployedAt: '12:38 PM',
      detectedAt: '12:44 PM',
      timeDifference: '6 minutes',
      commit: 'a8f192b',
      author: 'alex.chen',
      message: 'feat(payments): switch to asynchronous 3DS validation pipeline',
      description: 'Error rate increased shortly after deployment. Latency degradation began 4 minutes post-deploy.'
    },
    timeline: [
      {
        id: 't-1',
        time: '12:38 PM',
        type: 'deployment',
        title: 'Release v1.8 deployed to production by alex.chen (commit a8f192b)',
        description: 'Release v1.8 deployed to production by alex.chen (commit a8f192b)',
        badge: 'v1.8'
      },
      {
        id: 't-2',
        time: '12:42 PM',
        type: 'warning',
        title: 'P95 response time rose from 210ms baseline to 1,420ms',
        description: 'P95 response time rose from 210ms baseline to 1,420ms',
        badge: 'Warning'
      },
      {
        id: 't-3',
        time: '12:43 PM',
        type: 'warning',
        title: 'HTTP 500 status returns climbed from 0.8% to 11.4%',
        description: 'HTTP 500 status returns climbed from 0.8% to 11.4%',
        badge: 'Warning'
      },
      {
        id: 't-4',
        time: '12:44 PM',
        type: 'anomaly',
        title: 'FaultLens statistical engine detected 4.8σ deviation on payment worker throughput',
        description: 'FaultLens statistical engine detected 4.8σ deviation on payment worker throughput',
        badge: 'Anomaly'
      },
      {
        id: 't-5',
        time: '12:44 PM',
        type: 'incident',
        title: 'Automated alert dispatched to On-Call (Jeel) and Slack channel #eng-incidents',
        description: 'Automated alert dispatched to On-Call (Jeel) and Slack channel #eng-incidents',
        badge: 'CRITICAL'
      },
      {
        id: 't-6',
        time: '12:48 PM',
        type: 'action',
        title: 'Status moved to Investigating by Jeel (Developer)',
        description: 'Status moved to Investigating by Jeel (Developer)',
        badge: 'Action'
      }
    ],
    activityLog: [
      {
        user: 'System Bot',
        action: 'Incident created automatically from statistical anomaly engine',
        time: '12:44 PM'
      },
      {
        user: 'Jeel (Developer)',
        action: 'Acknowledged incident and updated status to INVESTIGATING',
        time: '12:48 PM'
      }
    ]
  },
  {
    id: 'inc-1040',
    number: '#1040',
    title: 'SMTP Timeout on Contact Submission',
    summary: 'Nodemailer connection timeout to upstream mail server',
    apiId: 'api-contact',
    apiName: 'Contact Form API',
    websiteId: 'w-portfolio',
    websiteName: 'Portfolio',
    severity: 'resolved',
    status: 'resolved',
    detectedAt: 'Yesterday',
    detectedTimestamp: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    duration: '25 minutes',
    timeAgo: '1 day ago',
    metrics: {
      errorRateBefore: '0.0%',
      errorRateCurrent: '8.4%',
      latencyBefore: '90ms',
      latencyCurrent: '5.2s',
      affectedRequests: '42 requests',
      impactedUsers: '18 sessions'
    },
    correlatedDeployment: null,
    timeline: [
      {
        id: 't-20',
        time: '10:15 AM',
        type: 'anomaly',
        title: 'Outbound port 587 socket timeout exceeded 5000ms',
        description: 'Outbound port 587 socket timeout exceeded 5000ms',
        badge: 'Anomaly'
      },
      {
        id: 't-21',
        time: '10:40 AM',
        type: 'resolved',
        title: 'Incident marked as RESOLVED after cert rotation',
        description: 'Incident marked as RESOLVED after cert rotation',
        badge: 'Resolved'
      }
    ],
    activityLog: [
      {
        user: 'System Bot',
        action: 'Incident created automatically',
        time: '10:15 AM'
      },
      {
        user: 'Jeel (Developer)',
        action: 'Incident marked as RESOLVED',
        time: '10:40 AM'
      }
    ]
  }
];

const mockLogs = [
  {
    id: 'log-001',
    timestamp: new Date(Date.now() - 12 * 1000).toTimeString().split(' ')[0],
    fullTimestamp: new Date(Date.now() - 12 * 1000).toISOString().replace('T', ' ').replace('Z', ''),
    method: 'POST',
    endpoint: '/api/payment',
    statusCode: 500,
    latency: 1842,
    severity: 'error',
    websiteId: 'w-ecommerce',
    websiteName: 'My E-Commerce',
    apiId: 'api-payment',
    apiName: 'Payment API',
    ip: '192.168.4.11',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
    message: 'Unhandled Promise Rejection: Timeout waiting for 3DS verification callback from upstream banking provider after 1800ms',
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': 'req_98fa27a6c9',
      'Authorization': 'Bearer sk_live_***8942'
    },
    payload: { amount: 149.99, currency: 'USD', method: 'credit_card', card_brand: 'visa' },
    stackTrace: 'Error: Timeout waiting for 3DS verification callback\n    at PaymentPipeline.process3DS (src/services/paymentPipeline.ts:142:19)\n    at async PaymentController.charge (src/controllers/payment.ts:58:12)'
  },
  {
    id: 'log-002',
    timestamp: new Date(Date.now() - 25 * 1000).toTimeString().split(' ')[0],
    fullTimestamp: new Date(Date.now() - 25 * 1000).toISOString().replace('T', ' ').replace('Z', ''),
    method: 'POST',
    endpoint: '/api/payment',
    statusCode: 500,
    latency: 1920,
    severity: 'error',
    websiteId: 'w-ecommerce',
    websiteName: 'My E-Commerce',
    apiId: 'api-payment',
    apiName: 'Payment API',
    ip: '104.28.210.4',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    message: 'Gateway Error: Connection reset by peer while reading upstream payment intent payload',
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': 'req_22ea11b8df'
    },
    payload: { amount: 42.0, currency: 'USD', method: 'apple_pay' },
    stackTrace: 'Error: Connection reset by peer\n    at Socket.socketError (node_modules/http2/lib/core.js:421:11)'
  },
  {
    id: 'log-003',
    timestamp: new Date(Date.now() - 60 * 1000).toTimeString().split(' ')[0],
    fullTimestamp: new Date(Date.now() - 60 * 1000).toISOString().replace('T', ' ').replace('Z', ''),
    method: 'POST',
    endpoint: '/api/login',
    statusCode: 200,
    latency: 64,
    severity: 'info',
    websiteId: 'w-ecommerce',
    websiteName: 'My E-Commerce',
    apiId: 'api-login',
    apiName: 'Login API',
    ip: '198.51.100.22',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    message: 'JWT authentication token successfully issued for customer account',
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': 'req_39b0d1e2'
    },
    payload: null,
    stackTrace: null
  },
  {
    id: 'log-004',
    timestamp: new Date(Date.now() - 90 * 1000).toTimeString().split(' ')[0],
    fullTimestamp: new Date(Date.now() - 90 * 1000).toISOString().replace('T', ' ').replace('Z', ''),
    method: 'GET',
    endpoint: '/api/orders',
    statusCode: 200,
    latency: 680,
    severity: 'warn',
    websiteId: 'w-ecommerce',
    websiteName: 'My E-Commerce',
    apiId: 'api-orders',
    apiName: 'Orders API',
    ip: '172.56.21.9',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    message: 'Slow database query: SQL query execution exceeded 500ms warning threshold on recent orders join',
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': 'req_84ef1192'
    },
    payload: null,
    stackTrace: null
  }
];

const mockUsers = [
  {
    id: 'usr-admin-01',
    name: 'Sarah Connor',
    email: 'admin@faultlens.dev',
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Connor&background=7c3aed&color=fff',
    role: 'Admin',
    websitesCount: 4,
    status: 'Active',
    lastActive: 'Just now'
  },
  {
    id: 'usr-dev-01',
    name: 'Jeel Kathiria',
    email: 'jeel@faultlens.dev',
    avatar: 'https://ui-avatars.com/api/?name=Jeel+Kathiria&background=4f46e5&color=fff',
    role: 'Developer',
    websitesCount: 3,
    status: 'Active',
    lastActive: 'Just now'
  }
];

module.exports = {
  mockWebsites,
  mockApis,
  mockDeployments,
  mockIncidents,
  mockLogs,
  mockUsers
};
