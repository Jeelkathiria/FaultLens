const express = require('express');
const { body } = require('express-validator');
const incidentController = require('../controllers/incident.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', incidentController.getIncidents);
router.get('/:id', incidentController.getIncidentById);

// Status modification requires auth
router.patch(
  '/:id/status',
  validate([
    body('status').trim().notEmpty().withMessage('Status is required')
  ]),
  incidentController.updateStatus
);

router.post('/:id/acknowledge', incidentController.acknowledgeIncident);
router.post('/:id/resolve', incidentController.resolveIncident);
router.post('/simulate', incidentController.simulateIncident);

module.exports = router;
