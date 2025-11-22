const express = require('express');
const router = express.Router();
const { login, getMe, logout } = require('../controllers/adminAuthController');
const { authenticate } = require('../middleware/adminAuth');

// Public routes
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/me', authenticate, getMe);

module.exports = router;

