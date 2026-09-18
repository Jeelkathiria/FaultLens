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
      logger.debug(`Socket auth failed: ${err.message} - continuing as unauthenticated`);
      socket.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    const userDisplay = socket.user ? `${socket.user.name} (${socket.user.id})` : 'Unauthenticated Client';
    logger.info(`WebSocket Client Connected: ${socket.id} - ${userDisplay}`);

    // Auto-join user room if authenticated
    if (socket.user) {
      socket.join(`user:${socket.user.id}`);
      if (socket.user.role === 'ADMIN') {
        socket.join('admin:platform');
      }
    }

    // Room subscription: website (enforces tenant ownership)
    socket.on('subscribe:website', async (websiteId) => {
      try {
        if (!websiteId) return;

        if (socket.user && socket.user.role !== 'ADMIN') {
          const website = await prisma.website.findUnique({
            where: { id: websiteId },
            select: { userId: true }
          });
          if (!website || website.userId !== socket.user.id) {
            logger.warn(`Unauthorized website subscription attempt: ${socket.user.id} -> ${websiteId}`);
            return;
          }
        }

        socket.join(`website:${websiteId}`);
        logger.debug(`Socket ${socket.id} joined website:${websiteId}`);
      } catch (err) {
        logger.error(`Error subscribing to website ${websiteId}: ${err.message}`);
      }
    });

    // Room subscription: api (enforces tenant ownership)
    socket.on('subscribe:api', async (apiId) => {
      try {
        if (!apiId) return;

        if (socket.user && socket.user.role !== 'ADMIN') {
          const api = await prisma.api.findUnique({
            where: { id: apiId },
            select: { website: { select: { userId: true } } }
          });
          if (!api || api.website?.userId !== socket.user.id) {
            logger.warn(`Unauthorized api subscription attempt: ${socket.user.id} -> ${apiId}`);
            return;
          }
        }

        socket.join(`api:${apiId}`);
        logger.debug(`Socket ${socket.id} joined api:${apiId}`);
      } catch (err) {
        logger.error(`Error subscribing to api ${apiId}: ${err.message}`);
      }
    });

    // Room leave: website
    socket.on('unsubscribe:website', (websiteId) => {
      if (websiteId) socket.leave(`website:${websiteId}`);
    });

    // Room leave: api
    socket.on('unsubscribe:api', (apiId) => {
      if (apiId) socket.leave(`api:${apiId}`);
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
  const ownerUserId = incident.api?.website?.userId;
  if (ownerUserId) {
    io.to(`user:${ownerUserId}`).emit('INCIDENT_CREATED', incident);
  }
  io.to('admin:platform').emit('INCIDENT_CREATED', incident);
}

function emitIncidentUpdated(incident) {
  if (!io) return;
  io.to(`api:${incident.apiId}`).emit('INCIDENT_UPDATED', incident);
  if (incident.api?.websiteId) {
    io.to(`website:${incident.api.websiteId}`).emit('INCIDENT_UPDATED', incident);
  }
  const ownerUserId = incident.api?.website?.userId;
  if (ownerUserId) {
    io.to(`user:${ownerUserId}`).emit('INCIDENT_UPDATED', incident);
  }
  io.to('admin:platform').emit('INCIDENT_UPDATED', incident);
}

function emitIncidentResolved(incident) {
  if (!io) return;
  io.to(`api:${incident.apiId}`).emit('INCIDENT_RESOLVED', incident);
  if (incident.api?.websiteId) {
    io.to(`website:${incident.api.websiteId}`).emit('INCIDENT_RESOLVED', incident);
  }
  const ownerUserId = incident.api?.website?.userId;
  if (ownerUserId) {
    io.to(`user:${ownerUserId}`).emit('INCIDENT_RESOLVED', incident);
  }
  io.to('admin:platform').emit('INCIDENT_RESOLVED', incident);
}

function emitDeploymentCreated(deployment) {
  if (!io) return;
  if (deployment.websiteId) {
    io.to(`website:${deployment.websiteId}`).emit('DEPLOYMENT_CREATED', deployment);
  }
  if (deployment.apiId) {
    io.to(`api:${deployment.apiId}`).emit('DEPLOYMENT_CREATED', deployment);
  }
  const ownerUserId = deployment.website?.userId;
  if (ownerUserId) {
    io.to(`user:${ownerUserId}`).emit('DEPLOYMENT_CREATED', deployment);
  }
  io.to('admin:platform').emit('DEPLOYMENT_CREATED', deployment);
}

function emitApiHealthUpdated(api, healthData) {
  if (!io) return;
  const websiteId = api.websiteId || api.website?.id;
  const ownerUserId = api.website?.userId;

  const payload = {
    apiId: api.id,
    websiteId,
    status: healthData.status,
    statusCode: healthData.statusCode,
    responseTime: healthData.responseTime,
    checkedAt: healthData.checkedAt,
    success: healthData.success,
    error: healthData.error
  };

  io.to(`api:${api.id}`).emit('API_HEALTH_UPDATED', payload);
  if (websiteId) {
    io.to(`website:${websiteId}`).emit('API_HEALTH_UPDATED', payload);
  }
  if (ownerUserId) {
    io.to(`user:${ownerUserId}`).emit('API_HEALTH_UPDATED', payload);
  }
  io.to('admin:platform').emit('API_HEALTH_UPDATED', payload);
}

module.exports = {
  initSocket,
  getIO,
  emitMetricUpdated,
  emitAnomalyDetected,
  emitIncidentCreated,
  emitIncidentUpdated,
  emitIncidentResolved,
  emitDeploymentCreated,
  emitApiHealthUpdated
};
