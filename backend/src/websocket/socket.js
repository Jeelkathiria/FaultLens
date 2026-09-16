const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const logger = require('../utils/logger');
const prisma = require('../config/database');

let io = null;

/**
 * Initialize Socket.IO server with HTTP server instance
 * @param {import('http').Server} httpServer
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [env.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;

      if (!token) {
        // Allow unauthenticated guest connections for public demo, but restrict rooms
        socket.user = null;
        return next();
      }

      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, email: true, role: true }
      });

      if (user) {
        socket.user = user;
      }
      next();
    } catch (err) {
      logger.debug(`Socket auth failed: ${err.message} - continuing as guest`);
      socket.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    const userDisplay = socket.user ? `${socket.user.name} (${socket.user.id})` : 'Guest/Demo Client';
    logger.info(`WebSocket Client Connected: ${socket.id} - ${userDisplay}`);

    // Auto-join user room if authenticated
    if (socket.user) {
      socket.join(`user:${socket.user.id}`);
      if (socket.user.role === 'ADMIN') {
        socket.join('admin:platform');
      }
    }

    // Room subscription: website
    socket.on('subscribe:website', async (websiteId) => {
      // Validate that user owns website or is admin, or demo guest
      socket.join(`website:${websiteId}`);
      logger.debug(`Socket ${socket.id} joined website:${websiteId}`);
    });

    // Room subscription: api
    socket.on('subscribe:api', (apiId) => {
      socket.join(`api:${apiId}`);
      logger.debug(`Socket ${socket.id} joined api:${apiId}`);
    });

    // Room leave: website
    socket.on('unsubscribe:website', (websiteId) => {
      socket.leave(`website:${websiteId}`);
    });

    // Room leave: api
    socket.on('unsubscribe:api', (apiId) => {
      socket.leave(`api:${apiId}`);
    });

    socket.on('disconnect', (reason) => {
      logger.info(`WebSocket Client Disconnected: ${socket.id} - ${reason}`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

/**
 * Emit real-time events to appropriate rooms
 */
function emitMetricUpdated(apiId, websiteId, data) {
  if (!io) return;
  io.to(`api:${apiId}`).to(`website:${websiteId}`).emit('METRIC_UPDATED', { apiId, websiteId, ...data });
  io.to('admin:platform').emit('METRIC_UPDATED', { apiId, websiteId, ...data });
}

function emitAnomalyDetected(apiId, websiteId, anomaly) {
  if (!io) return;
  io.to(`api:${apiId}`).to(`website:${websiteId}`).emit('ANOMALY_DETECTED', anomaly);
  io.to('admin:platform').emit('ANOMALY_DETECTED', anomaly);
}

function emitIncidentCreated(incident) {
  if (!io) return;
  io.to(`api:${incident.apiId}`).emit('INCIDENT_CREATED', incident);
  if (incident.api?.websiteId) {
    io.to(`website:${incident.api.websiteId}`).emit('INCIDENT_CREATED', incident);
  }
  io.emit('INCIDENT_CREATED', incident); // Broadcast to active dashboards
}

function emitIncidentUpdated(incident) {
  if (!io) return;
  io.to(`api:${incident.apiId}`).emit('INCIDENT_UPDATED', incident);
  if (incident.api?.websiteId) {
    io.to(`website:${incident.api.websiteId}`).emit('INCIDENT_UPDATED', incident);
  }
  io.emit('INCIDENT_UPDATED', incident);
}

function emitIncidentResolved(incident) {
  if (!io) return;
  io.to(`api:${incident.apiId}`).emit('INCIDENT_RESOLVED', incident);
  if (incident.api?.websiteId) {
    io.to(`website:${incident.api.websiteId}`).emit('INCIDENT_RESOLVED', incident);
  }
  io.emit('INCIDENT_RESOLVED', incident);
}

function emitDeploymentCreated(deployment) {
  if (!io) return;
  if (deployment.websiteId) {
    io.to(`website:${deployment.websiteId}`).emit('DEPLOYMENT_CREATED', deployment);
  }
  if (deployment.apiId) {
    io.to(`api:${deployment.apiId}`).emit('DEPLOYMENT_CREATED', deployment);
  }
  io.emit('DEPLOYMENT_CREATED', deployment);
}

module.exports = {
  initSocket,
  getIO,
  emitMetricUpdated,
  emitAnomalyDetected,
  emitIncidentCreated,
  emitIncidentUpdated,
  emitIncidentResolved,
  emitDeploymentCreated
};
