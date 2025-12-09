const { body, param } = require('express-validator');
const { validate } = require('./validation.middleware');

// Add item request validation
exports.addItemRequestValidation = [
  body('itemName')
    .notEmpty()
    .withMessage('Item name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Item name must be between 3 and 100 characters'),
  
  body('itemDescription')
    .notEmpty()
    .withMessage('Item description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Item description must be between 10 and 500 characters'),
  
  body('itemImage')
    .notEmpty()
    .withMessage('Item image is required')
    .isURL()
    .withMessage('Item image must be a valid URL'),
  
  body('categoryId')
    .notEmpty()
    .withMessage('Category is required')
    .isMongoId()
    .withMessage('Invalid category ID format'),
  
  body('condition')
    .notEmpty()
    .withMessage('Item condition is required')
    .isIn(['New', 'Like New', 'Good', 'Fair', 'Poor'])
    .withMessage('Invalid condition value'),
  
  body('availableFrom')
    .notEmpty()
    .withMessage('Available from date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('availableUntil')
    .notEmpty()
    .withMessage('Available until date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  
  validate
];

// Request item validation
exports.requestItemValidation = [
  body('requestedItemName')
    .notEmpty()
    .withMessage('Requested item name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Requested item name must be between 3 and 100 characters'),
  
  body('requestedItemDescription')
    .notEmpty()
    .withMessage('Requested item description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Requested item description must be between 10 and 500 characters'),
  
  body('requestedCategoryId')
    .notEmpty()
    .withMessage('Category is required')
    .isMongoId()
    .withMessage('Invalid category ID format'),
  
  body('urgency')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Invalid urgency value'),
  
  body('neededBy')
    .notEmpty()
    .withMessage('Needed by date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  
  validate
];

// Review request validation
exports.reviewRequestValidation = [
  param('requestId')
    .isMongoId()
    .withMessage('Invalid request ID format'),
  
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['Approved', 'Rejected'])
    .withMessage('Status must be Approved or Rejected'),
  
  body('adminNotes')
    .optional()
    .isString()
    .withMessage('Admin notes must be a string'),
  
  validate
];