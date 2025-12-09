const { body, param } = require('express-validator');
const { validate } = require('./validation.middleware');

// Assign roles to users validation
exports.assignRolesToUsersValidation = [
  body('roleId')
    .notEmpty()
    .withMessage('Role ID is required')
    .isMongoId()
    .withMessage('Invalid role ID format'),
  
  body('userIds')
    .notEmpty()
    .withMessage('User IDs are required')
    .isArray()
    .withMessage('User IDs must be an array')
    .notEmpty()
    .withMessage('User IDs array cannot be empty'),
  
  body('userIds.*')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  validate
];

// Remove roles from users validation
exports.removeRolesFromUsersValidation = [
  body('roleId')
    .notEmpty()
    .withMessage('Role ID is required')
    .isMongoId()
    .withMessage('Invalid role ID format'),
  
  body('userIds')
    .notEmpty()
    .withMessage('User IDs are required')
    .isArray()
    .withMessage('User IDs must be an array')
    .notEmpty()
    .withMessage('User IDs array cannot be empty'),
  
  body('userIds.*')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  validate
];

// Get users by role validation
exports.getUsersByRoleValidation = [
  param('roleId')
    .isMongoId()
    .withMessage('Invalid role ID format'),
  
  validate
];