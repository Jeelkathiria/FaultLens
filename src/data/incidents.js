export const initialIncidents = [
  {
    id: 'inc-1042',
    number: '#1042',
    title: 'Error rate & latency spike on Payment Gateway',
    apiId: 'api-payment',
    apiName: 'Payment API',
    websiteId: 'w-ecommerce',
    websiteName: 'My E-Commerce',
    severity: 'critical', // critical | warning | resolved
    status: 'investigating', // detected | investigating | mitigated | resolved
    summary: 'Error rate increased sharply to 17.8% with P95 latency degraded to 2.8s',
    detectedAt: '12:36 PM',
    detectedTimestamp: '2026-09-11T12:36:00Z',
    duration: '14 minutes',
    timeAgo: '6 min ago',
    
    // Key metric comparison
    metrics: {
      errorRateBefore: '1.2%',
      errorRateCurrent: '17.8%',
      latencyBefore: '210ms',
      latencyCurrent: '2.8s',
      affectedRequests: '4,210 requests',
      impactedUsers: '~1,450 sessions'
    },

    // Deployment correlation
    correlatedDeployment: {
      version: 'v1.8',
      service: 'Payment API',
      deployedAt: '12:30 PM',
      detectedAt: '12:36 PM',
      timeDifference: '6 minutes',
      commit: 'a8f192b',
      author: 'alex.chen',
      message: 'feat(payments): switch to asynchronous 3DS validation pipeline',
      description: 'Error rate increased shortly after deployment. Latency degradation began 4 minutes post-deploy.'
    },

    // Timeline
    timeline: [
      {
        id: 't-1',
        time: '12:30 PM',
        type: 'deployment',
        icon: 'Rocket',
        title: 'Deployment v1.8',
        description: 'Release v1.8 deployed to production by alex.chen (commit a8f192b)',
        badge: 'v1.8'
      },
      {
        id: 't-2',
        time: '12:34 PM',
        type: 'warning',
        icon: 'AlertTriangle',
        title: 'Latency increased',
        description: 'P95 response time rose from 210ms baseline to 1,420ms',
        badge: 'Latency'
      },
      {
        id: 't-3',
        time: '12:35 PM',
        type: 'warning',
        icon: 'AlertTriangle',
        title: 'Error rate increased',
        description: 'HTTP 500 status returns climbed from 0.8% to 11.4%',
        badge: 'Errors'
      },
      {
        id: 't-4',
        time: '12:36 PM',
        type: 'anomaly',
        icon: 'Activity',
        title: 'Anomaly detected',
        description: 'FaultLens statistical engine detected 4.8σ deviation on payment worker throughput',
        badge: 'Anomaly'
      },
      {
        id: 't-5',
        time: '12:36 PM',
        type: 'incident',
        icon: 'AlertOctagon',
        title: 'Incident created',
        description: 'Automated alert dispatched to On-Call (Jeel) and Slack channel #eng-incidents',
        badge: 'Critical'
      }
    ],

    // Audit logs of status changes
    activityLog: [
      { user: 'System Bot', action: 'Incident created automatically', time: '12:36 PM' },
      { user: 'Jeel (Developer)', action: 'Status moved to Investigating', time: '12:40 PM' }
    ]
  },
  {
    id: 'inc-1041',
    number: '#1041',
    title: 'High latency on Orders querying endpoint',
    apiId: 'api-orders',
    apiName: 'Orders API',
    websiteId: 'w-ecommerce',
    websiteName: 'My E-Commerce',
    severity: 'warning',
    status: 'detected',
    summary: 'Latency increased beyond 600ms SLA threshold',
    detectedAt: '12:48 PM',
    detectedTimestamp: '2026-09-11T12:48:00Z',
    duration: '2 minutes',
    timeAgo: '2 min ago',
    metrics: {
      errorRateBefore: '0.4%',
      errorRateCurrent: '4.2%',
      latencyBefore: '180ms',
      latencyCurrent: '640ms',
      affectedRequests: '890 requests',
      impactedUsers: '~320 sessions'
    },
    correlatedDeployment: null,
    timeline: [
      {
        id: 't-101',
        time: '12:47 PM',
        type: 'warning',
        icon: 'AlertTriangle',
        title: 'Database connection pool saturation',
        description: 'Postgres query latency crossed 450ms',
        badge: 'Warning'
      },
      {
        id: 't-102',
        time: '12:48 PM',
        type: 'incident',
        icon: 'AlertOctagon',
        title: 'Incident #1041 created',
        description: 'Orders API latency threshold exceeded',
        badge: 'Warning'
      }
    ],
    activityLog: [
      { user: 'System Bot', action: 'Incident created automatically', time: '12:48 PM' }
    ]
  },
  {
    id: 'inc-1040',
    number: '#1040',
    title: 'Contact form upstream mail server timeout',
    apiId: 'api-contact',
    apiName: 'Contact Form API',
    websiteId: 'w-portfolio',
    websiteName: 'Portfolio',
    severity: 'critical',
    status: 'investigating',
    summary: 'Error rate 34.0% with 504 Gateway Timeout responses',
    detectedAt: '11:15 AM',
    detectedTimestamp: '2026-09-11T11:15:00Z',
    duration: '1h 35m',
    timeAgo: '1h 35m ago',
    metrics: {
      errorRateBefore: '0.0%',
      errorRateCurrent: '34.0%',
      latencyBefore: '90ms',
      latencyCurrent: '4.1s',
      affectedRequests: '140 requests',
      impactedUsers: '~95 sessions'
    },
    correlatedDeployment: null,
    timeline: [
      {
        id: 't-201',
        time: '11:14 AM',
        type: 'warning',
        icon: 'AlertTriangle',
        title: 'SMTP host unresponsive',
        description: 'Upstream relay closed connection after 4000ms',
        badge: 'Timeout'
      },
      {
        id: 't-202',
        time: '11:15 AM',
        type: 'incident',
        icon: 'AlertOctagon',
        title: 'Incident created',
        description: 'High error alert triggered',
        badge: 'Critical'
      }
    ],
    activityLog: [
      { user: 'System Bot', action: 'Incident created', time: '11:15 AM' }
    ]
  },
  {
    id: 'inc-1039',
    number: '#1039',
    title: 'Courier GPS batch ingestion jitter',
    apiId: 'api-tracking',
    apiName: 'Courier Tracking API',
    websiteId: 'w-foodapp',
    websiteName: 'Food Delivery',
    severity: 'resolved',
    status: 'resolved',
    summary: 'Intermittent 429 rate limit exceeded on mobile telemetry',
    detectedAt: '09:10 AM',
    detectedTimestamp: '2026-09-11T09:10:00Z',
    duration: '22 minutes',
    timeAgo: '3h ago',
    metrics: {
      errorRateBefore: '0.2%',
      errorRateCurrent: '0.2%',
      latencyBefore: '140ms',
      latencyCurrent: '145ms',
      affectedRequests: '320 requests',
      impactedUsers: '~45 couriers'
    },
    correlatedDeployment: null,
    timeline: [
      {
        id: 't-301',
        time: '09:10 AM',
        type: 'warning',
        icon: 'AlertTriangle',
        title: 'Rate limiter backpressure triggered',
        description: 'Redis token bucket filled',
        badge: 'Warning'
      },
      {
        id: 't-302',
        time: '09:32 AM',
        type: 'resolved',
        icon: 'CheckCircle2',
        title: 'Bucket capacity doubled, resolved',
        description: 'DevOps expanded rate limit window',
        badge: 'Resolved'
      }
    ],
    activityLog: [
      { user: 'System Bot', action: 'Incident created', time: '09:10 AM' },
      { user: 'DevOps (Sarah)', action: 'Status marked Resolved', time: '09:32 AM' }
    ]
  }
];
