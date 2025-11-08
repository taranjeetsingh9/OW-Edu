const router = require('express').Router();
const AuthController = require('../controllers/auth.controller');

// Request OTP
router.post('/send-otp', AuthController.sendOTP);

// Verify OTP → login
router.post('/verify-otp', AuthController.verifyOTP);

// Refresh token (optional)
router.post('/refresh', AuthController.refreshToken);

module.exports = router;
