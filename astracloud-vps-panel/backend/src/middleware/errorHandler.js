const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });

  // Determine status code
  let statusCode = err.statusCode || err.status || 500;
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
  } else if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    err.message = 'A record with this information already exists';
  }

  // Don't leak error details in production
  const response = {
    error: err.name || 'Error',
    message: process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected error occurred'
      : err.message || 'An unexpected error occurred'
  };

  // Include validation details if available
  if (err.details) {
    response.details = err.details;
  }

  res.status(statusCode).json(response);
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
};

// Async wrapper to catch errors in async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, notFoundHandler, asyncHandler };
