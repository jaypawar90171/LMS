const { body, param } = require('express-validator');
const { validate } = require('./validation.middleware');

// Fine ID validation
exports.fineIdValidation = [
  param('fineId')
    .isMongoId()
    .withMessage('Invalid fine ID format'),
  
  validate
];

// User ID validation
exports.userIdValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  validate
];

// Create fine validation
exports.createFineValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  body('itemId')
    .optional()
    .isMongoId()
    .withMessage('Invalid item ID format'),
  
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isIn(['Overdue', 'Damaged', 'Lost', 'Manual'])
    .withMessage('Reason must be Overdue, Damaged, Lost, or Manual'),
  
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for due date'),
  
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  
  validate
];

// Record payment validation
exports.recordPaymentValidation = [
  param('fineId')
    .isMongoId()
    .withMessage('Invalid fine ID format'),
  
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  
  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['Cash', 'Card', 'Online Transfer'])
    .withMessage('Payment method must be Cash, Card, or Online Transfer'),
  
  body('referenceId')
    .optional()
    .isString()
    .withMessage('Reference ID must be a string')
    .isLength({ max: 50 })
    .withMessage('Reference ID must be less than 50 characters'),
  
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  
  validate
];

// Waive fine validation
exports.waiveFineValidation = [
  param('fineId')
    .isMongoId()
    .withMessage('Invalid fine ID format'),
  
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters'),
  
  validate
];