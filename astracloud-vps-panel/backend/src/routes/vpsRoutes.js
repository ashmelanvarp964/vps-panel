const express = require('express');
const router = express.Router();
const vpsController = require('../controllers/vpsController');
const { auth } = require('../middleware/auth');
const { requireOwner, requireVPSAccess } = require('../middleware/roleCheck');
const { validate } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// All routes require authentication
router.use(auth);

// Get all VPS (filtered by role)
router.get(
  '/',
  asyncHandler(vpsController.getAll)
);

// Get single VPS
router.get(
  '/:id',
  validate('idParam', 'params'),
  requireVPSAccess,
  asyncHandler(vpsController.getById)
);

// Create VPS (owner only)
router.post(
  '/',
  requireOwner,
  validate('createVPS'),
  asyncHandler(vpsController.create)
);

// Start VPS
router.post(
  '/:id/start',
  validate('idParam', 'params'),
  requireVPSAccess,
  asyncHandler(vpsController.start)
);

// Stop VPS
router.post(
  '/:id/stop',
  validate('idParam', 'params'),
  requireVPSAccess,
  asyncHandler(vpsController.stop)
);

// Reboot VPS
router.post(
  '/:id/reboot',
  validate('idParam', 'params'),
  requireVPSAccess,
  asyncHandler(vpsController.reboot)
);

// Suspend VPS (owner only)
router.post(
  '/:id/suspend',
  validate('idParam', 'params'),
  requireOwner,
  asyncHandler(vpsController.suspend)
);

// Unsuspend VPS (owner only)
router.post(
  '/:id/unsuspend',
  validate('idParam', 'params'),
  requireOwner,
  asyncHandler(vpsController.unsuspend)
);

// Assign VPS to user (owner only)
router.put(
  '/:id/assign',
  validate('idParam', 'params'),
  requireOwner,
  validate('assignVPS'),
  asyncHandler(vpsController.assign)
);

// Set expiry date (owner only)
router.put(
  '/:id/expiry',
  validate('idParam', 'params'),
  requireOwner,
  validate('setExpiry'),
  asyncHandler(vpsController.setExpiry)
);

// Set override suspension (owner only)
router.put(
  '/:id/override',
  validate('idParam', 'params'),
  requireOwner,
  validate('setOverride'),
  asyncHandler(vpsController.setOverride)
);

// Delete VPS (owner only)
router.delete(
  '/:id',
  validate('idParam', 'params'),
  requireOwner,
  asyncHandler(vpsController.delete)
);

module.exports = router;
