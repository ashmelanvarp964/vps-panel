const { query, transaction } = require('../config/database');

const vpsModel = {
  // Find VPS by ID
  findById: async (id) => {
    const vps = await query(
      `SELECT v.*, u.username as assigned_username,
        m.cpu_usage_percent, m.ram_usage_percent, m.disk_usage_percent,
        m.network_in_bytes, m.network_out_bytes, m.overload_count
      FROM vps_instances v
      LEFT JOIN users u ON v.user_id = u.id
      LEFT JOIN vps_monitoring m ON v.id = m.vps_id
      WHERE v.id = ?`,
      [id]
    );
    return vps[0] || null;
  },

  // Find VPS by VMID
  findByVmid: async (vmid) => {
    const vps = await query(
      'SELECT * FROM vps_instances WHERE vmid = ?',
      [vmid]
    );
    return vps[0] || null;
  },

  // Get all VPS (for admin)
  findAll: async () => {
    return query(
      `SELECT v.*, u.username as assigned_username,
        m.cpu_usage_percent, m.ram_usage_percent, m.disk_usage_percent
      FROM vps_instances v
      LEFT JOIN users u ON v.user_id = u.id
      LEFT JOIN vps_monitoring m ON v.id = m.vps_id
      ORDER BY v.created_at DESC`
    );
  },

  // Get VPS by user ID
  findByUserId: async (userId) => {
    return query(
      `SELECT v.*, 
        m.cpu_usage_percent, m.ram_usage_percent, m.disk_usage_percent
      FROM vps_instances v
      LEFT JOIN vps_monitoring m ON v.id = m.vps_id
      WHERE v.user_id = ?
      ORDER BY v.created_at DESC`,
      [userId]
    );
  },

  // Create new VPS
  create: async (vpsData) => {
    const {
      vmid, name, user_id, ram_mb, cpu_cores, disk_gb,
      ip_address, is_private_ip, ssh_port, proxmox_node,
      status = 'stopped', expiry_date
    } = vpsData;

    const result = await query(
      `INSERT INTO vps_instances 
        (vmid, name, user_id, ram_mb, cpu_cores, disk_gb, ip_address, 
         is_private_ip, ssh_port, proxmox_node, status, expiry_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [vmid, name, user_id, ram_mb, cpu_cores, disk_gb, ip_address,
       is_private_ip || false, ssh_port, proxmox_node, status, expiry_date]
    );

    // Create monitoring record
    await query(
      'INSERT INTO vps_monitoring (vps_id) VALUES (?)',
      [result.insertId]
    );

    return {
      id: result.insertId,
      vmid,
      name,
      status
    };
  },

  // Update VPS
  update: async (id, updates) => {
    const allowedFields = [
      'name', 'user_id', 'status', 'expiry_date', 
      'override_suspension', 'suspension_reason', 'ssh_port'
    ];
    
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return;

    values.push(id);
    await query(
      `UPDATE vps_instances SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Update VPS status
  updateStatus: async (id, status, reason = null) => {
    await query(
      'UPDATE vps_instances SET status = ?, suspension_reason = ? WHERE id = ?',
      [status, reason, id]
    );
  },

  // Assign VPS to user
  assignToUser: async (id, userId) => {
    await query(
      'UPDATE vps_instances SET user_id = ? WHERE id = ?',
      [userId, id]
    );
  },

  // Set expiry date
  setExpiry: async (id, expiryDate) => {
    await query(
      'UPDATE vps_instances SET expiry_date = ? WHERE id = ?',
      [expiryDate, id]
    );
  },

  // Set override suspension
  setOverride: async (id, override) => {
    await query(
      'UPDATE vps_instances SET override_suspension = ? WHERE id = ?',
      [override, id]
    );
  },

  // Delete VPS
  delete: async (id) => {
    // Monitoring record will be deleted via CASCADE
    await query('DELETE FROM vps_instances WHERE id = ?', [id]);
  },

  // Get expired VPS
  findExpired: async () => {
    return query(
      `SELECT * FROM vps_instances 
      WHERE expiry_date <= CURDATE() 
      AND status != 'expired' 
      AND override_suspension = FALSE`
    );
  },

  // Get overloaded VPS
  findOverloaded: async () => {
    return query(
      `SELECT v.*, m.overload_count
      FROM vps_instances v
      JOIN vps_monitoring m ON v.id = m.vps_id
      WHERE m.overload_count >= 3
      AND v.status = 'running'
      AND v.override_suspension = FALSE`
    );
  },

  // Update monitoring data
  updateMonitoring: async (vpsId, data) => {
    const { cpu, ram, disk, networkIn, networkOut, overloadCount } = data;
    
    await query(
      `UPDATE vps_monitoring 
      SET cpu_usage_percent = ?, ram_usage_percent = ?, disk_usage_percent = ?,
          network_in_bytes = ?, network_out_bytes = ?, overload_count = ?,
          last_check = NOW()
      WHERE vps_id = ?`,
      [cpu, ram, disk, networkIn || 0, networkOut || 0, overloadCount || 0, vpsId]
    );
  },

  // Get monitoring data
  getMonitoring: async (vpsId) => {
    const result = await query(
      'SELECT * FROM vps_monitoring WHERE vps_id = ?',
      [vpsId]
    );
    return result[0] || null;
  },

  // Increment overload count
  incrementOverloadCount: async (vpsId) => {
    await query(
      'UPDATE vps_monitoring SET overload_count = overload_count + 1 WHERE vps_id = ?',
      [vpsId]
    );
  },

  // Reset overload count
  resetOverloadCount: async (vpsId) => {
    await query(
      'UPDATE vps_monitoring SET overload_count = 0 WHERE vps_id = ?',
      [vpsId]
    );
  },

  // Check if IP exists
  ipExists: async (ipAddress) => {
    const result = await query(
      'SELECT id FROM vps_instances WHERE ip_address = ?',
      [ipAddress]
    );
    return result.length > 0;
  },

  // Check if VMID exists
  vmidExists: async (vmid) => {
    const result = await query(
      'SELECT id FROM vps_instances WHERE vmid = ?',
      [vmid]
    );
    return result.length > 0;
  }
};

module.exports = vpsModel;
