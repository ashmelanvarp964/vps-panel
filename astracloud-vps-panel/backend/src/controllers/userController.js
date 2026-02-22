const userModel = require('../models/userModel');
const vpsModel = require('../models/vpsModel');
const logger = require('../utils/logger');

const userController = {
  // Get all users (owner only)
  getAll: async (req, res) => {
    try {
      const users = await userModel.findAll();

      res.json({ users });
    } catch (error) {
      logger.error('Get all users error:', error);
      throw error;
    }
  },

  // Get user by ID (owner only)
  getById: async (req, res) => {
    try {
      const user = await userModel.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          error: 'Not found',
          message: 'User not found'
        });
      }

      res.json({ user });
    } catch (error) {
      logger.error('Get user error:', error);
      throw error;
    }
  },

  // Get VPS assigned to user (owner only)
  getUserVPS: async (req, res) => {
    try {
      const userId = req.params.id;
      
      // Check if user exists
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'Not found',
          message: 'User not found'
        });
      }

      const vpsList = await vpsModel.findByUserId(userId);

      res.json({ 
        user: {
          id: user.id,
          username: user.username
        },
        vps: vpsList 
      });
    } catch (error) {
      logger.error('Get user VPS error:', error);
      throw error;
    }
  },

  // Update user role (owner only)
  updateRole: async (req, res) => {
    try {
      const { role } = req.body;
      const userId = req.params.id;

      // Prevent owner from demoting themselves
      if (req.user.id === parseInt(userId) && role !== 'owner') {
        return res.status(400).json({
          error: 'Invalid operation',
          message: 'Cannot change your own role'
        });
      }

      await userModel.updateRole(userId, role);

      logger.info('User role updated:', { userId, newRole: role, updatedBy: req.user.id });

      res.json({
        message: 'User role updated successfully'
      });
    } catch (error) {
      logger.error('Update user role error:', error);
      throw error;
    }
  },

  // Delete user (owner only)
  delete: async (req, res) => {
    try {
      const userId = req.params.id;

      // Prevent owner from deleting themselves
      if (req.user.id === parseInt(userId)) {
        return res.status(400).json({
          error: 'Invalid operation',
          message: 'Cannot delete your own account'
        });
      }

      // Check if user exists
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'Not found',
          message: 'User not found'
        });
      }

      await userModel.delete(userId);

      logger.info('User deleted:', { userId, deletedBy: req.user.id });

      res.json({
        message: 'User deleted successfully'
      });
    } catch (error) {
      logger.error('Delete user error:', error);
      throw error;
    }
  }
};

module.exports = userController;
