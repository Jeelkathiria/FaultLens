const prisma = require('../config/database');
const env = require('../config/env');
const logger = require('../utils/logger');

class CorrelationService {
  /**
   * Correlate an incident/anomaly with recent deployments
   * @param {string} apiId
   * @param {Date} anomalyTimestamp
   * @param {number} windowMinutes - default from env (e.g. 60 minutes)
   * @returns {Promise<Object|null>}
   */
  async correlateIncidentWithDeployment(apiId, anomalyTimestamp = new Date(), windowMinutes = env.CORRELATION_WINDOW_MINUTES) {
    try {
      const anomalyTime = new Date(anomalyTimestamp).getTime();
      const windowStart = new Date(anomalyTime - windowMinutes * 60 * 1000);

      // 1. Get the API to know its websiteId
      const api = await prisma.api.findUnique({
        where: { id: apiId },
        select: { id: true, name: true, websiteId: true }
      });

      if (!api) return null;

      // 2. Look for deployments targeted to this API or its parent Website within window before anomaly
      const deployments = await prisma.deployment.findMany({
        where: {
          OR: [
            { apiId: api.id },
            { websiteId: api.websiteId, apiId: null }
          ],
          deployedAt: {
            gte: windowStart,
            lte: new Date(anomalyTime + 2 * 60 * 1000) // slight buffer for clock drift
          }
        },
        orderBy: { deployedAt: 'desc' },
        take: 3
      });

      if (deployments.length === 0) {
        return null;
      }

      // Most recent deployment before the anomaly
      const deployment = deployments[0];
      const deployTime = new Date(deployment.deployedAt).getTime();
      const diffMs = Math.max(0, anomalyTime - deployTime);
      const diffMinutes = Math.round(diffMs / (60 * 1000));

      // Calculate confidence score (higher if closer to anomaly timestamp)
      // 0 - 15 mins: 0.85 - 0.95
      // 15 - 30 mins: 0.70 - 0.85
      // 30 - 60 mins: 0.50 - 0.70
      let confidence = 0.5;
      if (diffMinutes <= 10) {
        confidence = 0.92;
      } else if (diffMinutes <= 20) {
        confidence = 0.82;
      } else if (diffMinutes <= 40) {
        confidence = 0.68;
      } else {
        confidence = 0.52;
      }

      // Mark deployment status as having an incident detected
      await prisma.deployment.update({
        where: { id: deployment.id },
        data: { status: 'incident' }
      }).catch((e) => logger.warn(`Could not update deployment status: ${e.message}`));

      const formatTime = (date) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      };

      return {
        correlated: true,
        deploymentId: deployment.id,
        confidence,
        reason: `Potential deployment correlation: Incident detected ${diffMinutes} minutes after deployment`,
        // Object format matching frontend DeploymentCorrelationCard:
        version: deployment.version,
        service: api.name,
        deployedAt: formatTime(deployment.deployedAt),
        detectedAt: formatTime(anomalyTimestamp),
        timeDifference: `${diffMinutes} minutes`,
        commit: deployment.commitHash.substring(0, 7),
        author: deployment.author || 'Unknown',
        message: deployment.message || `Release ${deployment.version}`,
        description: `Potential deployment correlation: Error rate and latency shifted significantly ${diffMinutes} minutes post-deploy of ${deployment.version}.`
      };
    } catch (err) {
      logger.error('Deployment correlation error:', err);
      return null;
    }
  }
}

module.exports = new CorrelationService();
