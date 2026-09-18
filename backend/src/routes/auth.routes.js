const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ]),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validate([
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ]),
  authController.login
);

router.post(
  '/google',
  authLimiter,
  validate([
    body('email').trim().isEmail().withMessage('Valid email is required')
  ]),
  authController.googleAuth
);

router.post('/logout', authenticate, authController.logout);

router.get('/me', authenticate, authController.getMe);

module.exports = router;
