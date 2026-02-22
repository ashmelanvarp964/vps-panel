const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { query } = require('../config/database');
const crypto = require('crypto');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Check if token is blacklisted
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const blacklisted = await query(
      'SELECT id FROM token_blacklist WHERE token_hash = ? AND expires_at > NOW()',
      [tokenHash]
    );
    
    if (blacklisted.length > 0) {
      return res.status(401).json({ 
        error: 'Token invalid',
        message: 'Token has been revoked'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, jwtConfig.secret, {
      algorithms: [jwtConfig.algorithm],
      issuer: jwtConfig.issuer
    });

    // Get user from database to ensure they still exist
    const users = await query(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'User not found',
        message: 'The user associated with this token no longer exists'
      });
    }

    // Attach user and token to request
    req.user = users[0];
    req.token = token;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided token is invalid'
      });
    }
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
};

// Optional auth - doesn't fail if no token, but attaches user if valid
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    const users = await query(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length > 0) {
      req.user = users[0];
      req.token = token;
    }
    
    next();
  } catch {
    next();
  }
};

module.exports = { auth, optionalAuth };
