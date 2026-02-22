const brandingModel = require('../models/brandingModel');
const logger = require('../utils/logger');

const brandingController = {
  // Get branding settings
  get: async (req, res) => {
    try {
      const branding = await brandingModel.get();

      res.json({ branding });
    } catch (error) {
      logger.error('Get branding error:', error);
      throw error;
    }
  },

  // Update branding settings (owner only)
  update: async (req, res) => {
    try {
      const updates = req.body;

      const branding = await brandingModel.update(updates);

      logger.info('Branding updated:', { updatedBy: req.user.id, fields: Object.keys(updates) });

      res.json({
        message: 'Branding updated successfully',
        branding
      });
    } catch (error) {
      logger.error('Update branding error:', error);
      throw error;
    }
  }
};

module.exports = brandingController;
