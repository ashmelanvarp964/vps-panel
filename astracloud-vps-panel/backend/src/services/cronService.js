const cron = require('node-cron');
const vpsModel = require('../models/vpsModel');
const proxmoxService = require('./proxmoxService');
const monitoringService = require('./monitoringService');
const logger = require('../utils/logger');

const cronService = {
  jobs: [],

  // Start all cron jobs
  start: () => {
    logger.info('Starting cron jobs...');

    // Update monitoring every minute
    const monitoringJob = cron.schedule('* * * * *', async () => {
      logger.debug('Running monitoring update job');
      await monitoringService.updateAllMonitoring();
      await cronService.checkOverloads();
    });
    cronService.jobs.push(monitoringJob);

    // Check for expired VPS every day at midnight
    const expiryJob = cron.schedule('0 0 * * *', async () => {
      logger.info('Running expiry check job');
      await cronService.checkExpiry();
    });
    cronService.jobs.push(expiryJob);

    // Clean up expired tokens every hour
    const tokenCleanupJob = cron.schedule('0 * * * *', async () => {
      logger.debug('Running token cleanup job');
      await cronService.cleanupTokens();
    });
    cronService.jobs.push(tokenCleanupJob);

    logger.info('Cron jobs started:', { count: cronService.jobs.length });
  },

  // Stop all cron jobs
  stop: () => {
    cronService.jobs.forEach(job => job.stop());
    cronService.jobs = [];
    logger.info('Cron jobs stopped');
  },

  // Check for expired VPS
  checkExpiry: async () => {
    try {
      const expiredVPS = await vpsModel.findExpired();

      for (const vps of expiredVPS) {
        logger.info('VPS expired:', { vpsId: vps.id, vmid: vps.vmid, expiryDate: vps.expiry_date });

        // Try to stop the VM
        try {
          await proxmoxService.stopVM(vps.proxmox_node, vps.vmid);
        } catch (err) {
          logger.warn('Error stopping expired VM:', { vmid: vps.vmid, error: err.message });
        }

        // Update status
        await vpsModel.updateStatus(vps.id, 'expired', 'VPS expired');
      }

      if (expiredVPS.length > 0) {
        logger.info('Expiry check completed:', { suspended: expiredVPS.length });
      }
    } catch (error) {
      logger.error('Expiry check error:', error);
    }
  },

  // Check for overloaded VPS
  checkOverloads: async () => {
    try {
      const overloadedVPS = await vpsModel.findOverloaded();

      for (const vps of overloadedVPS) {
        logger.warn('VPS overloaded:', { 
          vpsId: vps.id, 
          vmid: vps.vmid, 
          overloadCount: vps.overload_count 
        });

        // Try to stop the VM
        try {
          await proxmoxService.stopVM(vps.proxmox_node, vps.vmid);
        } catch (err) {
          logger.warn('Error stopping overloaded VM:', { vmid: vps.vmid, error: err.message });
        }

        // Update status
        await vpsModel.updateStatus(
          vps.id, 
          'suspended', 
          'Auto-suspended due to resource overload (>95% for 3+ minutes)'
        );

        // Reset overload count
        await vpsModel.resetOverloadCount(vps.id);
      }

      if (overloadedVPS.length > 0) {
        logger.info('Overload check completed:', { suspended: overloadedVPS.length });
      }
    } catch (error) {
      logger.error('Overload check error:', error);
    }
  },

  // Clean up expired tokens
  cleanupTokens: async () => {
    try {
      const { query } = require('../config/database');
      const result = await query('DELETE FROM token_blacklist WHERE expires_at < NOW()');
      
      if (result.affectedRows > 0) {
        logger.debug('Cleaned up expired tokens:', { count: result.affectedRows });
      }
    } catch (error) {
      logger.error('Token cleanup error:', error);
    }
  },

  // Run expiry check manually (for testing)
  runExpiryCheck: async () => {
    await cronService.checkExpiry();
  },

  // Run overload check manually (for testing)
  runOverloadCheck: async () => {
    await monitoringService.updateAllMonitoring();
    await cronService.checkOverloads();
  }
};

module.exports = cronService;
