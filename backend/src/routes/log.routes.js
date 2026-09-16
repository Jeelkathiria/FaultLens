const express = require('express');
const logController = require('../controllers/log.controller');
const { optionalAuthenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', optionalAuthenticate, logController.getLogs);
router.get('/:id', optionalAuthenticate, logController.getLogById);

module.exports = router;
