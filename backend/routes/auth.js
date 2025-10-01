const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {authenticateToken} = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/logout', authController.logout)
router.post('/verify_token', authenticateToken, authController.verify_token);

module.exports = router;