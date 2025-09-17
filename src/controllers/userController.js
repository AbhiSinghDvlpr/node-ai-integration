const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const aiService = require('../services/aiService');
const logger = require('../config/logger');

/**
 * @desc    Create a new user
 * @route   POST /api/users
 * @access  Public
 */
const createUser = async (req, res, next) => {
  try {
    logger.info('=== Starting user creation process ===');
    const { name, email, role } = req.body;
    
    logger.info(`Request data received:`, {
      name: name,
      email: email,
      roleId: role,
      requestBody: req.body
    });

    // Enhanced email validation
    logger.info('Starting comprehensive email validation...');
    
    // Check if email is provided
    if (!email || email.trim() === '') {
      logger.error('Email validation failed: Email is required but not provided');
      return res.status(400).json({
        success: false,
        error: 'Email is required and cannot be empty'
      });
    }

    // Normalize email (trim and lowercase)
    const normalizedEmail = email.trim().toLowerCase();
    logger.info(`Email normalized: "${email}" -> "${normalizedEmail}"`);

    // Enhanced email format validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(normalizedEmail)) {
      logger.error(`Email validation failed: Invalid email format - ${normalizedEmail}`);
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address format'
      });
    }

    // Check email length constraints
    if (normalizedEmail.length > 254) {
      logger.error(`Email validation failed: Email too long (${normalizedEmail.length} characters, max 254)`);
      return res.status(400).json({
        success: false,
        error: 'Email address is too long (maximum 254 characters)'
      });
    }

    logger.info(`✓ Email format validation passed for: ${normalizedEmail}`);

    // Enhanced unique email check with case-insensitive search
    logger.info(`Checking email uniqueness for: ${normalizedEmail}`);
    const existingUser = await User.findOne({ 
      email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    
    if (existingUser) {
      logger.warn(`User creation failed: Email already exists in database`, {
        requestedEmail: normalizedEmail,
        existingEmail: existingUser.email,
        existingUserId: existingUser._id,
        existingUserName: existingUser.name
      });
      return res.status(409).json({
        success: false,
        error: 'A user with this email address already exists',
        details: {
          conflictField: 'email',
          conflictValue: normalizedEmail
        }
      });
    }
    
    logger.info(`✓ Email uniqueness verified: ${normalizedEmail} is available for new user`);

    // Validate and fetch role information
    logger.info(`Validating role ID: ${role}`);
    const roleInfo = await Role.findById(role);
    
    if (!roleInfo) {
      logger.error(`Role validation failed: Invalid role ID provided - ${role}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid role ID provided'
      });
    }
    
    logger.info(`✓ Role validated successfully:`, {
      roleId: roleInfo._id,
      roleName: roleInfo.name,
      roleDescription: roleInfo.description,
      roleStatus: roleInfo.status
    });

    // Generate AI bio
    logger.info(`Starting AI bio generation for user: ${name} with role: ${roleInfo.name}`);
    const bioStartTime = Date.now();
    
    try {
      const bio = await aiService.generateBio(name, roleInfo.name);
      const bioEndTime = Date.now();
      
      logger.info(`✓ AI bio generated successfully in ${bioEndTime - bioStartTime}ms:`, {
        bioLength: bio ? bio.length : 0,
        bioPreview: bio ? bio.substring(0, 100) + '...' : 'No bio generated'
      });

      // Create user in database
      logger.info(`Creating user in database with data:`, {
        name: name,
        email: normalizedEmail,
        roleId: roleInfo._id,
        roleName: roleInfo.name,
        bioLength: bio ? bio.length : 0
      });

      const userCreationStartTime = Date.now();
      const user = await User.create({
        name,
        email: normalizedEmail, // Use normalized email
        role: roleInfo._id, // Use ObjectId instead of name
        bio
      });
      const userCreationEndTime = Date.now();

      logger.info(`✓ User created in database successfully in ${userCreationEndTime - userCreationStartTime}ms:`, {
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        userStatus: user.status,
        createdAt: user.createdAt
      });

      // Populate role information for response
      logger.info(`Populating role information for response...`);
      await user.populate('role', 'name description');
      
      logger.info(`✓ Role information populated:`, {
        populatedRole: user.role
      });

      const publicProfile = user.getPublicProfile();
      logger.info(`✓ Public profile generated:`, {
        profileKeys: Object.keys(publicProfile),
        hasRole: !!publicProfile.role,
        hasBio: !!publicProfile.bio
      });

      logger.info(`=== User creation completed successfully ===`, {
        userId: user._id,
        totalProcessingTime: Date.now() - bioStartTime,
        success: true
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: publicProfile
      });

    } catch (bioError) {
      logger.error(`AI bio generation failed:`, {
        error: bioError.message,
        stack: bioError.stack,
        userName: name,
        roleName: roleInfo.name
      });
      throw bioError; // Re-throw to be caught by outer catch block
    }

  } catch (error) {
    logger.error('=== User creation process failed ===', {
      error: error.message,
      stack: error.stack,
      requestData: req.body,
      timestamp: new Date().toISOString()
    });
    next(error);
  }
};

/**
 * @desc    Get all users
 * @route   POST /api/users/list
 * @access  Public
 */
const getAllUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      status,
      search,
      role,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.body;

    logger.info(`Getting users - page: ${page}, pageSize: ${pageSize}, search: "${search}", status: ${status}, role: ${role}`);

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    let pipeline = [];

    // Add lookup for role information
    pipeline.push({
      $lookup: {
        from: 'roles',
        localField: 'role',
        foreignField: '_id',
        as: 'roleInfo'
      }
    });

    // Unwind the role array
    pipeline.push({
      $unwind: '$roleInfo'
    });

    // Build match conditions
    const matchConditions = {};
    
    if (status) {
      matchConditions.status = status;
    }

    if (role) {
      matchConditions['roleInfo.name'] = role;
    }

    if (search) {
      matchConditions.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'roleInfo.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Add match stage if we have conditions
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // Add sorting
    pipeline.push({ $sort: sortOptions });

    // Create pipeline for counting total documents
    const countPipeline = [...pipeline, { $count: 'total' }];

    // Add pagination to main pipeline
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(pageSize) });

    // Add projection to clean up the output
    pipeline.push({
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        status: 1,
        bio: 1,
        createdAt: 1,
        updatedAt: 1,
        role: {
          _id: '$roleInfo._id',
          name: '$roleInfo.name',
          description: '$roleInfo.description'
        }
      }
    });

    // Execute both queries
    const [users, totalResult] = await Promise.all([
      User.aggregate(pipeline),
      User.aggregate(countPipeline)
    ]);

    // Get total count from aggregation result
    const totalUsers = totalResult.length > 0 ? totalResult[0].total : 0;

    // Calculate pagination info
    const totalPages = Math.ceil(totalUsers / parseInt(pageSize));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    logger.info(`Retrieved ${users.length} users (page ${page}) out of ${totalUsers} total`);

    // Transform aggregation results to match expected format
    const transformedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      bio: user.bio,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: transformedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNextPage,
        hasPrevPage,
        pageSize: parseInt(pageSize)
      }
    });

  } catch (error) {
    logger.error('Error retrieving users:', error.message);
    next(error);
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Public
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).populate('role', 'name description').select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    logger.info(`Retrieved user: ${user._id}`);

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user.getPublicProfile()
    });

  } catch (error) {
    logger.error('Error retrieving user:', error.message);
    next(error);
  }
};

/**
 * @desc    Update user by ID
 * @route   PUT /api/users/:id
 * @access  Public
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.__v;
    delete updates.createdAt;

    // If role is being updated, validate and get role info
    let shouldRegenerateBio = false;
    let roleInfo = null;
    if (updates.role) {
      roleInfo = await Role.findById(updates.role);
      if (!roleInfo) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role ID provided'
        });
      }
      shouldRegenerateBio = true;
    }

    const user = await User.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('role', 'name description').select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Regenerate bio if role was updated
    if (shouldRegenerateBio && roleInfo) {
      try {
        logger.info(`Regenerating bio for user: ${user.name} (${roleInfo.name})`);
        const newBio = await aiService.generateBio(user.name, roleInfo.name);
        user.bio = newBio;
        await user.save();
      } catch (bioError) {
        logger.warn('Failed to regenerate bio:', bioError.message);
        // Continue without failing the entire update
      }
    }

    logger.info(`User updated successfully: ${user._id}`);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user.getPublicProfile()
    });

  } catch (error) {
    logger.error('Error updating user:', error.message);
    next(error);
  }
};

/**
 * @desc    Delete user by ID
 * @route   DELETE /api/users/:id
 * @access  Public
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    logger.info(`User deleted successfully: ${id}`);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {
        deletedUser: user.getPublicProfile()
      }
    });

  } catch (error) {
    logger.error('Error deleting user:', error.message);
    next(error);
  }
};

/**
 * @desc    Get AI service status
 * @route   GET /api/users/ai/status
 * @access  Public
 */
const getAIStatus = async (req, res, next) => {
  try {
    const status = aiService.getServiceStatus();

    res.status(200).json({
      success: true,
      message: 'AI service status retrieved',
      data: {
        services: status,
        configured: status.openai || status.huggingface
      }
    });

  } catch (error) {
    logger.error('Error getting AI status:', error.message);
    next(error);
  }
};

const testAIBio = async (req, res, next) => {
  try {
    const { name, role } = req.body;

    if (!name || !role) {
      return res.status(400).json({
        success: false,
        error: 'Name and role are required'
      });
    }

    logger.info(`Testing AI bio generation for: ${name} (${role})`);
    const bio = await aiService.generateBio(name, role);

    res.status(200).json({
      success: true,
      message: 'AI bio generated successfully',
      data: {
        name,
        role,
        bio
      }
    });

  } catch (error) {
    logger.error('Error testing AI bio:', error.message);
    next(error);
  }
};

/**
 * @desc    Get user status options
 * @route   GET /api/users/status-options
 * @access  Public
 */
const getUserStatusOptions = async (req, res, next) => {
  try {
    const statusOptions = ['ACTIVE', 'INACTIVE'];

    res.status(200).json({
      success: true,
      message: 'User status options retrieved successfully',
      data: statusOptions
    });

  } catch (error) {
    logger.error('Error getting user status options:', error.message);
    next(error);
  }
};

/**
 * @desc    Get all roles
 * @route   GET /api/roles
 * @access  Public
 */

const getAllRoles = async (req, res, next) => {
  try {
    const roles = await Role.findActiveRoles();
    console.log(roles, " =====>>>>")

    res.status(200).json({
      success: true,
      message: 'Roles retrieved successfully',
      data: roles.map(role => role.getPublicProfile())
    });

  } catch (error) {
    logger.error('Error getting roles:', error.message);
    next(error);
  }
};

/**
 * @desc    Create a new role
 * @route   POST /api/roles
 * @access  Public
 */
const createRole = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    // Convert spaces to underscores and make uppercase
    const processedName = name.trim().replace(/\s+/g, '_').toUpperCase();

    const existingRole = await Role.findOne({ name: processedName });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role with this name already exists'
      });
    }

    // Create role
    const role = await Role.create({
      name: processedName,
      description: description || ''
    });

    logger.info(`Role created successfully: ${role._id} (${name} -> ${processedName})`);

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: role.getPublicProfile()
    });

  } catch (error) {
    logger.error('Error creating role:', error.message);
    next(error);
  }
};

module.exports = {
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
};
