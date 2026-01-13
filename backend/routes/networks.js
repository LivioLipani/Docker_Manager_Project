const express = require('express');
const router = express.Router();
const networkController = require('../controllers/networkController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, networkController.getNetworks);
router.post('/', authenticateToken, networkController.createNetwork);
router.delete('/:id', authenticateToken, networkController.deleteNetwork);

module.exports = router;