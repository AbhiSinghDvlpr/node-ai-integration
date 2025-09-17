const express = require('express');
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAIStatus,
  testAIBio,
  getUserStatusOptions,
  getAllRoles,
  createRole
} = require('../controllers/userController');

const {
  validateUserCreation,
  validateUserUpdate,
  validateUserId,
  validateGetAllUsers,
  validateRoleCreation,
  handleValidationErrors
} = require('../middleware/validation');

const { createUserLimiter, aiServiceLimiter } = require('../middleware/rateLimiter');

// AI Service Routes
router.get('/ai/status', aiServiceLimiter, getAIStatus);
router.post('/ai/test-bio', aiServiceLimiter, testAIBio);

router.get('/status-options', getUserStatusOptions);

router.route('/roles')
  .get(getAllRoles)
  .post(validateRoleCreation, handleValidationErrors, createRole);

// User CRUD Routes
router.route('/')
  .post(createUserLimiter, validateUserCreation, handleValidationErrors, createUser);

router.post('/list', validateGetAllUsers, handleValidationErrors, getAllUsers);

router.route('/:id')
  .get(validateUserId, handleValidationErrors, getUserById)
  .put(validateUserId, validateUserUpdate, handleValidationErrors, updateUser)
  .delete(validateUserId, handleValidationErrors, deleteUser);

module.exports = router;
