const { query } = require('../config/database');
const logger = require('../utils/logger');

const portService = {
  // Check if IP is private
  isPrivateIP: (ip) => {
    if (!ip) return false;
    
    const parts = ip.split('.').map(Number);
    
    if (parts.length !== 4) return false;
    
    // 10.0.0.0 - 10.255.255.255
    if (parts[0] === 10) return true;
    
    // 172.16.0.0 - 172.31.255.255
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    
    // 192.168.0.0 - 192.168.255.255
    if (parts[0] === 192 && parts[1] === 168) return true;
    
    return false;
  },

  // Allocate an available port
  allocatePort: async () => {
    try {
      // Get next available port
      const result = await query(
        `SELECT port FROM ssh_ports 
         WHERE is_allocated = FALSE 
         ORDER BY port ASC 
         LIMIT 1 
         FOR UPDATE`
      );

      if (result.length === 0) {
        // Try to add more ports if none available
        const maxPort = await query('SELECT MAX(port) as max FROM ssh_ports');
        const nextPort = (maxPort[0]?.max || 9999) + 1;
        const endPort = parseInt(process.env.SSH_PORT_END) || 20000;
        
        if (nextPort <= endPort) {
          await query(
            'INSERT INTO ssh_ports (port, is_allocated) VALUES (?, FALSE)',
            [nextPort]
          );
          
          // Mark as allocated
          await query(
            'UPDATE ssh_ports SET is_allocated = TRUE, allocated_at = NOW() WHERE port = ?',
            [nextPort]
          );
          
          return nextPort;
        }
        
        logger.error('No available SSH ports');
        return null;
      }

      const port = result[0].port;

      // Mark as allocated
      await query(
        'UPDATE ssh_ports SET is_allocated = TRUE, allocated_at = NOW() WHERE port = ?',
        [port]
      );

      logger.info('Port allocated:', { port });
      return port;
    } catch (error) {
      logger.error('Port allocation error:', error);
      throw error;
    }
  },

  // Assign port to VPS
  assignPortToVPS: async (port, vpsId) => {
    try {
      await query(
        'UPDATE ssh_ports SET vps_id = ? WHERE port = ?',
        [vpsId, port]
      );
      logger.info('Port assigned to VPS:', { port, vpsId });
    } catch (error) {
      logger.error('Port assignment error:', error);
      throw error;
    }
  },

  // Release a port
  releasePort: async (port) => {
    try {
      await query(
        'UPDATE ssh_ports SET is_allocated = FALSE, vps_id = NULL, allocated_at = NULL WHERE port = ?',
        [port]
      );
      logger.info('Port released:', { port });
    } catch (error) {
      logger.error('Port release error:', error);
      throw error;
    }
  },

  // Get port by VPS ID
  getPortByVPS: async (vpsId) => {
    const result = await query(
      'SELECT port FROM ssh_ports WHERE vps_id = ?',
      [vpsId]
    );
    return result[0]?.port || null;
  },

  // Check if port is available
  isPortAvailable: async (port) => {
    const result = await query(
      'SELECT is_allocated FROM ssh_ports WHERE port = ?',
      [port]
    );
    return result.length === 0 || !result[0].is_allocated;
  },

  // Initialize port range (call on startup if needed)
  initializePorts: async () => {
    const startPort = parseInt(process.env.SSH_PORT_START) || 10000;
    const endPort = Math.min(startPort + 500, parseInt(process.env.SSH_PORT_END) || 20000);
    
    try {
      // Check if ports already exist
      const existing = await query('SELECT COUNT(*) as count FROM ssh_ports');
      
      if (existing[0].count > 0) {
        logger.info('SSH ports already initialized');
        return;
      }

      // Insert port range
      const ports = [];
      for (let i = startPort; i <= endPort; i++) {
        ports.push([i, false]);
      }

      // Batch insert
      for (const [port, allocated] of ports) {
        await query(
          'INSERT IGNORE INTO ssh_ports (port, is_allocated) VALUES (?, ?)',
          [port, allocated]
        );
      }

      logger.info('SSH ports initialized:', { startPort, endPort, count: ports.length });
    } catch (error) {
      logger.error('Port initialization error:', error);
    }
  }
};

module.exports = portService;
