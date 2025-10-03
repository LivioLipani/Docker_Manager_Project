const express = require('express');
const router = express.Router();
const volumeController = require('../controllers/volumeController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, volumeController.getVolumes);

module.exports = router;