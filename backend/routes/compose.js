const express = require('express');
const router = express.Router();
const composeController = require('../controllers/composeController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, composeController.listStacks);
router.post('/', authenticateToken, composeController.deployStack);
router.delete('/:name', authenticateToken, composeController.removeStack);

module.exports = router;