const express = require('express');
const { body } = require('express-validator');
const apiKeyController = require('../controllers/apiKey.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  validate([
    body('name').trim().notEmpty().withMessage('Key name is required')
  ]),
  apiKeyController.createApiKey
);

router.get('/', apiKeyController.getApiKeys);

router.delete('/:id', apiKeyController.deleteApiKey);

module.exports = router;
