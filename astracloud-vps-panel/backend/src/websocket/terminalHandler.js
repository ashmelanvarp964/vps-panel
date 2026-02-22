const { NodeSSH } = require('node-ssh');
const { wsAuth, checkVPSAccess } = require('./authMiddleware');
const logger = require('../utils/logger');

// Store active SSH connections
const sshConnections = new Map();

// Session timeout (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

const handleTerminalConnection = async (ws, req) => {
  let ssh = null;
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
    ws.send(JSON.stringify({ type: 'status', message: 'Connecting to VPS...' }));

    // Create SSH connection
    ssh = new NodeSSH();

    // Determine SSH host and port
    let sshHost = vps.ip_address;
    let sshPort = 22;

    // For private IPs, use Proxmox host with allocated port
    if (vps.ssh_port) {
      const proxmoxHost = process.env.PROXMOX_HOST?.replace('https://', '').split(':')[0];
      if (proxmoxHost) {
        sshHost = proxmoxHost;
        sshPort = vps.ssh_port;
      }
    }

    // Connect to SSH
    await ssh.connect({
      host: sshHost,
      port: sshPort,
      username: 'root',
      // In production, you'd use SSH keys stored securely
      // This is a placeholder - implement proper key management
      privateKey: process.env.SSH_PRIVATE_KEY_PATH 
        ? require('fs').readFileSync(process.env.SSH_PRIVATE_KEY_PATH, 'utf8')
        : undefined,
      password: process.env.SSH_DEFAULT_PASSWORD || undefined,
      readyTimeout: 30000,
      keepaliveInterval: 10000
    });

    // Store connection
    const connectionId = `${user.id}-${vpsId}-${Date.now()}`;
    sshConnections.set(connectionId, { ssh, ws, user, vpsId });

    // Send success message
    ws.send(JSON.stringify({ type: 'connected', message: 'SSH connection established' }));

    // Start shell session
    const shell = await ssh.requestShell({
      term: 'xterm-256color',
      cols: 80,
      rows: 24
    });

    // Reset session timeout on activity
    const resetTimeout = () => {
      if (sessionTimer) clearTimeout(sessionTimer);
      sessionTimer = setTimeout(() => {
        ws.send(JSON.stringify({ type: 'timeout', message: 'Session timed out due to inactivity' }));
        cleanup();
      }, SESSION_TIMEOUT);
    };

    resetTimeout();

    // Pipe shell output to WebSocket
    shell.on('data', (data) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data: data.toString('base64') }));
      }
      resetTimeout();
    });

    shell.on('close', () => {
      ws.send(JSON.stringify({ type: 'closed', message: 'Shell session closed' }));
      cleanup();
    });

    shell.stderr.on('data', (data) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data: data.toString('base64') }));
      }
    });

    // Handle WebSocket messages (keyboard input)
    ws.on('message', (message) => {
      try {
        const msg = JSON.parse(message.toString());
        
        if (msg.type === 'input' && msg.data) {
          // Decode base64 input and write to shell
          const input = Buffer.from(msg.data, 'base64').toString();
          shell.write(input);
          resetTimeout();
        } else if (msg.type === 'resize' && msg.cols && msg.rows) {
          // Handle terminal resize
          shell.setWindow(msg.rows, msg.cols, 0, 0);
        } else if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          resetTimeout();
        }
      } catch (err) {
        logger.error('Terminal message error:', err);
      }
    });

    // Cleanup function
    const cleanup = () => {
      if (sessionTimer) clearTimeout(sessionTimer);
      if (ssh) {
        ssh.dispose();
        ssh = null;
      }
      sshConnections.delete(connectionId);
      if (ws.readyState === ws.OPEN) {
        ws.close();
      }
      logger.info('Terminal session closed:', { userId: user.id, vpsId });
    };

    // Handle WebSocket close
    ws.on('close', () => {
      cleanup();
    });

    // Handle WebSocket error
    ws.on('error', (error) => {
      logger.error('Terminal WebSocket error:', error);
      cleanup();
    });

    logger.info('Terminal session started:', { userId: user.id, vpsId, host: sshHost, port: sshPort });

  } catch (error) {
    logger.error('Terminal connection error:', error);
    
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: `Connection failed: ${error.message}` 
      }));
      ws.close();
    }
    
    if (ssh) {
      ssh.dispose();
    }
  }
};

// Get active connection count
const getActiveConnections = () => {
  return sshConnections.size;
};

// Close all connections for a user
const closeUserConnections = (userId) => {
  for (const [key, conn] of sshConnections.entries()) {
    if (conn.user.id === userId) {
      if (conn.ws.readyState === conn.ws.OPEN) {
        conn.ws.close();
      }
      if (conn.ssh) {
        conn.ssh.dispose();
      }
      sshConnections.delete(key);
    }
  }
};

// Close all connections for a VPS
const closeVPSConnections = (vpsId) => {
  for (const [key, conn] of sshConnections.entries()) {
    if (conn.vpsId === parseInt(vpsId)) {
      if (conn.ws.readyState === conn.ws.OPEN) {
        conn.ws.close();
      }
      if (conn.ssh) {
        conn.ssh.dispose();
      }
      sshConnections.delete(key);
    }
  }
};

module.exports = { 
  handleTerminalConnection, 
  getActiveConnections,
  closeUserConnections,
  closeVPSConnections
};
