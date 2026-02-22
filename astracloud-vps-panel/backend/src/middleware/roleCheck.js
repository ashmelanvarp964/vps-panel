// Role check middleware - requires auth middleware to run first

const requireOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'You must be logged in to access this resource'
    });
  }

  if (req.user.role !== 'owner') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'This action requires owner privileges'
    });
  }

  next();
};

const requireUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'You must be logged in to access this resource'
    });
  }

  // Both owner and user roles can pass
  if (req.user.role !== 'owner' && req.user.role !== 'user') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Invalid user role'
    });
  }

  next();
};

// Check if user has access to a specific VPS
const requireVPSAccess = async (req, res, next) => {
  const { query } = require('../config/database');
  
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'You must be logged in to access this resource'
    });
  }

  const vpsId = req.params.id || req.params.vpsId;
  
  if (!vpsId) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'VPS ID is required'
    });
  }

  try {
    const vps = await query(
      'SELECT id, user_id FROM vps_instances WHERE id = ?',
      [vpsId]
    );

    if (vps.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: 'VPS not found'
      });
    }

    // Owner can access any VPS
    if (req.user.role === 'owner') {
      req.vps = vps[0];
      return next();
    }

    // Users can only access their assigned VPS
    if (vps[0].user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have access to this VPS'
      });
    }

    req.vps = vps[0];
    next();
  } catch (error) {
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to verify VPS access'
    });
  }
};

module.exports = { requireOwner, requireUser, requireVPSAccess };
