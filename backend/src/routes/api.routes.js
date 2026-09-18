const express = require('express');
const { body } = require('express-validator');
const apiController = require('../controllers/api.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router({ mergeParams: true });

router.use(authenticate);

// Nested routes under /api/v1/websites/:websiteId/apis
router.post(
  '/',
  validate([
    body('name').trim().notEmpty().withMessage('API name is required'),
    body('endpoint').trim().notEmpty().withMessage('API endpoint path is required'),
    body('method').optional().isIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'])
  ]),
  apiController.createApi
);

router.get('/', apiController.getApisByWebsite);

// Direct routes by API ID (/api/v1/apis/:id)
router.get('/:id', apiController.getApiById);
router.patch('/:id', apiController.updateApi);
router.delete('/:id', apiController.deleteApi);
router.post('/:id/check', apiController.checkApiHealthNow);

module.exports = router;
