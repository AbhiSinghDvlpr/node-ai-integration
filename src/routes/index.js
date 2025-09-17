const express = require('express');
const router = express.Router();

// Import route modules
const userRoutes = require('./userRoutes');

// API Routes
router.use('/users', userRoutes);

// API Documentation route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Node.js AI Integration API',
    version: '1.0.0',
    endpoints: {
      users: {
        'POST /api/users': 'Create a new user with AI-generated bio',
        'POST /api/users/list': 'Get all users with advanced filtering, pagination, and search',
        'GET /api/users/:id': 'Get user by ID',
        'PUT /api/users/:id': 'Update user by ID (regenerates bio if role changes)',
        'DELETE /api/users/:id': 'Delete user by ID',
        'GET /api/users/status-options': 'Get available user status options'
      },
      roles: {
        'GET /api/users/roles': 'Get all active roles',
        'POST /api/users/roles': 'Create a new role (spaces automatically converted to underscores)'
      },
      ai: {
        'GET /api/users/ai/status': 'Get AI service status (OpenAI and Gemini)',
        'POST /api/users/ai/test-bio': 'Test AI bio generation with fallback support'
      }
    },
    features: [
      'AI-powered bio generation with OpenAI and Gemini fallback',
      'Intelligent role name processing (spaces to underscores)',
      'MongoDB integration with Mongoose ODM',
      'Advanced Express middleware stack',
      'Comprehensive input validation and sanitization',
      'Structured error handling and logging',
      'Rate limiting and security middleware',
      'Advanced pagination, search, and filtering',
      'Automatic bio regeneration on role updates',
      'Dual AI service support with failover mechanism'
    ]
  });
});

module.exports = router;