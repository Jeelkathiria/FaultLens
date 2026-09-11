export const initialWebsites = [
  {
    id: 'w-ecommerce',
    name: 'My E-Commerce',
    url: 'https://mystore.com',
    displayUrl: 'mystore.com',
    environment: 'Production',
    health: 'healthy', // healthy | degraded | critical
    uptime: 99.95,
    apiCount: 4,
    totalRequests24h: 124580,
    activeIncidents: 1, // Payment API has critical incident
    lastChecked: '12 seconds ago',
    description: 'Main production customer checkout & storefront gateway',
    createdDate: '2026-01-15',
    uptimeHistory: [
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 0.95, 0.92 // recent slight dip
    ]
  },
  {
    id: 'w-foodapp',
    name: 'Food Delivery',
    url: 'https://foodapp.com',
    displayUrl: 'foodapp.com',
    environment: 'Production',
    health: 'degraded',
    uptime: 98.72,
    apiCount: 4,
    totalRequests24h: 84320,
    activeIncidents: 1,
    lastChecked: '45 seconds ago',
    description: 'Courier routing & live restaurant ordering system',
    createdDate: '2026-03-02',
    uptimeHistory: [
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      0.9, 0.95, 1, 1, 1, 1, 0.98, 0.95, 0.88, 0.85
    ]
  },
  {
    id: 'w-portfolio',
    name: 'Portfolio',
    url: 'https://jeel.dev',
    displayUrl: 'jeel.dev',
    environment: 'Production',
    health: 'critical',
    uptime: 91.20,
    apiCount: 2,
    totalRequests24h: 6240,
    activeIncidents: 1,
    lastChecked: '1 minute ago',
    description: 'Personal projects and developer sandbox showcase',
    createdDate: '2026-05-12',
    uptimeHistory: [
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      0.9, 0.85, 0.75, 0.6, 0.4, 0.2, 0.1, 0.05, 0, 0
    ]
  },
  {
    id: 'w-fintech',
    name: 'Fintech Core',
    url: 'https://api.fintech.io',
    displayUrl: 'api.fintech.io',
    environment: 'Staging',
    health: 'healthy',
    uptime: 99.99,
    apiCount: 2,
    totalRequests24h: 54100,
    activeIncidents: 0,
    lastChecked: '5 seconds ago',
    description: 'Internal ledger processing and bank reconciliation engine',
    createdDate: '2026-06-20',
    uptimeHistory: Array(90).fill(1)
  }
];
