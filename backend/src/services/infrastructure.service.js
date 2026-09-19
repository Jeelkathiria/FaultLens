const { cache, redisClient, isRedisAvailable } = require('../config/redis');
const prisma = require('../config/database');
const logger = require('../utils/logger');

class InfrastructureService {
  constructor() {
    // Registry of active BullMQ Queues and Workers
    this.queues = new Map();
    this.workers = new Map();

    // Bounded in-memory ring buffer of real infrastructure events (max 50)
    this.maxEvents = 50;
    this.recentEvents = [];

    // Cached redis info parser
    this.lastRedisTelemetry = null;
    this.lastRedisTelemetryTime = 0;
  }

  /**
   * Register a BullMQ queue and optional worker
   * @param {string} name
   * @param {import('bullmq').Queue} queue
   * @param {import('bullmq').Worker} [worker]
   */
  registerQueue(name, queue, worker = null) {
    if (queue) {
      this.queues.set(name, queue);
    }
    if (worker) {
      this.workers.set(name, worker);
    }
    logger.debug(`Registered BullMQ queue: ${name} (worker: ${worker ? 'yes' : 'no'})`);
  }

  /**
   * Add a real event to the bounded live event stream
   * @param {Object} event
   */
  addEvent(event) {
    if (!event) return;

    const normalized = {
      id: event.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: event.timestamp || new Date().toISOString(),
      stage: event.stage || 'PROCESSING', // INGEST | REDIS | QUEUE | WORKER | PROCESSING | DATABASE | WEBSOCKET
      type: event.type || 'INFO',
      label: event.label || 'Infrastructure Operation',
      status: event.status || 'success', // success | active | warning | error
      details: event.details || null
    };

    this.recentEvents.unshift(normalized);
    if (this.recentEvents.length > this.maxEvents) {
      this.recentEvents = this.recentEvents.slice(0, this.maxEvents);
    }

    return normalized;
  }

  /**
   * Retrieve bounded recent events
   */
  getRecentEvents() {
    return [...this.recentEvents];
  }

  /**
   * Retrieve real BullMQ queue metrics across all registered queues
   */
  async getQueuesOverview() {
    const queueList = [];
    const isRedis = isRedisAvailable();

    for (const [name, queue] of this.queues.entries()) {
      let counts = { waiting: 0, active: 0, delayed: 0, failed: 0, completed: 0 };
      let isPaused = false;

      if (isRedis && queue && typeof queue.getJobCounts === 'function') {
        try {
          counts = await queue.getJobCounts('waiting', 'active', 'delayed', 'failed', 'completed');
          if (typeof queue.isPaused === 'function') {
            isPaused = await queue.isPaused();
          }
        } catch (err) {
          logger.debug(`Could not get job counts for queue ${name}: ${err.message}`);
        }
      }

      const worker = this.workers.get(name);
      const isWorkerRunning = worker && typeof worker.isRunning === 'function' ? worker.isRunning() : false;

      queueList.push({
        name,
        waiting: counts.waiting || 0,
        active: counts.active || 0,
        delayed: counts.delayed || 0,
        failed: counts.failed || 0,
        completed: counts.completed || 0,
        counts: {
          waiting: counts.waiting || 0,
          active: counts.active || 0,
          delayed: counts.delayed || 0,
          failed: counts.failed || 0,
          completed: counts.completed || 0,
          total: (counts.waiting || 0) + (counts.active || 0) + (counts.delayed || 0)
        },
        status: isPaused ? 'PAUSED' : (counts.active > 0 ? 'ACTIVE' : 'IDLE'),
        workerStatus: isWorkerRunning ? 'RUNNING' : (isRedis ? 'IDLE' : 'IN_MEMORY_FALLBACK')
      });
    }

    // Default known queues if not yet registered
    const knownQueues = ['website-health-check', 'api-health-check', 'metric-aggregation', 'anomaly-detection', 'cleanup-job'];
    for (const kq of knownQueues) {
      if (!queueList.some((q) => q.name === kq)) {
        queueList.push({
          name: kq,
          waiting: 0,
          active: 0,
          delayed: 0,
          failed: 0,
          completed: 0,
          counts: { waiting: 0, active: 0, delayed: 0, failed: 0, completed: 0, total: 0 },
          status: 'IDLE',
          workerStatus: isRedis ? 'IDLE' : 'IN_MEMORY_FALLBACK'
        });
      }
    }

    return queueList;
  }

