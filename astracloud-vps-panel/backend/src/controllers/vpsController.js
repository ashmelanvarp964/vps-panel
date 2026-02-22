const vpsModel = require('../models/vpsModel');
const proxmoxService = require('../services/proxmoxService');
const portService = require('../services/portService');
const logger = require('../utils/logger');

const vpsController = {
  // Get all VPS (role-based filtering)
  getAll: async (req, res) => {
    try {
      let vpsList;

      if (req.user.role === 'owner') {
        vpsList = await vpsModel.findAll();
      } else {
        vpsList = await vpsModel.findByUserId(req.user.id);
      }

      // Add SSH command for private IPs
      vpsList = vpsList.map(vps => ({
        ...vps,
        ssh_command: vps.is_private_ip && vps.ssh_port
          ? `ssh root@${process.env.PROXMOX_HOST?.replace('https://', '').split(':')[0] || 'server'} -p ${vps.ssh_port}`
          : vps.ip_address ? `ssh root@${vps.ip_address}` : null
      }));

      res.json({ vps: vpsList });
    } catch (error) {
      logger.error('Get all VPS error:', error);
      throw error;
    }
  },

  // Get single VPS by ID
  getById: async (req, res) => {
    try {
      const vps = await vpsModel.findById(req.params.id);

      if (!vps) {
        return res.status(404).json({
          error: 'Not found',
          message: 'VPS not found'
        });
      }

      // Check permission
      if (req.user.role !== 'owner' && vps.user_id !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have access to this VPS'
        });
      }

      // Get live status from Proxmox
      try {
        const liveStatus = await proxmoxService.getVMStatus(vps.proxmox_node, vps.vmid);
        vps.live_status = liveStatus;
      } catch (err) {
        logger.warn('Could not fetch live status:', err.message);
      }

      // Add SSH command
      vps.ssh_command = vps.is_private_ip && vps.ssh_port
        ? `ssh root@${process.env.PROXMOX_HOST?.replace('https://', '').split(':')[0] || 'server'} -p ${vps.ssh_port}`
        : vps.ip_address ? `ssh root@${vps.ip_address}` : null;

      res.json({ vps });
    } catch (error) {
      logger.error('Get VPS error:', error);
      throw error;
    }
  },

  // Create new VPS (owner only)
  create: async (req, res) => {
    try {
      const { vmid, name, ram_mb, cpu_cores, disk_gb, ip_address, proxmox_node, user_id, expiry_date } = req.body;

      // Check if VMID already exists
      if (await vpsModel.vmidExists(vmid)) {
        return res.status(409).json({
          error: 'Duplicate VMID',
          message: 'A VPS with this VMID already exists'
        });
      }

      // Check if IP already exists
      if (await vpsModel.ipExists(ip_address)) {
        return res.status(409).json({
          error: 'Duplicate IP',
          message: 'A VPS with this IP address already exists'
        });
      }

      // Check if IP is private
      const isPrivateIp = portService.isPrivateIP(ip_address);
      let sshPort = null;

      // Allocate SSH port for private IP
      if (isPrivateIp) {
        sshPort = await portService.allocatePort();
        if (!sshPort) {
          return res.status(503).json({
            error: 'Port allocation failed',
            message: 'No available SSH ports for private IP'
          });
        }
      }

      // Create VPS in database
      const vps = await vpsModel.create({
        vmid,
        name,
        user_id: user_id || null,
        ram_mb,
        cpu_cores,
        disk_gb,
        ip_address,
        is_private_ip: isPrivateIp,
        ssh_port: sshPort,
        proxmox_node,
        expiry_date: expiry_date || null
      });

      // Associate port with VPS if allocated
      if (sshPort) {
        await portService.assignPortToVPS(sshPort, vps.id);
      }

      logger.info('VPS created:', { vpsId: vps.id, vmid, name, createdBy: req.user.id });

      res.status(201).json({
        message: 'VPS created successfully',
        vps: {
          ...vps,
          ssh_port: sshPort,
          is_private_ip: isPrivateIp
        }
      });
    } catch (error) {
      logger.error('Create VPS error:', error);
      throw error;
    }
  },

  // Start VPS
  start: async (req, res) => {
    try {
      const vps = await vpsModel.findById(req.params.id);

      if (!vps) {
        return res.status(404).json({ error: 'Not found', message: 'VPS not found' });
      }

      if (vps.status === 'suspended' || vps.status === 'expired') {
        return res.status(403).json({
          error: 'Action not allowed',
          message: `Cannot start a ${vps.status} VPS`
        });
      }

      // Start VM via Proxmox
      await proxmoxService.startVM(vps.proxmox_node, vps.vmid);

      // Update status in database
      await vpsModel.updateStatus(vps.id, 'running');

      logger.info('VPS started:', { vpsId: vps.id, vmid: vps.vmid, userId: req.user.id });

      res.json({
        message: 'VPS started successfully',
        status: 'running'
      });
    } catch (error) {
      logger.error('Start VPS error:', error);
      throw error;
    }
  },

  // Stop VPS
  stop: async (req, res) => {
    try {
      const vps = await vpsModel.findById(req.params.id);

      if (!vps) {
        return res.status(404).json({ error: 'Not found', message: 'VPS not found' });
      }

      // Stop VM via Proxmox
      await proxmoxService.stopVM(vps.proxmox_node, vps.vmid);

      // Update status in database
      await vpsModel.updateStatus(vps.id, 'stopped');

      logger.info('VPS stopped:', { vpsId: vps.id, vmid: vps.vmid, userId: req.user.id });

      res.json({
        message: 'VPS stopped successfully',
        status: 'stopped'
      });
    } catch (error) {
      logger.error('Stop VPS error:', error);
      throw error;
    }
  },

  // Reboot VPS
  reboot: async (req, res) => {
    try {
      const vps = await vpsModel.findById(req.params.id);

      if (!vps) {
        return res.status(404).json({ error: 'Not found', message: 'VPS not found' });
      }

      if (vps.status === 'suspended' || vps.status === 'expired') {
        return res.status(403).json({
          error: 'Action not allowed',
          message: `Cannot reboot a ${vps.status} VPS`
        });
      }

      // Reboot VM via Proxmox
      await proxmoxService.rebootVM(vps.proxmox_node, vps.vmid);

      logger.info('VPS rebooted:', { vpsId: vps.id, vmid: vps.vmid, userId: req.user.id });

      res.json({
        message: 'VPS reboot initiated',
        status: 'running'
      });
    } catch (error) {
      logger.error('Reboot VPS error:', error);
      throw error;
    }
  },

  // Suspend VPS (owner only)
  suspend: async (req, res) => {
    try {
      const vps = await vpsModel.findById(req.params.id);

      if (!vps) {
        return res.status(404).json({ error: 'Not found', message: 'VPS not found' });
      }

      // Stop VM via Proxmox
      try {
        await proxmoxService.stopVM(vps.proxmox_node, vps.vmid);
      } catch (err) {
        logger.warn('Error stopping VM during suspend:', err.message);
      }

      // Update status in database
      await vpsModel.updateStatus(vps.id, 'suspended', 'Manual suspension by admin');

      logger.info('VPS suspended:', { vpsId: vps.id, vmid: vps.vmid, suspendedBy: req.user.id });

      res.json({
        message: 'VPS suspended successfully',
        status: 'suspended'
      });
    } catch (error) {
      logger.error('Suspend VPS error:', error);
      throw error;
    }
  },

  // Unsuspend VPS (owner only)
  unsuspend: async (req, res) => {
    try {
      const vps = await vpsModel.findById(req.params.id);

      if (!vps) {
        return res.status(404).json({ error: 'Not found', message: 'VPS not found' });
      }

      // Update status in database (set to stopped, user must start manually)
      await vpsModel.updateStatus(vps.id, 'stopped', null);
      await vpsModel.resetOverloadCount(vps.id);

      logger.info('VPS unsuspended:', { vpsId: vps.id, vmid: vps.vmid, unsuspendedBy: req.user.id });

      res.json({
        message: 'VPS unsuspended successfully',
        status: 'stopped'
      });
    } catch (error) {
      logger.error('Unsuspend VPS error:', error);
      throw error;
    }
  },

  // Assign VPS to user (owner only)
  assign: async (req, res) => {
    try {
      const { user_id } = req.body;

      await vpsModel.assignToUser(req.params.id, user_id);

      logger.info('VPS assigned:', { vpsId: req.params.id, userId: user_id, assignedBy: req.user.id });

      res.json({
        message: 'VPS assigned successfully'
      });
    } catch (error) {
      logger.error('Assign VPS error:', error);
      throw error;
    }
  },

  // Set expiry date (owner only)
  setExpiry: async (req, res) => {
    try {
      const { expiry_date } = req.body;

      await vpsModel.setExpiry(req.params.id, expiry_date);

      logger.info('VPS expiry set:', { vpsId: req.params.id, expiryDate: expiry_date, setBy: req.user.id });

      res.json({
        message: 'Expiry date updated successfully'
      });
    } catch (error) {
      logger.error('Set expiry error:', error);
      throw error;
    }
  },

  // Set override suspension (owner only)
  setOverride: async (req, res) => {
    try {
      const { override_suspension } = req.body;

      await vpsModel.setOverride(req.params.id, override_suspension);

      logger.info('VPS override set:', { vpsId: req.params.id, override: override_suspension, setBy: req.user.id });

      res.json({
        message: 'Override setting updated successfully'
      });
    } catch (error) {
      logger.error('Set override error:', error);
      throw error;
    }
  },

  // Delete VPS (owner only)
  delete: async (req, res) => {
    try {
      const vps = await vpsModel.findById(req.params.id);

      if (!vps) {
        return res.status(404).json({ error: 'Not found', message: 'VPS not found' });
      }

      // Try to stop VM first
      try {
        await proxmoxService.stopVM(vps.proxmox_node, vps.vmid);
      } catch (err) {
        logger.warn('Error stopping VM during delete:', err.message);
      }

      // Release SSH port if allocated
      if (vps.ssh_port) {
        await portService.releasePort(vps.ssh_port);
      }

      // Delete from database
      await vpsModel.delete(vps.id);

      logger.info('VPS deleted:', { vpsId: vps.id, vmid: vps.vmid, deletedBy: req.user.id });

      res.json({
        message: 'VPS deleted successfully'
      });
    } catch (error) {
      logger.error('Delete VPS error:', error);
      throw error;
    }
  }
};

module.exports = vpsController;
