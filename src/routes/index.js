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
        'POST /api/users': 'Create a new user',
        'GET /api/users': 'Get all users (with pagination, search, filtering)',
        'GET /api/users/:id': 'Get user by ID',
        'PUT /api/users/:id': 'Update user by ID',
        'DELETE /api/users/:id': 'Delete user by ID',
        'GET /api/users/ai/status': 'Get AI service status'
      }
    },
    features: [
      'AI-powered bio generation using OpenAI/HuggingFace',
      'MongoDB integration with Mongoose',
      'Advanced Express middleware',
      'Input validation and sanitization',
      'Error handling and logging',
      'Rate limiting and security',
      'Pagination and search functionality'
    ]
  });
});

module.exports = router;