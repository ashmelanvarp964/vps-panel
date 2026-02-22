const vpsModel = require('../models/vpsModel');
const proxmoxService = require('./proxmoxService');
const portService = require('./portService');
const logger = require('../utils/logger');

const vpsService = {
  // Get VPS with live status
  getVPSWithStatus: async (vpsId) => {
    const vps = await vpsModel.findById(vpsId);
    
    if (!vps) {
      return null;
    }

    // Try to get live status from Proxmox
    try {
      const liveStatus = await proxmoxService.getVMStatus(vps.proxmox_node, vps.vmid);
      vps.live_status = liveStatus;
      
      // Update local status if different
      if (liveStatus.status && liveStatus.status !== vps.status) {
        if (vps.status !== 'suspended' && vps.status !== 'expired') {
          await vpsModel.updateStatus(vps.id, liveStatus.status === 'running' ? 'running' : 'stopped');
          vps.status = liveStatus.status === 'running' ? 'running' : 'stopped';
        }
      }
    } catch (err) {
      logger.warn('Could not fetch live status:', { vpsId, error: err.message });
    }

    // Add SSH command
    vps.ssh_command = vpsService.getSSHCommand(vps);

    return vps;
  },

  // Generate SSH command for VPS
  getSSHCommand: (vps) => {
    if (!vps) return null;

    if (vps.is_private_ip && vps.ssh_port) {
      const host = process.env.PROXMOX_HOST?.replace('https://', '').split(':')[0] || 'server';
      return `ssh root@${host} -p ${vps.ssh_port}`;
    }

    if (vps.ip_address) {
      return `ssh root@${vps.ip_address}`;
    }

    return null;
  },

  // Validate VPS action
  canPerformAction: (vps, action) => {
    if (!vps) {
      return { allowed: false, reason: 'VPS not found' };
    }

    const restrictedStatuses = ['suspended', 'expired'];
    const restrictedActions = ['start', 'reboot'];

    if (restrictedStatuses.includes(vps.status) && restrictedActions.includes(action)) {
      return { 
        allowed: false, 
        reason: `Cannot ${action} a ${vps.status} VPS` 
      };
    }

    return { allowed: true };
  },

  // Sync VPS status with Proxmox
  syncStatus: async (vpsId) => {
    try {
      const vps = await vpsModel.findById(vpsId);
      
      if (!vps) {
        return null;
      }

      // Skip sync for suspended/expired VPS
      if (vps.status === 'suspended' || vps.status === 'expired') {
        return vps.status;
      }

      const liveStatus = await proxmoxService.getVMStatus(vps.proxmox_node, vps.vmid);
      const newStatus = liveStatus.status === 'running' ? 'running' : 'stopped';

      if (newStatus !== vps.status) {
        await vpsModel.updateStatus(vps.id, newStatus);
        logger.info('VPS status synced:', { vpsId, oldStatus: vps.status, newStatus });
      }

      return newStatus;
    } catch (error) {
      logger.error('Status sync error:', { vpsId, error: error.message });
      return null;
    }
  },

  // Sync all VPS statuses
  syncAllStatuses: async () => {
    try {
      const vpsList = await vpsModel.findAll();
      const syncableVPS = vpsList.filter(v => !['suspended', 'expired'].includes(v.status));

      const results = await Promise.all(
        syncableVPS.map(vps => vpsService.syncStatus(vps.id))
      );

      logger.info('All VPS statuses synced:', { 
        total: syncableVPS.length, 
        synced: results.filter(r => r !== null).length 
      });

      return results;
    } catch (error) {
      logger.error('Sync all statuses error:', error);
      return [];
    }
  },

  // Check VPS health
  checkHealth: async (vpsId) => {
    try {
      const vps = await vpsModel.findById(vpsId);
      
      if (!vps) {
        return { healthy: false, reason: 'VPS not found' };
      }

      // Check if VM exists in Proxmox
      const exists = await proxmoxService.vmExists(vps.proxmox_node, vps.vmid);
      
      if (!exists) {
        return { healthy: false, reason: 'VM not found in Proxmox' };
      }

      // Get status
      const status = await proxmoxService.getVMStatus(vps.proxmox_node, vps.vmid);

      return {
        healthy: true,
        status: status.status,
        uptime: status.uptime,
        resources: {
          cpu: status.cpu,
          mem: status.mem,
          maxmem: status.maxmem
        }
      };
    } catch (error) {
      return { healthy: false, reason: error.message };
    }
  }
};

module.exports = vpsService;
