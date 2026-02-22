const Joi = require('joi');

// Validation schemas
const schemas = {
  // Auth schemas
  register: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(50)
      .required()
      .messages({
        'string.alphanum': 'Username can only contain letters and numbers',
        'string.min': 'Username must be at least 3 characters',
        'string.max': 'Username cannot exceed 50 characters'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      })
  }),

  login: Joi.object({
    login: Joi.string().required().messages({
      'any.required': 'Username or email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),

  // VPS schemas
  createVPS: Joi.object({
    vmid: Joi.number().integer().min(100).max(999999999).required(),
    name: Joi.string().min(1).max(100).required(),
    ram_mb: Joi.number().integer().min(128).required(),
    cpu_cores: Joi.number().integer().min(1).max(128).required(),
    disk_gb: Joi.number().integer().min(1).required(),
    ip_address: Joi.string().ip().required(),
    proxmox_node: Joi.string().max(50).required(),
    user_id: Joi.number().integer().allow(null),
    expiry_date: Joi.date().allow(null)
  }),

  updateVPS: Joi.object({
    name: Joi.string().min(1).max(100),
    user_id: Joi.number().integer().allow(null),
    expiry_date: Joi.date().allow(null),
    override_suspension: Joi.boolean()
  }),

  assignVPS: Joi.object({
    user_id: Joi.number().integer().required()
  }),

  setExpiry: Joi.object({
    expiry_date: Joi.date().required()
  }),

  setOverride: Joi.object({
    override_suspension: Joi.boolean().required()
  }),

  // Branding schemas
  updateBranding: Joi.object({
    panel_name: Joi.string().min(1).max(100),
    logo_url: Joi.string().uri().allow(null, ''),
    primary_color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
    secondary_color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/)
  }),

  // ID parameter
  idParam: Joi.object({
    id: Joi.number().integer().positive().required()
  })
};

// Validation middleware factory
const validate = (schemaName, property = 'body') => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      return res.status(500).json({
        error: 'Validation Error',
        message: `Unknown schema: ${schemaName}`
      });
    }

    const dataToValidate = property === 'params' ? req.params : req.body;
    const { error, value } = schema.validate(dataToValidate, { 
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details
      });
    }

    // Replace with validated and sanitized data
    if (property === 'params') {
      req.params = value;
    } else {
      req.body = value;
    }

    next();
  };
};

module.exports = { validate, schemas };
