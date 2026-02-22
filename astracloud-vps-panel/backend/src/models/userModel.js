const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');

const userModel = {
  // Find user by ID
  findById: async (id) => {
    const users = await query(
      'SELECT id, username, email, role, created_at, last_login FROM users WHERE id = ?',
      [id]
    );
    return users[0] || null;
  },

  // Find user by username
  findByUsername: async (username) => {
    const users = await query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return users[0] || null;
  },

  // Find user by email
  findByEmail: async (email) => {
    const users = await query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return users[0] || null;
  },

  // Find user by username or email
  findByLogin: async (login) => {
    const users = await query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [login, login]
    );
    return users[0] || null;
  },

  // Get total user count
  getCount: async () => {
    const result = await query('SELECT COUNT(*) as count FROM users');
    return result[0].count;
  },

  // Create new user
  create: async (userData) => {
    const { username, email, password, role = 'user' } = userData;
    
    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const result = await query(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, password_hash, role]
    );

    return {
      id: result.insertId,
      username,
      email,
      role
    };
  },

  // Verify password
  verifyPassword: async (plainPassword, hashedPassword) => {
    return bcrypt.compare(plainPassword, hashedPassword);
  },

  // Update last login
  updateLastLogin: async (id) => {
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [id]
    );
  },

  // Get all users (for admin)
  findAll: async () => {
    return query(
      'SELECT id, username, email, role, created_at, last_login FROM users ORDER BY created_at DESC'
    );
  },

  // Check if username exists
  usernameExists: async (username) => {
    const result = await query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    return result.length > 0;
  },

  // Check if email exists
  emailExists: async (email) => {
    const result = await query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    return result.length > 0;
  },

  // Update user role
  updateRole: async (id, role) => {
    await query(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, id]
    );
  },

  // Delete user
  delete: async (id) => {
    await query('DELETE FROM users WHERE id = ?', [id]);
  }
};

module.exports = userModel;
