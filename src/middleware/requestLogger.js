const logger = require('../config/logger');

/**
 * Custom request logging middleware
 * Logs detailed information about incoming requests
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request details
  const requestInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    body: req.method === 'POST' || req.method === 'PUT' ? 
      JSON.stringify(req.body).substring(0, 500) : undefined // Limit body log size
  };

  logger.info('Incoming request', requestInfo);

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Log response details
    const responseInfo = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      success: data?.success !== undefined ? data.success : res.statusCode < 400
    };

    if (res.statusCode >= 400) {
      logger.error('Request failed', responseInfo);
    } else {
      logger.info('Request completed', responseInfo);
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Error request logger
 * Logs requests that result in errors
 */
const errorRequestLogger = (err, req, res, next) => {
  const errorInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  };

  logger.error('Request error', errorInfo);
  next(err);
};

module.exports = {
  requestLogger,
  errorRequestLogger
};