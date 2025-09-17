const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require("cors");
require('dotenv').config();

const connectDB = require('./config/database');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const { requestLogger, errorRequestLogger } = require('./middleware/requestLogger');
const { apiLimiter } = require('./middleware/rateLimiter');

const apiRoutes = require('./routes/index');
const app = express();


connectDB();

app.use(helmet());

// Rate limiting
app.use(cors());

app.use('/api', apiLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(compression());

app.use(requestLogger);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: 'connected'
  });
});

// API routes
app.use('/api', apiRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.send("CORS enabled backend!");
});


// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error request logger
app.use(errorRequestLogger);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app;
