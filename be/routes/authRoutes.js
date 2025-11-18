const express = require('express');
const router = express.Router();
const { login, getMe, logout } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validation');

router.post('/login', validateLogin, login);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

module.exports = router;
