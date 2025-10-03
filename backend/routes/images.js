const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, imageController.getImages);

module.exports = router;