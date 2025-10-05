const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, imageController.getImages);
router.delete('/:id', authenticateToken,  imageController.removeImage);
router.post('/pull', authenticateToken,  imageController.pullImage);

module.exports = router;