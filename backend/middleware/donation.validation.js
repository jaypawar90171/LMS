const { body, param, query } = require('express-validator');
const { validate } = require('./validation.middleware');

// Donation ID validation
exports.donationIdValidation = [
  param('donationId')
    .isMongoId()
    .withMessage('Invalid donation ID format'),
  
  validate
];

// Update donation status validation
exports.updateDonationStatusValidation = [
  param('donationId')
    .isMongoId()
    .withMessage('Invalid donation ID format'),
  
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['Pending', 'Accepted', 'Rejected', 'Received', 'Processed'])
    .withMessage('Status must be Pending, Accepted, Rejected, Received, or Processed'),
  
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  
  validate
];

// Process donation validation
exports.processDonationValidation = [
  param('donationId')
    .isMongoId()
    .withMessage('Invalid donation ID format'),
  
  body('title')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('author')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Author must be less than 100 characters'),
  
  body('isbn')
    .optional()
    .isLength({ max: 20 })
    .withMessage('ISBN must be less than 20 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  
  body('publisher')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Publisher must be less than 100 characters'),
  
  body('publicationYear')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() })
    .withMessage(`Publication year must be between 1000 and ${new Date().getFullYear()}`),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('categoryId')
    .notEmpty()
    .withMessage('Category is required')
    .isMongoId()
    .withMessage('Invalid category ID format'),
  
  body('subcategoryId')
    .optional()
    .isMongoId()
    .withMessage('Invalid subcategory ID format'),
  
  validate
];

// Create donation validation
exports.createDonationValidation = [
  body('itemName')
    .notEmpty()
    .withMessage('Item name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Item name must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  
  body('condition')
    .notEmpty()
    .withMessage('Condition is required')
    .isIn(['New', 'Good', 'Fair', 'Poor'])
    .withMessage('Condition must be New, Good, Fair, or Poor'),
  
  body('availableDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for available date'),
  
  body('photos')
    .optional()
    .isArray()
    .withMessage('Photos must be an array'),
  
  body('photos.*.url')
    .optional()
    .isURL()
    .withMessage('Photo URL must be a valid URL'),
  
  body('photos.*.caption')
    .optional()
    .isString()
    .withMessage('Photo caption must be a string')
    .isLength({ max: 200 })
    .withMessage('Photo caption must be less than 200 characters'),
  
  validate
];