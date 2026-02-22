const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { query } = require('../config/database');
const crypto = require('crypto');
const logger = require('../utils/logger');

const wsAuth = async (ws, req) => {
  try {
    // Get token from query string
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      return { authenticated: false, error: 'No token provided' };
    }

    // Check if token is blacklisted
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const blacklisted = await query(
      'SELECT id FROM token_blacklist WHERE token_hash = ? AND expires_at > NOW()',
      [tokenHash]
    );

    if (blacklisted.length > 0) {
      return { authenticated: false, error: 'Token has been revoked' };
    }

    // Verify token
    const decoded = jwt.verify(token, jwtConfig.secret, {
      algorithms: [jwtConfig.algorithm],
      issuer: jwtConfig.issuer
    });

    // Get user from database
    const users = await query(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return { authenticated: false, error: 'User not found' };
    }

    return {
      authenticated: true,
      user: users[0]
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { authenticated: false, error: 'Token expired' };
    }
    if (error.name === 'JsonWebTokenError') {
      return { authenticated: false, error: 'Invalid token' };
    }
    logger.error('WebSocket auth error:', error);
    return { authenticated: false, error: 'Authentication failed' };
  }
};

// Check if user has access to a VPS
const checkVPSAccess = async (user, vpsId) => {
  try {
    const vps = await query(
      'SELECT id, user_id, vmid, proxmox_node, ip_address, status FROM vps_instances WHERE id = ?',
      [vpsId]
    );

    if (vps.length === 0) {
      return { hasAccess: false, error: 'VPS not found', vps: null };
    }

    const vpsData = vps[0];

    // Owner can access any VPS
    if (user.role === 'owner') {
      return { hasAccess: true, vps: vpsData };
    }

    // Users can only access their assigned VPS
    if (vpsData.user_id !== user.id) {
      return { hasAccess: false, error: 'Access denied', vps: null };
    }

    return { hasAccess: true, vps: vpsData };
  } catch (error) {
    logger.error('VPS access check error:', error);
    return { hasAccess: false, error: 'Access check failed', vps: null };
  }
};

module.exports = { wsAuth, checkVPSAccess };
