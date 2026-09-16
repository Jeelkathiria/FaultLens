const express = require('express');
const { body } = require('express-validator');
const websiteController = require('../controllers/website.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  validate([
    body('name').trim().notEmpty().withMessage('Website name is required'),
    body('url').trim().notEmpty().withMessage('Website URL is required')
  ]),
  websiteController.createWebsite
);

router.get('/', websiteController.getWebsites);

router.get('/:id', websiteController.getWebsiteById);

router.patch('/:id', websiteController.updateWebsite);

router.delete('/:id', websiteController.deleteWebsite);

module.exports = router;
