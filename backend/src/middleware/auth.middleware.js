const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/database');
const env = require('../config/env');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

/**
 * Hash API Key securely with SHA-256
 * @param {string} rawKey
 * @returns {string}
 */
function hashApiKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Primary authentication middleware supporting JWT Bearer tokens
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header with Bearer token');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new UnauthorizedError('User account not found or deactivated');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware for Telemetry ingestion: Authenticates exclusively with an API Key
 */
async function authenticateApiKey(req, res, next) {
  try {
    const rawKey = req.headers['x-api-key'] || (req.headers.authorization?.startsWith('ApiKey ') ? req.headers.authorization.split(' ')[1] : null);

    if (!rawKey) {
      throw new UnauthorizedError('Missing required X-API-Key header');
    }

    const keyHash = hashApiKey(rawKey);
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!apiKey) {
      throw new UnauthorizedError('Invalid API key provided');
    }

    if (apiKey.revokedAt) {
      throw new ForbiddenError('This API key has been revoked');
    }

    // Asynchronously update lastUsedAt without blocking
    prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() }
    }).catch(() => {});

    req.apiKey = apiKey;
    req.user = apiKey.user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authentication: attaches user if token is present, but doesn't fail if absent
 */
async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, email: true, role: true }
      });
      if (user) req.user = user;
    }
  } catch (_) {
    // Ignore invalid optional tokens
  }
  next();
}

module.exports = {
  authenticate,
  authenticateApiKey,
  optionalAuthenticate,
  hashApiKey
};
