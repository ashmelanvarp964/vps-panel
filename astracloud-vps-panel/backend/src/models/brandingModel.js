const { query } = require('../config/database');

const brandingModel = {
  // Get branding (always returns single row with id=1)
  get: async () => {
    const result = await query('SELECT * FROM branding WHERE id = 1');
    
    // If no branding exists, create default
    if (result.length === 0) {
      await query(
        `INSERT INTO branding (id, panel_name, primary_color, secondary_color)
         VALUES (1, 'AstraCloud', '#6366f1', '#8b5cf6')`
      );
      return {
        id: 1,
        panel_name: 'AstraCloud',
        logo_url: null,
        primary_color: '#6366f1',
        secondary_color: '#8b5cf6'
      };
    }
    
    return result[0];
  },

  // Update branding
  update: async (updates) => {
    const allowedFields = ['panel_name', 'logo_url', 'primary_color', 'secondary_color'];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return null;

    await query(
      `UPDATE branding SET ${fields.join(', ')} WHERE id = 1`,
      values
    );

    return brandingModel.get();
  }
};

module.exports = brandingModel;
