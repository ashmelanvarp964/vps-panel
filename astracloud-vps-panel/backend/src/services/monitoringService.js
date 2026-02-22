const vpsModel = require('../models/vpsModel');
const proxmoxService = require('./proxmoxService');
const logger = require('../utils/logger');

const monitoringService = {
  // Update monitoring data for a VPS
  updateVPSMonitoring: async (vpsId) => {
    try {
      const vps = await vpsModel.findById(vpsId);
      
      if (!vps || vps.status === 'suspended' || vps.status === 'expired') {
        return;
      }

      // Get resource usage from Proxmox
      const resources = await proxmoxService.getVMResources(vps.proxmox_node, vps.vmid);

      // Check for overload condition (CPU or RAM > 95%)
      const isOverloaded = parseFloat(resources.cpu) > 95 || parseFloat(resources.mem) > 95;
      
      // Get current overload count
      const monitoring = await vpsModel.getMonitoring(vpsId);
      let overloadCount = monitoring?.overload_count || 0;

      if (isOverloaded) {
        overloadCount++;
      } else {
        overloadCount = 0; // Reset if not overloaded
      }

      // Update monitoring data
      await vpsModel.updateMonitoring(vpsId, {
        cpu: parseFloat(resources.cpu) || 0,
        ram: parseFloat(resources.mem) || 0,
        disk: parseFloat(resources.disk) || 0,
        networkIn: resources.netin || 0,
        networkOut: resources.netout || 0,
        overloadCount
      });

      return {
        vpsId,
        resources,
        overloadCount,
        isOverloaded
      };
    } catch (error) {
      logger.error('Update VPS monitoring error:', { vpsId, error: error.message });
      return null;
    }
  },

  // Update monitoring for all running VPS
  updateAllMonitoring: async () => {
    try {
      const vpsList = await vpsModel.findAll();
      const runningVPS = vpsList.filter(v => v.status === 'running');

      const results = await Promise.all(
        runningVPS.map(vps => monitoringService.updateVPSMonitoring(vps.id))
      );

      const updated = results.filter(r => r !== null);
      logger.debug('Monitoring updated:', { total: runningVPS.length, updated: updated.length });

      return updated;
    } catch (error) {
      logger.error('Update all monitoring error:', error);
      return [];
    }
  },

  // Get monitoring data for a VPS
  getVPSMonitoring: async (vpsId) => {
    try {
      const monitoring = await vpsModel.getMonitoring(vpsId);
      return monitoring;
    } catch (error) {
      logger.error('Get VPS monitoring error:', { vpsId, error: error.message });
      return null;
    }
  },

  // Get live status from Proxmox
  getLiveStatus: async (vpsId) => {
    try {
      const vps = await vpsModel.findById(vpsId);
      
      if (!vps) {
        return null;
      }

      const status = await proxmoxService.getVMStatus(vps.proxmox_node, vps.vmid);
      return status;
    } catch (error) {
      logger.error('Get live status error:', { vpsId, error: error.message });
      return null;
    }
  }
};

module.exports = monitoringService;