  /**
   * Retrieve actual jobs for a specific queue (safe metadata only)
   * @param {string} queueName
   * @param {number} limit
   */
  async getQueueJobs(queueName, limit = 15) {
    const queue = this.queues.get(queueName);
    if (!queue || !isRedisAvailable() || typeof queue.getJobs !== 'function') {
      return [];
    }

    try {
      const types = ['active', 'waiting', 'delayed', 'failed', 'completed'];
      const rawJobs = await queue.getJobs(types, 0, limit - 1);

      return (rawJobs || []).map((j) => {
        // Sanitize data (strip secrets)
        const safeData = { ...(j.data || {}) };
        delete safeData.password;
        delete safeData.token;
        delete safeData.apiKey;
        delete safeData.secret;

        let status = 'waiting';
        if (j.failedReason) status = 'failed';
        else if (j.processedOn && !j.finishedOn) status = 'active';
        else if (j.finishedOn) status = 'completed';
        else if (j.delay && j.delay > 0) status = 'delayed';

        return {
          id: String(j.id),
          name: j.name,
          status,
          progress: j.progress || 0,
          timestamp: j.timestamp ? new Date(j.timestamp).toISOString() : null,
          processedOn: j.processedOn ? new Date(j.processedOn).toISOString() : null,
          finishedOn: j.finishedOn ? new Date(j.finishedOn).toISOString() : null,
          failedReason: j.failedReason || null,
          dataSummary: safeData
        };
      });
    } catch (err) {
      logger.debug(`Error getting jobs for queue ${queueName}: ${err.message}`);
      return [];
    }
  }

  /**
   * Parse Redis INFO command and retrieve authentic telemetry
   */
  async getRedisTelemetry() {
    const isRedis = isRedisAvailable();
    if (!isRedis || !redisClient) {
      return {
        status: 'IN_MEMORY_FALLBACK',
        connected: false,
        memoryUsedHuman: 'In-Memory Cache',
        memoryUsedBytes: 0,
        maxMemoryHuman: null,
        maxMemoryBytes: 0,
        memoryPct: null,
        connectedClients: 0,
        totalCommands: 0,
        opsPerSec: 0,
        uptimeSeconds: 0,
        uptimeHuman: '—',
        latencyMs: null,
        hitRatio: null,
        keyspaceHits: 0,
        keyspaceMisses: 0
      };
    }

    // Cache info for 2 seconds to avoid slamming Redis with INFO queries
    const now = Date.now();
    if (this.lastRedisTelemetry && now - this.lastRedisTelemetryTime < 2000) {
      return this.lastRedisTelemetry;
    }

    try {
      const pingStart = performance.now();
      await redisClient.ping();
      const latencyMs = Math.max(1, Math.round(performance.now() - pingStart));

      const rawInfo = await redisClient.info();
      const parsed = this.parseRedisInfo(rawInfo);

      const usedBytes = parseInt(parsed.used_memory || '0', 10);
      const maxBytes = parseInt(parsed.maxmemory || '0', 10);
      const usedMb = (usedBytes / (1024 * 1024)).toFixed(1);
      const maxMb = maxBytes > 0 ? (maxBytes / (1024 * 1024)).toFixed(1) : null;
      const memPct = maxBytes > 0 ? Math.round((usedBytes / maxBytes) * 100) : null;

      const hits = parseInt(parsed.keyspace_hits || '0', 10);
      const misses = parseInt(parsed.keyspace_misses || '0', 10);
      const hitRatio = hits + misses > 0 ? +((hits / (hits + misses)) * 100).toFixed(1) : null;

      const uptimeSec = parseInt(parsed.uptime_in_seconds || '0', 10);
      const uptimeHuman = uptimeSec > 3600
        ? `${(uptimeSec / 3600).toFixed(1)}h`
        : `${Math.floor(uptimeSec / 60)}m`;

      const telemetry = {
        status: 'CONNECTED',
        connected: true,
        memoryUsedHuman: `${usedMb} MB`,
        memoryUsedBytes: usedBytes,
        maxMemoryHuman: maxMb ? `${maxMb} MB` : null,
        maxMemoryBytes: maxBytes,
        memoryPct,
        connectedClients: parseInt(parsed.connected_clients || '1', 10),
        totalCommands: parseInt(parsed.total_commands_processed || '0', 10),
        opsPerSec: parseInt(parsed.instantaneous_ops_per_sec || '0', 10),
        uptimeSeconds: uptimeSec,
        uptimeHuman,
        latencyMs,
        hitRatio,
        keyspaceHits: hits,
        keyspaceMisses: misses
      };

      this.lastRedisTelemetry = telemetry;
      this.lastRedisTelemetryTime = now;
      return telemetry;
    } catch (err) {
      logger.debug(`Error getting Redis telemetry: ${err.message}`);
      return {
        status: 'ERROR',
        connected: false,
        memoryUsedHuman: '—',
        memoryUsedBytes: 0,
        maxMemoryHuman: null,
        maxMemoryBytes: 0,
        memoryPct: null,
        connectedClients: 0,
        totalCommands: 0,
        opsPerSec: 0,
        uptimeSeconds: 0,
        uptimeHuman: '—',
        latencyMs: null,
        hitRatio: null,
        keyspaceHits: 0,
        keyspaceMisses: 0
      };
    }
  }

