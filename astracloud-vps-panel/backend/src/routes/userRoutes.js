const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth } = require('../middleware/auth');
const { requireOwner } = require('../middleware/roleCheck');
const { validate } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// All routes require authentication and owner role
router.use(auth);
router.use(requireOwner);

// Get all users
router.get(
  '/',
  asyncHandler(userController.getAll)
);

// Get user by ID
router.get(
  '/:id',
  validate('idParam', 'params'),
  asyncHandler(userController.getById)
);

// Get VPS assigned to user
router.get(
  '/:id/vps',
  validate('idParam', 'params'),
  asyncHandler(userController.getUserVPS)
);

// Delete user
router.delete(
  '/:id',
  validate('idParam', 'params'),
  asyncHandler(userController.delete)
);

module.exports = router;
