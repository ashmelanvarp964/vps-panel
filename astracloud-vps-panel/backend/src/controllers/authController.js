const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const jwtConfig = require('../config/jwt');
const userModel = require('../models/userModel');
const { query } = require('../config/database');
const logger = require('../utils/logger');

const authController = {
  // Register new user
  register: async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // Check if username exists
      if (await userModel.usernameExists(username)) {
        return res.status(409).json({
          error: 'Registration failed',
          message: 'Username is already taken'
        });
      }

      // Check if email exists
      if (await userModel.emailExists(email)) {
        return res.status(409).json({
          error: 'Registration failed',
          message: 'Email is already registered'
        });
      }

      // Check if this is the first user (becomes owner)
      const userCount = await userModel.getCount();
      const role = userCount === 0 ? 'owner' : 'user';

      // Create user
      const user = await userModel.create({
        username,
        email,
        password,
        role
      });

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        jwtConfig.secret,
        { 
          expiresIn: jwtConfig.expiration,
          algorithm: jwtConfig.algorithm,
          issuer: jwtConfig.issuer
        }
      );

      logger.info('User registered:', { userId: user.id, username, role });

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { login, password } = req.body;

      // Find user by username or email
      const user = await userModel.findByLogin(login);

      if (!user) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid credentials'
        });
      }

      // Verify password
      const isValid = await userModel.verifyPassword(password, user.password_hash);

      if (!isValid) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid credentials'
        });
      }

      // Update last login
      await userModel.updateLastLogin(user.id);

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        jwtConfig.secret,
        { 
          expiresIn: jwtConfig.expiration,
          algorithm: jwtConfig.algorithm,
          issuer: jwtConfig.issuer
        }
      );

      logger.info('User logged in:', { userId: user.id, username: user.username });

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  },

  // Logout user (blacklist token)
  logout: async (req, res) => {
    try {
      const token = req.token;
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Decode token to get expiry
      const decoded = jwt.decode(token);
      const expiresAt = new Date(decoded.exp * 1000);

      // Add to blacklist
      await query(
        'INSERT INTO token_blacklist (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
        [tokenHash, req.user.id, expiresAt]
      );

      logger.info('User logged out:', { userId: req.user.id });

      res.json({
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  },

  // Get current user info
  me: async (req, res) => {
    try {
      const user = await userModel.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User account no longer exists'
        });
      }

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
          last_login: user.last_login
        }
      });
    } catch (error) {
      logger.error('Get user error:', error);
      throw error;
    }
  },

  // Refresh token
  refresh: async (req, res) => {
    try {
      const user = req.user;

      // Generate new JWT
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        jwtConfig.secret,
        { 
          expiresIn: jwtConfig.expiration,
          algorithm: jwtConfig.algorithm,
          issuer: jwtConfig.issuer
        }
      );

      res.json({
        message: 'Token refreshed',
        token
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }
};

module.exports = authController;
