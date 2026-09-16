const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticate);
router.use(requireRole(['ADMIN']));

router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.toggleUserStatus);
router.get('/websites', adminController.getWebsites);
router.get('/incidents', adminController.getIncidents);
router.get('/system-health', adminController.getSystemHealth);

module.exports = router;
