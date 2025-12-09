const { body, param } = require('express-validator');
const { validate } = require('./validation.middleware');

// User ID validation
exports.userIdValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  validate
];

// Create user validation
exports.createUserValidation = [
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Full name must be between 3 and 100 characters')
    .matches(/^[a-zA-Z0-9\s.\-']+$/)
    .withMessage('Full name can only contain alphanumeric characters, spaces, and common special characters (., -, \')'),
  
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),
  
  body('employeeId')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Employee ID must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9\-]+$/)
    .withMessage('Employee ID can only contain alphanumeric characters and hyphens'),
  
  body('phoneNumber')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Invalid phone number format'),
  
  body('dateOfBirth')
    .optional()
    .isDate()
    .withMessage('Invalid date format for date of birth'),
  
  body('roles')
    .optional()
    .isArray()
    .withMessage('Roles must be an array'),
  
  body('roles.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid role ID format'),
  
  // Custom validation for unique email and phone
  async (req, res, next) => {
    const User = require('../models/user.model');
    const { email, phoneNumber } = req.body;
    
    try {
      // Check for existing email
      if (email) {
        const existingEmailUser = await User.findOne({ email });
        if (existingEmailUser) {
          return res.status(400).json({
            success: false,
            message: 'Email already exists',
            errors: [{ path: 'email', msg: 'Email already exists' }]
          });
        }
      }
      
      // Check for existing phone number
      if (phoneNumber) {
        const existingPhoneUser = await User.findOne({ phoneNumber });
        if (existingPhoneUser) {
          return res.status(400).json({
            success: false,
            message: 'Phone number already exists',
            errors: [{ path: 'phoneNumber', msg: 'Phone number already exists' }]
          });
        }
      }
      
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error validating user data'
      });
    }
  },
  
  validate
];

// Update user validation
exports.updateUserValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('fullName')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Full name must be between 3 and 100 characters')
    .matches(/^[a-zA-Z0-9\s.\-']+$/)
    .withMessage('Full name can only contain alphanumeric characters, spaces, and common special characters (., -, \')'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  
  body('employeeId')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Employee ID must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9\-]+$/)
    .withMessage('Employee ID can only contain alphanumeric characters and hyphens'),
  
  body('phoneNumber')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Invalid phone number format'),
  
  body('dateOfBirth')
    .optional()
    .isDate()
    .withMessage('Invalid date format for date of birth'),
  
  body('relationshipType')
    .optional()
    .isIn(['Employee', 'Family Member'])
    .withMessage('Relationship type must be either Employee or Family Member'),
  
  body('employeeReference')
    .optional()
    .isMongoId()
    .withMessage('Invalid employee reference ID format'),
  
  body('roles')
    .optional()
    .isArray()
    .withMessage('Roles must be an array'),
  
  body('roles.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid role ID format'),
  
  validate
];

// Update user status validation
exports.updateUserStatusValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be either Active or Inactive'),
  
  validate
];

// Reject user validation
exports.rejectUserValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('reason')
    .optional()
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters'),
  
  validate
];