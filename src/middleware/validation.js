const { body, param, validationResult } = require('express-validator');

// Validation rules for user creation
const validateUserCreation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isMongoId()
    .withMessage('Role must be a valid role ID'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1500 })
    .withMessage('Bio cannot exceed 1500 characters')
];

// Validation rules for user update
const validateUserUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID format'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('role')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Role must be a valid role ID'),

  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE'])
    .withMessage('Status must be either ACTIVE or INACTIVE'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1500 })
    .withMessage('Bio cannot exceed 1500 characters')
];

// Validation rule for user ID parameter
const validateUserId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID format')
];

// Validation rules for get all users request body
const validateGetAllUsers = [
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  body('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Page size must be between 1 and 100'),

  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE'])
    .withMessage('Status must be either ACTIVE or INACTIVE'),

  body('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term cannot exceed 100 characters'),

  body('sortBy')
    .optional()
    .isIn(['name', 'email', 'role', 'status', 'createdAt', 'updatedAt'])
    .withMessage('Sort by must be one of: name, email, role, status, createdAt, updatedAt'),

  body('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc')
];

// Middleware to handle validation errors
// Validation rules for role creation
const validateRoleCreation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Role name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Role name must be between 2 and 50 characters')
    .matches(/^[A-Z\s_]+$/)
    .withMessage('Role name can only contain uppercase letters, spaces, and underscores'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages
    });
  }
  
  next();
};

module.exports = {
  validateUserCreation,
  validateUserUpdate,
  validateUserId,
  validateGetAllUsers,
  validateRoleCreation,
  handleValidationErrors
};