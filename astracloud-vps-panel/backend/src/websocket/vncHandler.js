const WebSocket = require('ws');
const { wsAuth, checkVPSAccess } = require('./authMiddleware');
const proxmoxService = require('../services/proxmoxService');
const { client: proxmoxClient } = require('../config/proxmox');
const logger = require('../utils/logger');

// Store active VNC connections
const vncConnections = new Map();

// Session timeout (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

const handleVNCConnection = async (ws, req) => {
  let proxmoxWs = null;
  let sessionTimer = null;
  let vpsId = null;

  try {
    // Extract VPS ID from URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    vpsId = pathParts[pathParts.length - 1];

    if (!vpsId || isNaN(parseInt(vpsId))) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid VPS ID' }));
      ws.close();
      return;
    }

    // Authenticate user
    const authResult = await wsAuth(ws, req);
    if (!authResult.authenticated) {
      ws.send(JSON.stringify({ type: 'error', message: authResult.error }));
      ws.close();
      return;
    }

    const user = authResult.user;

    // Check VPS access
    const accessResult = await checkVPSAccess(user, vpsId);
    if (!accessResult.hasAccess) {
      ws.send(JSON.stringify({ type: 'error', message: accessResult.error }));
      ws.close();
      return;
    }

    const vps = accessResult.vps;

    // Check VPS status
    if (vps.status === 'suspended' || vps.status === 'expired') {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: `Cannot connect to a ${vps.status} VPS` 
      }));
      ws.close();
      return;
    }

    // Send connection status
    ws.send(JSON.stringify({ type: 'status', message: 'Connecting to VNC...' }));

    // Get VNC ticket from Proxmox
    const vncTicket = await proxmoxService.getVNCTicket(vps.proxmox_node, vps.vmid);

    if (!vncTicket.ticket || !vncTicket.port) {
      ws.send(JSON.stringify({ type: 'error', message: 'Failed to get VNC ticket' }));
      ws.close();
      return;
    }

    // Build Proxmox WebSocket URL
    const proxmoxHost = process.env.PROXMOX_HOST || 'https://localhost:8006';
    const wsUrl = proxmoxHost
      .replace('https://', 'wss://')
      .replace('http://', 'ws://');
    
    const proxmoxWsUrl = `${wsUrl}/api2/json/nodes/${vps.proxmox_node}/qemu/${vps.vmid}/vncwebsocket?port=${vncTicket.port}&vncticket=${encodeURIComponent(vncTicket.ticket)}`;

    // Connect to Proxmox VNC WebSocket
    proxmoxWs = new WebSocket(proxmoxWsUrl, {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    });

    // Store connection
    const connectionId = `vnc-${user.id}-${vpsId}-${Date.now()}`;
    vncConnections.set(connectionId, { proxmoxWs, ws, user, vpsId });

    // Reset session timeout on activity
    const resetTimeout = () => {
      if (sessionTimer) clearTimeout(sessionTimer);
      sessionTimer = setTimeout(() => {
        ws.send(JSON.stringify({ type: 'timeout', message: 'Session timed out due to inactivity' }));
        cleanup();
      }, SESSION_TIMEOUT);
    };

    resetTimeout();

    // Handle Proxmox WebSocket open
    proxmoxWs.on('open', () => {
      ws.send(JSON.stringify({ type: 'connected', message: 'VNC connection established' }));
      logger.info('VNC session started:', { userId: user.id, vpsId });
    });

    // Proxy data from Proxmox to client
    proxmoxWs.on('message', (data) => {
      if (ws.readyState === ws.OPEN) {
        // Forward raw binary data
        ws.send(data);
      }
      resetTimeout();
    });

    // Handle Proxmox WebSocket close
    proxmoxWs.on('close', () => {
      ws.send(JSON.stringify({ type: 'closed', message: 'VNC session closed' }));
      cleanup();
    });

    // Handle Proxmox WebSocket error
    proxmoxWs.on('error', (error) => {
      logger.error('Proxmox VNC WebSocket error:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'VNC connection error' }));
      cleanup();
    });

    // Proxy data from client to Proxmox
    ws.on('message', (data) => {
      try {
        // Check if it's a control message
        if (typeof data === 'string' || data instanceof String) {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
            resetTimeout();
            return;
          }
        }
        
        // Forward raw data to Proxmox
        if (proxmoxWs && proxmoxWs.readyState === WebSocket.OPEN) {
          proxmoxWs.send(data);
          resetTimeout();
        }
      } catch {
        // Not JSON, forward as binary
        if (proxmoxWs && proxmoxWs.readyState === WebSocket.OPEN) {
          proxmoxWs.send(data);
          resetTimeout();
        }
      }
    });

    // Cleanup function
    const cleanup = () => {
      if (sessionTimer) clearTimeout(sessionTimer);
      if (proxmoxWs) {
        proxmoxWs.close();
        proxmoxWs = null;
      }
      vncConnections.delete(connectionId);
      if (ws.readyState === ws.OPEN) {
        ws.close();
      }
      logger.info('VNC session closed:', { userId: user.id, vpsId });
    };

    // Handle client WebSocket close
    ws.on('close', () => {
      cleanup();
    });

    // Handle client WebSocket error
    ws.on('error', (error) => {
      logger.error('VNC client WebSocket error:', error);
      cleanup();
    });

  } catch (error) {
    logger.error('VNC connection error:', error);
    
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: `VNC connection failed: ${error.message}` 
      }));
      ws.close();
    }
    
    if (proxmoxWs) {
      proxmoxWs.close();
    }
  }
};

// Get active VNC connection count
const getActiveVNCConnections = () => {
  return vncConnections.size;
};

// Close all VNC connections for a VPS
const closeVPSVNCConnections = (vpsId) => {
  for (const [key, conn] of vncConnections.entries()) {
    if (conn.vpsId === parseInt(vpsId)) {
      if (conn.ws.readyState === conn.ws.OPEN) {
        conn.ws.close();
      }
      if (conn.proxmoxWs && conn.proxmoxWs.readyState === WebSocket.OPEN) {
        conn.proxmoxWs.close();
      }
      vncConnections.delete(key);
    }
  }
};

module.exports = { 
  handleVNCConnection, 
  getActiveVNCConnections,
  closeVPSVNCConnections
};
