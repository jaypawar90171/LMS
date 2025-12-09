const { body, param, query } = require('express-validator');
const { validate } = require('./validation.middleware');

// Issue item validation
exports.issueItemValidation = [
  body('itemId')
    .notEmpty()
    .withMessage('Item ID is required')
    .isMongoId()
    .withMessage('Invalid item ID format'),
  
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for due date')
    .custom(value => {
      const dueDate = new Date(value);
      const today = new Date();
      return dueDate > today;
    })
    .withMessage('Due date must be in the future'),
  
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  
  validate
];

// Return item validation
exports.returnItemValidation = [
  body('itemId')
    .notEmpty()
    .withMessage('Item ID is required')
    .isMongoId()
    .withMessage('Invalid item ID format'),
  
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('condition')
    .optional()
    .isIn(['Good', 'Damaged', 'Lost'])
    .withMessage('Condition must be Good, Damaged, or Lost'),
  
  body('isDamaged')
    .optional()
    .isBoolean()
    .withMessage('isDamaged must be a boolean'),
  
  body('isLost')
    .optional()
    .isBoolean()
    .withMessage('isLost must be a boolean'),
  
  body('damageDetails')
    .optional()
    .isString()
    .withMessage('Damage details must be a string')
    .isLength({ max: 500 })
    .withMessage('Damage details must be less than 500 characters'),
  
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  
  validate
];

// Extend due date validation
exports.extendDueDateValidation = [
  body('itemId')
    .notEmpty()
    .withMessage('Item ID is required')
    .isMongoId()
    .withMessage('Invalid item ID format'),
  
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('newDueDate')
    .notEmpty()
    .withMessage('New due date is required')
    .isISO8601()
    .withMessage('Invalid date format for new due date')
    .custom(value => {
      const dueDate = new Date(value);
      const today = new Date();
      return dueDate > today;
    })
    .withMessage('New due date must be in the future'),
  
  body('reason')
    .optional()
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters'),
  
  validate
];

// Request ID validation
exports.requestIdValidation = [
  param('requestId')
    .isMongoId()
    .withMessage('Invalid request ID format'),
  
  validate
];

// Update request status validation
exports.updateRequestStatusValidation = [
  param('requestId')
    .isMongoId()
    .withMessage('Invalid request ID format'),
  
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['Approved', 'Rejected'])
    .withMessage('Status must be Approved or Rejected'),
  
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  
  validate
];

// Add to queue validation
exports.addToQueueValidation = [
  body('itemId')
    .notEmpty()
    .withMessage('Item ID is required')
    .isMongoId()
    .withMessage('Invalid item ID format'),
  
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('priority')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Priority must be between 0 and 10'),
  
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  
  validate
];

// Remove from queue validation
exports.removeFromQueueValidation = [
  param('itemId')
    .isMongoId()
    .withMessage('Invalid item ID format'),
  
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  query('reason')
    .optional()
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters'),
  
  validate
];

// Allocate item validation
exports.allocateItemValidation = [
  param('itemId')
    .isMongoId()
    .withMessage('Invalid item ID format'),
  
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
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