module.exports = {
  secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
  expiration: process.env.JWT_EXPIRATION || '24h',
  algorithm: 'HS256',
  issuer: 'astracloud-vps-panel'
};
