const { body, param } = require('express-validator');
const { validate } = require('./validation.middleware');

// Category ID validation
exports.categoryIdValidation = [
  param('categoryId')
    .isMongoId()
    .withMessage('Invalid category ID format'),
  validate
];

// Create category validation
exports.createCategoryValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  
  body('parentCategoryId')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent category ID format'),
  
  body('defaultReturnPeriod')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Default return period must be at least 1 day'),
  
  validate
];

// Update category validation
exports.updateCategoryValidation = [
  param('categoryId')
    .isMongoId()
    .withMessage('Invalid category ID format'),
  
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  
  body('defaultReturnPeriod')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Default return period must be at least 1 day'),
  
  validate
];