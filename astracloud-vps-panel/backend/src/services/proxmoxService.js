const { client, defaultNode } = require('../config/proxmox');
const logger = require('../utils/logger');

const proxmoxService = {
  // Get VM status
  getVMStatus: async (node, vmid) => {
    try {
      const response = await client.get(`/nodes/${node || defaultNode}/qemu/${vmid}/status/current`);
      const data = response.data?.data || {};
      
      return {
        status: data.status, // 'running', 'stopped', etc.
        uptime: data.uptime,
        cpu: data.cpu,
        mem: data.mem,
        maxmem: data.maxmem,
        disk: data.disk,
        maxdisk: data.maxdisk,
        netin: data.netin,
        netout: data.netout
      };
    } catch (error) {
      logger.error('Get VM status error:', { node, vmid, error: error.message });
      throw new Error(`Failed to get VM status: ${error.message}`);
    }
  },

  // Start VM
  startVM: async (node, vmid) => {
    try {
      const response = await client.post(`/nodes/${node || defaultNode}/qemu/${vmid}/status/start`);
      logger.info('VM start initiated:', { node, vmid, task: response.data?.data });
      return response.data?.data;
    } catch (error) {
      logger.error('Start VM error:', { node, vmid, error: error.message });
      throw new Error(`Failed to start VM: ${error.message}`);
    }
  },

  // Stop VM
  stopVM: async (node, vmid) => {
    try {
      const response = await client.post(`/nodes/${node || defaultNode}/qemu/${vmid}/status/stop`);
      logger.info('VM stop initiated:', { node, vmid, task: response.data?.data });
      return response.data?.data;
    } catch (error) {
      logger.error('Stop VM error:', { node, vmid, error: error.message });
      throw new Error(`Failed to stop VM: ${error.message}`);
    }
  },

  // Shutdown VM (graceful)
  shutdownVM: async (node, vmid) => {
    try {
      const response = await client.post(`/nodes/${node || defaultNode}/qemu/${vmid}/status/shutdown`);
      logger.info('VM shutdown initiated:', { node, vmid, task: response.data?.data });
      return response.data?.data;
    } catch (error) {
      logger.error('Shutdown VM error:', { node, vmid, error: error.message });
      throw new Error(`Failed to shutdown VM: ${error.message}`);
    }
  },

  // Reboot VM
  rebootVM: async (node, vmid) => {
    try {
      const response = await client.post(`/nodes/${node || defaultNode}/qemu/${vmid}/status/reboot`);
      logger.info('VM reboot initiated:', { node, vmid, task: response.data?.data });
      return response.data?.data;
    } catch (error) {
      logger.error('Reboot VM error:', { node, vmid, error: error.message });
      throw new Error(`Failed to reboot VM: ${error.message}`);
    }
  },

  // Get VM configuration
  getVMConfig: async (node, vmid) => {
    try {
      const response = await client.get(`/nodes/${node || defaultNode}/qemu/${vmid}/config`);
      return response.data?.data || {};
    } catch (error) {
      logger.error('Get VM config error:', { node, vmid, error: error.message });
      throw new Error(`Failed to get VM config: ${error.message}`);
    }
  },

  // Get VM resource usage (RRD data)
  getVMResources: async (node, vmid, timeframe = 'hour') => {
    try {
      const response = await client.get(`/nodes/${node || defaultNode}/qemu/${vmid}/rrddata`, {
        params: { timeframe }
      });
      
      const data = response.data?.data || [];
      
      // Get the most recent data point
      const latest = data[data.length - 1] || {};
      
      return {
        cpu: latest.cpu ? (latest.cpu * 100).toFixed(2) : 0,
        mem: latest.mem && latest.maxmem ? ((latest.mem / latest.maxmem) * 100).toFixed(2) : 0,
        disk: latest.disk && latest.maxdisk ? ((latest.disk / latest.maxdisk) * 100).toFixed(2) : 0,
        netin: latest.netin || 0,
        netout: latest.netout || 0
      };
    } catch (error) {
      logger.error('Get VM resources error:', { node, vmid, error: error.message });
      return { cpu: 0, mem: 0, disk: 0, netin: 0, netout: 0 };
    }
  },

  // Get VNC WebSocket ticket
  getVNCTicket: async (node, vmid) => {
    try {
      const response = await client.post(`/nodes/${node || defaultNode}/qemu/${vmid}/vncproxy`, {
        websocket: 1
      });
      
      const data = response.data?.data || {};
      
      return {
        ticket: data.ticket,
        port: data.port,
        user: data.user,
        upid: data.upid
      };
    } catch (error) {
      logger.error('Get VNC ticket error:', { node, vmid, error: error.message });
      throw new Error(`Failed to get VNC ticket: ${error.message}`);
    }
  },

  // Get VNC WebSocket path
  getVNCWebSocket: async (node, vmid, ticket, port) => {
    try {
      const response = await client.get(`/nodes/${node || defaultNode}/qemu/${vmid}/vncwebsocket`, {
        params: { port, vncticket: ticket }
      });
      return response.data?.data || {};
    } catch (error) {
      logger.error('Get VNC WebSocket error:', { node, vmid, error: error.message });
      throw new Error(`Failed to get VNC WebSocket: ${error.message}`);
    }
  },

  // List all VMs on a node
  listVMs: async (node) => {
    try {
      const response = await client.get(`/nodes/${node || defaultNode}/qemu`);
      return response.data?.data || [];
    } catch (error) {
      logger.error('List VMs error:', { node, error: error.message });
      throw new Error(`Failed to list VMs: ${error.message}`);
    }
  },

  // Get cluster nodes
  getNodes: async () => {
    try {
      const response = await client.get('/nodes');
      return response.data?.data || [];
    } catch (error) {
      logger.error('Get nodes error:', error.message);
      throw new Error(`Failed to get nodes: ${error.message}`);
    }
  },

  // Check if VM exists
  vmExists: async (node, vmid) => {
    try {
      await client.get(`/nodes/${node || defaultNode}/qemu/${vmid}/status/current`);
      return true;
    } catch (error) {
      if (error.response?.status === 500 || error.response?.status === 404) {
        return false;
      }
      throw error;
    }
  }
};

module.exports = proxmoxService;
