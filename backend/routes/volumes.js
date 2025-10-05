const express = require('express');
const router = express.Router();
const volumeController = require('../controllers/volumeController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, volumeController.getVolumes);
router.delete('/:name', authenticateToken,  volumeController.removeVolume);
router.post('/', authenticateToken,  volumeController.createVolume);

module.exports = router;