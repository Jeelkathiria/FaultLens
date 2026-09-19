const express = require('express');
const { body } = require('express-validator');
const deploymentController = require('../controllers/deployment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', deploymentController.getDeployments);
router.get('/:id', deploymentController.getDeploymentById);

router.post(
  '/',
  validate([
    body('websiteId').trim().notEmpty().withMessage('websiteId is required'),
    body('version').trim().notEmpty().withMessage('version is required'),
    body('commitHash').trim().notEmpty().withMessage('commitHash is required')
  ]),
  deploymentController.createDeployment
);

module.exports = router;
