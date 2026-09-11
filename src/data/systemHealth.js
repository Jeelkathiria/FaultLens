export const faultLensSystemServices = [
  {
    name: 'API Collector',
    description: 'High-throughput UDP/gRPC edge ingest cluster',
    status: 'healthy',
    uptime: '99.99%',
    latency: '3ms',
    throughput: '4,210 events/sec',
    version: 'v3.4.1'
  },
  {
    name: 'Monitoring Engine',
    description: 'Time-series anomaly detector & threshold evaluator',
    status: 'healthy',
    uptime: '99.98%',
    latency: '18ms',
    throughput: '3,890 checks/sec',
    version: 'v2.1.0'
  },
  {
    name: 'Redis',
    description: 'Sliding-window rate limiter & real-time metric cache',
    status: 'healthy',
    uptime: '100%',
    latency: '< 1ms',
    throughput: '14,200 ops/sec',
    version: '7.2-alpine'
  },
  {
    name: 'Database',
    description: 'Distributed TimescaleDB telemetry cluster',
    status: 'healthy',
    uptime: '99.99%',
    latency: '12ms',
    throughput: '820 writes/sec',
    version: 'PostgreSQL 16.2'
  },
  {
    name: 'WebSocket',
    description: 'Live subscription broadcaster for dashboard clients',
    status: 'healthy',
    uptime: '99.95%',
    latency: '8ms',
    throughput: '1,840 conns active',
    version: 'v1.12.3'
  }
];

export const systemMetrics = {
  eventsPerSec: 4210,
  queueSize: 142,
  processingLatency: '18.4ms',
  systemUptime: '99.99%',
  activeNodes: 12,
  memoryUsage: '64.2%',
  cpuLoad: '38.5%'
};
