const { body, param } = require('express-validator');
const { validate } = require('./validation.middleware');

// Role ID validation
exports.roleIdValidation = [
  param('roleId')
    .isMongoId()
    .withMessage('Invalid role ID format'),
  validate
];

// Create role validation
exports.createRoleValidation = [
  body('name')
    .notEmpty()
    .withMessage('Role name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Role name must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-]+$/)
    .withMessage('Role name can only contain alphanumeric characters, spaces, and hyphens'),
  
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  
  body('permissions')
    .notEmpty()
    .withMessage('Permissions are required')
    .isArray()
    .withMessage('Permissions must be an array')
    .custom(value => {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error('At least one permission must be selected');
      }
      return true;
    }),
  
  body('permissions.*')
    .isString()
    .withMessage('Each permission must be a string'),
  
  validate
];

// Compare roles validation
exports.compareRolesValidation = [
  body('roleIds')
    .notEmpty()
    .withMessage('Role IDs are required')
    .isArray({ min: 2 })
    .withMessage('At least two role IDs are required for comparison'),
  
  body('roleIds.*')
    .isMongoId()
    .withMessage('Invalid role ID format'),
  
  validate
];

// Clone role validation
exports.cloneRoleValidation = [
  body('sourceRoleId')
    .notEmpty()
    .withMessage('Source role ID is required')
    .isMongoId()
    .withMessage('Invalid source role ID format'),
  
  body('name')
    .notEmpty()
    .withMessage('Role name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Role name must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-]+$/)
    .withMessage('Role name can only contain alphanumeric characters, spaces, and hyphens'),
  
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  
  validate
];

// Update role validation
exports.updateRoleValidation = [
  param('roleId')
    .isMongoId()
    .withMessage('Invalid role ID format'),
  
  body('name')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Role name must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-]+$/)
    .withMessage('Role name can only contain alphanumeric characters, spaces, and hyphens'),
  
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array')
    .custom(value => {
      if (value && (!Array.isArray(value) || value.length === 0)) {
        throw new Error('At least one permission must be selected');
      }
      return true;
    }),
  
  body('permissions.*')
    .isString()
    .withMessage('Each permission must be a string'),
  
  validate
];