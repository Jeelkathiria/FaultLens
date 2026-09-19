const incidentService = require('../services/incident.service');
const { UnauthorizedError } = require('../utils/errors');

class IncidentController {
  /**
   * List incidents with filters
   */
  async getIncidents(req, res, next) {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User authentication required');
      }

      const filters = {
        severity: req.query.severity,
        status: req.query.status,
        websiteId: req.query.websiteId,
        apiId: req.query.apiId,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const incidents = await incidentService.getIncidents(
        filters,
        req.user.id,
        req.user.role === 'ADMIN'
      );

      res.json({
        success: true,
        data: incidents
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single incident by ID with full timeline and deployment correlation
   */
  async getIncidentById(req, res, next) {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User authentication required');
      }

      const { id } = req.params;
      const incident = await incidentService.getIncidentById(
        id,
        req.user.id,
        req.user.role === 'ADMIN'
      );

      res.json({
        success: true,
        data: incident
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update incident status (DETECTED -> INVESTIGATING -> MITIGATED -> RESOLVED)
   */
  async updateStatus(req, res, next) {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User authentication required');
      }

      const { id } = req.params;
      const { status } = req.body;

      const updated = await incidentService.updateStatus(id, status, req.user);

      res.json({
        success: true,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Shortcut action: Acknowledge incident (moves to INVESTIGATING)
   */
  async acknowledgeIncident(req, res, next) {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User authentication required');
      }

      const { id } = req.params;
      const updated = await incidentService.updateStatus(id, 'INVESTIGATING', req.user);

      res.json({
        success: true,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Shortcut action: Resolve incident (moves to RESOLVED)
   */
  async resolveIncident(req, res, next) {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User authentication required');
      }

      const { id } = req.params;
      const updated = await incidentService.updateStatus(id, 'RESOLVED', req.user);

      res.json({
        success: true,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Simulate / Trigger a test incident for testing observability
   * POST /api/v1/incidents/simulate
   */
  async simulateIncident(req, res, next) {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User authentication required');
      }

      const { apiId, title, description, severity } = req.body;
      if (!apiId) {
        return res.status(400).json({ success: false, message: 'apiId is required' });
      }

      const incident = await incidentService.simulateIncident(
        apiId,
        { title, description, severity },
        req.user
      );

      res.status(201).json({
        success: true,
        data: incident
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new IncidentController();
