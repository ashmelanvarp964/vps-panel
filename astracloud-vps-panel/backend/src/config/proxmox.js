const axios = require('axios');
const https = require('https');
const logger = require('../utils/logger');

// Create axios instance for Proxmox API
const createProxmoxClient = () => {
  const baseURL = process.env.PROXMOX_HOST || 'https://localhost:8006';
  
  const client = axios.create({
    baseURL: `${baseURL}/api2/json`,
    httpsAgent: new https.Agent({
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }),
    timeout: 30000
  });

  // Add authentication header
  const tokenId = process.env.PROXMOX_TOKEN_ID;
  const tokenSecret = process.env.PROXMOX_TOKEN_SECRET;
  const user = process.env.PROXMOX_USER;

  if (tokenId && tokenSecret) {
    client.defaults.headers.common['Authorization'] = `PVEAPIToken=${user}!${tokenId}=${tokenSecret}`;
  }

  // Response interceptor for logging
  client.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      logger.error('Proxmox API error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.response?.data?.errors || error.message
      });
      return Promise.reject(error);
    }
  );

  return client;
};

const proxmoxClient = createProxmoxClient();

// Test Proxmox connection
const testConnection = async () => {
  try {
    const response = await proxmoxClient.get('/version');
    logger.info('Proxmox connection established:', { version: response.data?.data?.version });
    return true;
  } catch (error) {
    logger.error('Proxmox connection failed:', error.message);
    return false;
  }
};

module.exports = {
  client: proxmoxClient,
  testConnection,
  defaultNode: process.env.PROXMOX_NODE || 'pve'
};
