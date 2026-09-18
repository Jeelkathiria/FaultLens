const deploymentService = require('../services/deployment.service');

class DeploymentController {
  /**
   * Record a new deployment
   */
  async createDeployment(req, res, next) {
    try {
      const deployment = await deploymentService.createDeployment(
        req.body,
        req.user?.id,
        req.user?.role === 'ADMIN'
      );

      res.status(201).json({
        success: true,
        data: deployment
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List deployments with optional filters
   */
  async getDeployments(req, res, next) {
    try {
      const filters = {
        websiteId: req.query.websiteId,
        apiId: req.query.apiId,
        environment: req.query.environment,
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const deployments = await deploymentService.getDeployments(
        filters,
        req.user?.id,
        req.user?.role === 'ADMIN'
      );

      res.json({
        success: true,
        data: deployments
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get deployment by ID
   */
  async getDeploymentById(req, res, next) {
    try {
      const { id } = req.params;
      const deployment = await deploymentService.getDeploymentById(
        id,
        req.user?.id,
        req.user?.role === 'ADMIN'
      );

      res.json({
        success: true,
        data: deployment
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DeploymentController();
