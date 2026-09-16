const express = require('express');
const { body } = require('express-validator');
const incidentController = require('../controllers/incident.controller');
const { authenticate, optionalAuthenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();

router.get('/', optionalAuthenticate, incidentController.getIncidents);
router.get('/:id', optionalAuthenticate, incidentController.getIncidentById);

// Status modification requires auth
router.patch(
  '/:id/status',
  authenticate,
  validate([
    body('status').trim().notEmpty().withMessage('Status is required')
  ]),
  incidentController.updateStatus
);

router.post('/:id/acknowledge', authenticate, incidentController.acknowledgeIncident);
router.post('/:id/resolve', authenticate, incidentController.resolveIncident);

module.exports = router;
