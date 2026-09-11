export const initialApis = [
  // E-Commerce APIs (Website ID: w-ecommerce)
  {
    id: 'api-payment',
    websiteId: 'w-ecommerce',
    name: 'Payment API',
    endpoint: '/api/payment',
    method: 'POST',
    status: 'critical', // healthy | degraded | critical
    uptime: 98.1,
    p95Latency: 2800, // in ms (2.8s)
    p50Latency: 620,
    p99Latency: 4200,
    errorRate: 17.8, // %
    requestsCount: 25430,
    monitoringInterval: '30s',
    healthCheckEndpoint: '/api/payment/health',
    lastChecked: '4 seconds ago',
    correlatedIncidentId: 'inc-1042',
    endpointsTable: [
      { endpoint: 'POST /payment', requests: 12430, errorRate: '18.2%', p95: '2.9s', status: 500 },
      { endpoint: 'GET /payment', requests: 8240, errorRate: '2.1%', p95: '410ms', status: 200 },
      { endpoint: 'POST /refund', requests: 4760, errorRate: '4.8%', p95: '620ms', status: 200 },
    ]
  },
  {
    id: 'api-login',
    websiteId: 'w-ecommerce',
    name: 'Login API',
    endpoint: '/api/login',
    method: 'POST',
    status: 'healthy',
    uptime: 99.99,
    p95Latency: 120,
    p50Latency: 45,
    p99Latency: 180,
    errorRate: 0.1,
    requestsCount: 68200,
    monitoringInterval: '60s',
    healthCheckEndpoint: '/api/login/status',
    lastChecked: '18 seconds ago',
    correlatedIncidentId: null,
    endpointsTable: [
      { endpoint: 'POST /auth/token', requests: 45000, errorRate: '0.08%', p95: '115ms', status: 200 },
      { endpoint: 'POST /auth/refresh', requests: 23200, errorRate: '0.12%', p95: '125ms', status: 200 }
    ]
  },
  {
    id: 'api-orders',
    websiteId: 'w-ecommerce',
    name: 'Orders API',
    endpoint: '/api/orders',
    method: 'GET',
    status: 'degraded',
    uptime: 99.1,
    p95Latency: 640,
    p50Latency: 280,
    p99Latency: 980,
    errorRate: 4.2,
    requestsCount: 42100,
    monitoringInterval: '30s',
    healthCheckEndpoint: '/api/orders/health',
    lastChecked: '25 seconds ago',
    correlatedIncidentId: 'inc-1041',
    endpointsTable: [
      { endpoint: 'GET /orders/recent', requests: 28000, errorRate: '3.8%', p95: '590ms', status: 200 },
      { endpoint: 'GET /orders/:id', requests: 14100, errorRate: '4.9%', p95: '710ms', status: 200 }
    ]
  },
  {
    id: 'api-checkout',
    websiteId: 'w-ecommerce',
    name: 'Checkout API',
    endpoint: '/api/checkout',
    method: 'POST',
    status: 'healthy',
    uptime: 99.92,
    p95Latency: 310,
    p50Latency: 140,
    p99Latency: 480,
    errorRate: 0.4,
    requestsCount: 18850,
    monitoringInterval: '60s',
    healthCheckEndpoint: '/api/checkout/live',
    lastChecked: '32 seconds ago',
    correlatedIncidentId: null,
    endpointsTable: [
      { endpoint: 'POST /checkout/cart', requests: 12500, errorRate: '0.3%', p95: '290ms', status: 200 },
      { endpoint: 'POST /checkout/validate', requests: 6350, errorRate: '0.5%', p95: '330ms', status: 200 }
    ]
  },

  // Food Delivery APIs (Website ID: w-foodapp)
  {
    id: 'api-restaurants',
    websiteId: 'w-foodapp',
    name: 'Restaurants Catalog API',
    endpoint: '/api/v1/restaurants',
    method: 'GET',
    status: 'healthy',
    uptime: 99.98,
    p95Latency: 145,
    p50Latency: 65,
    p99Latency: 220,
    errorRate: 0.2,
    requestsCount: 35120,
    monitoringInterval: '60s',
    healthCheckEndpoint: '/api/v1/restaurants/ping',
    lastChecked: '14 seconds ago',
    correlatedIncidentId: null,
    endpointsTable: [
      { endpoint: 'GET /v1/restaurants/near', requests: 25000, errorRate: '0.2%', p95: '140ms', status: 200 },
      { endpoint: 'GET /v1/restaurants/menu', requests: 10120, errorRate: '0.3%', p95: '160ms', status: 200 }
    ]
  },
  {
    id: 'api-tracking',
    websiteId: 'w-foodapp',
    name: 'Courier Tracking API',
    endpoint: '/api/v1/dispatch/track',
    method: 'GET',
    status: 'degraded',
    uptime: 98.4,
    p95Latency: 820,
    p50Latency: 340,
    p99Latency: 1400,
    errorRate: 5.6,
    requestsCount: 22400,
    monitoringInterval: '30s',
    healthCheckEndpoint: '/api/v1/dispatch/health',
    lastChecked: '8 seconds ago',
    correlatedIncidentId: null,
    endpointsTable: [
      { endpoint: 'GET /dispatch/track/live', requests: 17400, errorRate: '6.1%', p95: '880ms', status: 200 },
      { endpoint: 'POST /dispatch/ping', requests: 5000, errorRate: '3.8%', p95: '620ms', status: 200 }
    ]
  },
  {
    id: 'api-couriers',
    websiteId: 'w-foodapp',
    name: 'Couriers API',
    endpoint: '/api/v1/couriers',
    method: 'POST',
    status: 'healthy',
    uptime: 99.94,
    p95Latency: 190,
    p50Latency: 85,
    p99Latency: 280,
    errorRate: 0.3,
    requestsCount: 14200,
    monitoringInterval: '60s',
    healthCheckEndpoint: '/api/v1/couriers/status',
    lastChecked: '40 seconds ago',
    correlatedIncidentId: null,
    endpointsTable: [
      { endpoint: 'POST /couriers/status', requests: 14200, errorRate: '0.3%', p95: '190ms', status: 200 }
    ]
  },
  {
    id: 'api-ratings',
    websiteId: 'w-foodapp',
    name: 'Ratings & Reviews API',
    endpoint: '/api/v1/reviews',
    method: 'POST',
    status: 'healthy',
    uptime: 99.91,
    p95Latency: 160,
    p50Latency: 70,
    p99Latency: 240,
    errorRate: 0.1,
    requestsCount: 12600,
    monitoringInterval: '120s',
    healthCheckEndpoint: '/api/v1/reviews/health',
    lastChecked: '55 seconds ago',
    correlatedIncidentId: null,
    endpointsTable: [
      { endpoint: 'POST /reviews/submit', requests: 12600, errorRate: '0.1%', p95: '160ms', status: 200 }
    ]
  },

  // Portfolio APIs (Website ID: w-portfolio)
  {
    id: 'api-contact',
    websiteId: 'w-portfolio',
    name: 'Contact Form API',
    endpoint: '/api/contact',
    method: 'POST',
    status: 'critical',
    uptime: 89.4,
    p95Latency: 4100,
    p50Latency: 1200,
    p99Latency: 6500,
    errorRate: 34.0,
    requestsCount: 2100,
    monitoringInterval: '30s',
    healthCheckEndpoint: '/api/contact/health',
    lastChecked: '2 seconds ago',
    correlatedIncidentId: null,
    endpointsTable: [
      { endpoint: 'POST /contact/send', requests: 2100, errorRate: '34.0%', p95: '4.1s', status: 504 }
    ]
  },
  {
    id: 'api-projects',
    websiteId: 'w-portfolio',
    name: 'Projects Meta API',
    endpoint: '/api/projects',
    method: 'GET',
    status: 'healthy',
    uptime: 99.98,
    p95Latency: 85,
    p50Latency: 35,
    p99Latency: 140,
    errorRate: 0.1,
    requestsCount: 4140,
    monitoringInterval: '120s',
    healthCheckEndpoint: '/api/projects/health',
    lastChecked: '1 minute ago',
    correlatedIncidentId: null,
    endpointsTable: [
      { endpoint: 'GET /projects/all', requests: 4140, errorRate: '0.1%', p95: '85ms', status: 200 }
    ]
  },

  // Fintech Core APIs (Website ID: w-fintech)
  {
    id: 'api-ledger',
    websiteId: 'w-fintech',
    name: 'Ledger Audit API',
    endpoint: '/api/v2/ledger',
    method: 'POST',
    status: 'healthy',
    uptime: 99.99,
    p95Latency: 110,
    p50Latency: 40,
    p99Latency: 160,
    errorRate: 0.05,
    requestsCount: 38100,
    monitoringInterval: '30s',
    healthCheckEndpoint: '/api/v2/ledger/ping',
    lastChecked: '6 seconds ago',
    correlatedIncidentId: null,
    endpointsTable: [
      { endpoint: 'POST /ledger/entries', requests: 38100, errorRate: '0.05%', p95: '110ms', status: 200 }
    ]
  },
  {
    id: 'api-fx',
    websiteId: 'w-fintech',
    name: 'FX Rates API',
    endpoint: '/api/v2/fx/rates',
    method: 'GET',
    status: 'healthy',
    uptime: 99.99,
    p95Latency: 75,
    p50Latency: 28,
    p99Latency: 110,
    errorRate: 0.02,
    requestsCount: 16000,
    monitoringInterval: '30s',
    healthCheckEndpoint: '/api/v2/fx/live',
    lastChecked: '12 seconds ago',
    correlatedIncidentId: null,
    endpointsTable: [
      { endpoint: 'GET /fx/rates/latest', requests: 16000, errorRate: '0.02%', p95: '75ms', status: 200 }
    ]
  }
];
