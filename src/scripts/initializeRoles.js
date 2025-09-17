const mongoose = require('mongoose');
require('dotenv').config();

const Role = require('../models/Role');
const logger = require('../config/logger');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/node-ai-integration');
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

const initializeRoles = async () => {
  try {
    await connectDB();
    
    logger.info('Initializing default roles...');
    await Role.initializeDefaultRoles();
    
    const roles = await Role.find({});
    logger.info('Current roles in database:');
    roles.forEach(role => {
      logger.info(`- ${role.name}: ${role.description}`);
    });
    
    logger.info('Role initialization completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error initializing roles:', error.message);
    process.exit(1);
  }
};

// Run the initialization
initializeRoles();
