const express = require('express');
const router = express.Router();
const containerController = require('../controllers/containerController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, containerController.getContainers);
router.post('/', authenticateToken, containerController.createContainer);
router.post('/:id/start', authenticateToken, containerController.startContainer);
router.post('/:id/stop', authenticateToken, containerController.stopContainer);
router.post('/:id/restart', authenticateToken, containerController.restartContainer);
router.delete('/:id', authenticateToken, containerController.removeContainer);


module.exports = router;