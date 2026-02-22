const express = require('express');
const router = express.Router();
const brandingController = require('../controllers/brandingController');
const { auth, optionalAuth } = require('../middleware/auth');
const { requireOwner } = require('../middleware/roleCheck');
const { validate } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// Get branding (public, but can use auth for admin features)
router.get(
  '/',
  optionalAuth,
  asyncHandler(brandingController.get)
);

// Update branding (owner only)
router.put(
  '/',
  auth,
  requireOwner,
  validate('updateBranding'),
  asyncHandler(brandingController.update)
);

module.exports = router;
