require('dotenv').config();

const http = require('http');
const { WebSocketServer } = require('ws');
const app = require('./src/app');
const { testConnection: testDB } = require('./src/config/database');
const { testConnection: testProxmox } = require('./src/config/proxmox');
const cronService = require('./src/services/cronService');
const portService = require('./src/services/portService');
const { handleTerminalConnection } = require('./src/websocket/terminalHandler');
const { handleVNCConnection } = require('./src/websocket/vncHandler');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: '/ws'
});

// Handle WebSocket connections
wss.on('connection', async (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  logger.debug('WebSocket connection:', { path: pathname });

  // Route to appropriate handler
  if (pathname.startsWith('/ws/terminal/')) {
    handleTerminalConnection(ws, req);
  } else if (pathname.startsWith('/ws/vnc/')) {
    handleVNCConnection(ws, req);
  } else {
    ws.send(JSON.stringify({ type: 'error', message: 'Invalid WebSocket path' }));
    ws.close();
  }
});

// Handle WebSocket server errors
wss.on('error', (error) => {
  logger.error('WebSocket server error:', error);
});

// Startup function
const startServer = async () => {
  try {
    logger.info('Starting AstraCloud VPS Panel...');

    // Test database connection
    const dbConnected = await testDB();
    if (!dbConnected) {
      logger.error('Database connection failed. Please check your configuration.');
      process.exit(1);
    }

    // Test Proxmox connection
    const proxmoxConnected = await testProxmox();
    if (!proxmoxConnected) {
      logger.warn('Proxmox connection failed. VPS operations may not work.');
    }

    // Initialize SSH ports
    await portService.initializePorts();

    // Start cron jobs
    cronService.start();

    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`WebSocket server ready at ws://localhost:${PORT}/ws`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    logger.error('Server startup failed:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close WebSocket connections
  wss.close(() => {
    logger.info('WebSocket server closed');
  });

  // Stop cron jobs
  cronService.stop();

  // Give time for cleanup
  setTimeout(() => {
    logger.info('Shutdown complete');
    process.exit(0);
  }, 5000);
};

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection:', { reason, promise });
});

// Start the server
startServer();
