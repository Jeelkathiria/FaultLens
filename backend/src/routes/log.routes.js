const express = require('express');
const logController = require('../controllers/log.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', logController.getLogs);
router.get('/:id', logController.getLogById);

module.exports = router;