  /**
   * Helper to parse INFO string
   */
  parseRedisInfo(infoStr = '') {
    const lines = infoStr.split('\r\n');
    const result = {};
    for (const line of lines) {
      if (!line || line.startsWith('#')) continue;
      const idx = line.indexOf(':');
      if (idx > -1) {
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        result[key] = val;
      }
    }
    return result;
  }

  /**
   * Overall infrastructure snapshot for initial Admin Page load
   */
  async getInfrastructureSnapshot() {
    const [queues, redis] = await Promise.all([
      this.getQueuesOverview(),
      this.getRedisTelemetry()
    ]);

    // Active/Idle worker summary
    const totalWorkers = queues.length;
    const activeWorkers = queues.filter((q) => q.counts.active > 0).length;
    const idleWorkers = totalWorkers - activeWorkers;

    // Node.js process load
    const mem = process.memoryUsage();
    const heapUsedMb = (mem.heapUsed / (1024 * 1024)).toFixed(1);
    const heapTotalMb = (mem.heapTotal / (1024 * 1024)).toFixed(1);
    const rssMb = (mem.rss / (1024 * 1024)).toFixed(1);

    // MongoDB connection state
    const mongoose = require('mongoose');
    const dbConnected = mongoose.connection.readyState === 1;

    let dbLatencyMs = null;
    if (dbConnected && mongoose.connection.db) {
      try {
        const start = performance.now();
        await mongoose.connection.db.admin().ping();
        dbLatencyMs = Math.max(1, Math.round(performance.now() - start));
      } catch (_) {}
    }

    return {
      timestamp: new Date().toISOString(),
      nodes: {
        ingest: {
          status: 'OPERATIONAL',
          label: 'API Gateway / Ingest',
          protocol: 'HTTP/1.1 & WebSocket',
          activeRequests: 0
        },
        redis: {
          status: redis.connected ? 'OPERATIONAL' : 'DEGRADED',
          label: 'Redis Cache & Event Broker',
          latency: redis.latencyMs !== null ? `${redis.latencyMs}ms` : '—',
          memoryUsed: redis.memoryUsedHuman,
          maxMemory: redis.maxMemoryHuman,
          memoryPct: redis.memoryPct,
          clients: redis.connectedClients,
          opsPerSec: redis.opsPerSec
        },
        queue: {
          status: queues.some((q) => q.counts.active > 0) ? 'ACTIVE' : 'IDLE',
          label: 'BullMQ Queues',
          waitingJobs: queues.reduce((sum, q) => sum + q.counts.waiting, 0),
          activeJobs: queues.reduce((sum, q) => sum + q.counts.active, 0),
          delayedJobs: queues.reduce((sum, q) => sum + q.counts.delayed, 0),
          failedJobs: queues.reduce((sum, q) => sum + q.counts.failed, 0),
          totalQueues: queues.length
        },
        workers: {
          status: activeWorkers > 0 ? 'PROCESSING' : 'IDLE',
          label: 'Node.js Worker Pool',
          active: activeWorkers,
          idle: idleWorkers,
          total: totalWorkers,
          heap: `${heapUsedMb} MB / ${heapTotalMb} MB`,
          rss: `${rssMb} MB`
        },
        processing: {
          status: 'OPERATIONAL',
          label: 'Anomaly & Health Engine',
          subsystems: ['Statistical Baseline (2.5σ)', 'Incident Correlator', 'Rollup Aggregator']
        },
        database: {
          status: dbConnected ? 'OPERATIONAL' : 'DOWN',
          label: 'MongoDB Replica / Store',
          latency: dbLatencyMs !== null ? `${dbLatencyMs}ms` : '—',
          readyState: mongoose.connection.readyState
        },
        websocket: {
          status: 'OPERATIONAL',
          label: 'Socket.IO Engine',
          adminRoom: 'admin:platform'
        }
      },
      queues,
      redis,
      workers: queues.map((q) => ({
        name: q.name,
        status: q.counts.active > 0 ? 'busy' : 'idle',
        workerStatus: q.workerStatus
      })),
      workerSummary: {
        activeCount: activeWorkers,
        idleCount: idleWorkers,
        totalCount: totalWorkers
      },
      recentEvents: this.getRecentEvents()
    };
  }
}

module.exports = new InfrastructureService();
