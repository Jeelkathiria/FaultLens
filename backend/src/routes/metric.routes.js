const express = require('express');
const { body } = require('express-validator');
const metricController = require('../controllers/metric.controller');
const { authenticate, authenticateApiKey } = require('../middleware/auth.middleware');
const { telemetryLimiter } = require('../middleware/rateLimit.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();

// Authenticated dashboard endpoints
router.get('/dashboard/summary', authenticate, metricController.getDashboardSummary);
router.get('/dashboard/metrics', authenticate, metricController.getDashboardMetrics);
router.get('/dashboard/health', metricController.getHealth);

// API specific metrics
router.get('/metrics/:apiId', authenticate, metricController.getApiMetrics);

// Telemetry Ingestion (Authenticated with API Key)
router.post(
  '/telemetry',
  telemetryLimiter,
  authenticateApiKey,
  validate([
    body('apiId').trim().notEmpty().withMessage('apiId is required'),
    body('statusCode').isInt({ min: 100, max: 599 }).withMessage('Valid HTTP statusCode is required'),
    body('responseTime').isNumeric().withMessage('responseTime (ms) is required'),
    body('endpoint').trim().notEmpty().withMessage('endpoint path is required')
  ]),
  metricController.ingestTelemetry
);

module.exports = router;
