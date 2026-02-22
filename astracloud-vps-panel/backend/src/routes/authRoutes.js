const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const rateLimit = require('express-rate-limit');

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  message: {
    error: 'Too many attempts',
    message: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Register
router.post(
  '/register',
  authLimiter,
  validate('register'),
  asyncHandler(authController.register)
);

// Login
router.post(
  '/login',
  authLimiter,
  validate('login'),
  asyncHandler(authController.login)
);

// Logout
router.post(
  '/logout',
  auth,
  asyncHandler(authController.logout)
);

// Get current user
router.get(
  '/me',
  auth,
  asyncHandler(authController.me)
);

// Refresh token
router.post(
  '/refresh',
  auth,
  asyncHandler(authController.refresh)
);

module.exports = router;
