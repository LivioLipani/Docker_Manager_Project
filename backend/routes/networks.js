const express = require('express');
const router = express.Router();
const networkController = require('../controllers/networkController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, networkController.getNetworks);

module.exports = router;