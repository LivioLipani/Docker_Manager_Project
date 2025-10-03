const express = require('express');
const router = express.Router();
const containerController = require('../controllers/containerController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, containerController.getContainers);

module.exports = router;