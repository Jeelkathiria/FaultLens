const prisma = require('../config/database');
const { NotFoundError, UnauthorizedError } = require('../utils/errors');
const { emitDeploymentCreated } = require('../websocket/socket');
const logger = require('../utils/logger');

class DeploymentService {
  /**
   * Create a new deployment record
   * @param {Object} data
   * @param {string} [userId]
   * @param {boolean} [isAdmin]
   * @returns {Promise<Object>}
   */
  async createDeployment(data, userId = null, isAdmin = false) {
    const website = await prisma.website.findUnique({
      where: { id: data.websiteId }
    });

    if (!website || (!isAdmin && (!userId || website.userId !== userId))) {
      throw new NotFoundError('Website not found');
    }

    if (data.apiId) {
      const api = await prisma.api.findUnique({
        where: { id: data.apiId }
      });
      if (!api || api.websiteId !== website.id) {
        throw new NotFoundError('API not found');
      }
    }

    const deployment = await prisma.deployment.create({
      data: {
        websiteId: data.websiteId,
        apiId: data.apiId || null,
        version: data.version,
        commitHash: data.commitHash,
        branch: data.branch || 'main',
        environment: data.environment || 'PRODUCTION',
        deployedAt: data.deployedAt ? new Date(data.deployedAt) : new Date(),
        status: data.status || 'stable',
        message: data.message || null,
        author: data.author || null
      },
      include: {
        website: { select: { id: true, name: true } },
        api: { select: { id: true, name: true, endpoint: true } }
      }
    });

    emitDeploymentCreated(deployment);
    return deployment;
  }

  /**
   * List deployments with filtering options
   * @param {Object} filters
   * @param {string} [userId] - user isolation
   * @param {boolean} [isAdmin]
   * @returns {Promise<Object[]>}
   */
  async getDeployments(filters = {}, userId = null, isAdmin = false) {
    const where = {};

    if (!isAdmin) {
      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }
      where.website = { userId };
    }

    if (filters.websiteId) where.websiteId = filters.websiteId;
    if (filters.apiId) where.apiId = filters.apiId;
    if (filters.environment) where.environment = filters.environment;
    if (filters.status && filters.status !== 'ALL') where.status = filters.status;

    if (filters.startDate || filters.endDate) {
      where.deployedAt = {};
      if (filters.startDate) where.deployedAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.deployedAt.lte = new Date(filters.endDate);
    }

    try {
      const deployments = await prisma.deployment.findMany({
        where,
        orderBy: { deployedAt: 'desc' },
        include: {
          website: { select: { id: true, name: true } },
          api: { select: { id: true, name: true, endpoint: true } }
        }
      });

      if (!deployments || deployments.length === 0) {
        return [];
      }

      // Format for frontend
      return deployments.map((d) => ({
        id: d.id,
        version: d.version,
        service: d.api ? d.api.name : d.website?.name || 'Service',
        apiId: d.apiId,
        websiteId: d.websiteId,
        websiteName: d.website?.name,
        commit: d.commitHash.substring(0, 7),
        commitMessage: d.message || `Release ${d.version}`,
        branch: d.branch,
        author: d.author || 'Deploy Bot',
        authorAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(d.author || 'Deploy')}&background=4f46e5&color=fff`,
        deployedAt: d.deployedAt.toISOString(),
        deployedTimestamp: d.deployedAt.toISOString(),
        status: d.status,
        statusLabel: d.status === 'incident' ? 'Incident Detected' : d.status === 'rolled-back' ? 'Rolled Back' : 'Stable',
        environment: d.environment
      }));
    } catch (err) {
      logger.error(`Database query failed in getDeployments: ${err.message}`);
      return [];
    }
  }

  /**
   * Get deployment by ID
   * @param {string} id
   * @param {string} [userId]
   * @param {boolean} [isAdmin]
   * @returns {Promise<Object>}
   */
  async getDeploymentById(id, userId = null, isAdmin = false) {
    const deployment = await prisma.deployment.findUnique({
      where: { id },
      include: {
        website: true,
        api: true
      }
    });

    if (!deployment) {
      throw new NotFoundError('Deployment not found');
    }

    if (!isAdmin) {
      if (!userId) {
        throw new UnauthorizedError('User authentication required');
      }
      if (deployment.website?.userId !== userId) {
        throw new NotFoundError('Deployment not found');
      }
    }

    return deployment;
  }
}

module.exports = new DeploymentService();
