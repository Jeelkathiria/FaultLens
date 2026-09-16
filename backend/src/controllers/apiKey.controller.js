const crypto = require('crypto');
const prisma = require('../config/database');
const { hashApiKey } = require('../middleware/auth.middleware');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

class ApiKeyController {
  /**
   * Create and issue a new API key
   */
  async createApiKey(req, res, next) {
    try {
      const { name } = req.body;
      const rawToken = crypto.randomBytes(24).toString('hex');
      const rawKey = `fl_live_${rawToken}`;
      const keyHash = hashApiKey(rawKey);
      const keyPrefix = `${rawKey.substring(0, 12)}...`;

      const apiKey = await prisma.apiKey.create({
        data: {
          userId: req.user.id,
          name: name || 'Default Telemetry Key',
          keyHash,
          keyPrefix
        }
      });

      res.status(201).json({
        success: true,
        data: {
          id: apiKey.id,
          name: apiKey.name,
          rawKey, // RAW KEY RETURNED ONLY ONCE UPON CREATION
          keyPrefix: apiKey.keyPrefix,
          createdAt: apiKey.createdAt
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List API keys belonging to the authenticated user
   */
  async getApiKeys(req, res, next) {
    try {
      const keys = await prisma.apiKey.findMany({
        where: { userId: req.user.id, revokedAt: null },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          lastUsedAt: true,
          createdAt: true
        }
      });

      // Format for settings page
      const formatted = keys.map((k) => ({
        id: k.id,
        name: k.name,
        key: k.keyPrefix,
        lastUsed: k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : 'Never',
        created: new Date(k.createdAt).toLocaleDateString()
      }));

      res.json({
        success: true,
        data: formatted
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Revoke/delete an API key
   */
  async deleteApiKey(req, res, next) {
    try {
      const { id } = req.params;

      const apiKey = await prisma.apiKey.findUnique({
        where: { id }
      });

      if (!apiKey) {
        throw new NotFoundError('API key not found');
      }

      if (apiKey.userId !== req.user.id && req.user.role !== 'ADMIN') {
        throw new ForbiddenError('You cannot revoke another user\'s API key');
      }

      await prisma.apiKey.update({
        where: { id },
        data: { revokedAt: new Date() }
      });

      res.json({
        success: true,
        data: {
          message: 'API key revoked successfully'
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ApiKeyController();
