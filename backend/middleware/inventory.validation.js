const { body, param, query } = require('express-validator');
const { validate } = require('./validation.middleware');
const { validateTypeSpecificFields } = require('../utils/item-type-schemas');

// Item ID validation
exports.itemIdValidation = [
  param('itemId')
    .isMongoId()
    .withMessage('Invalid item ID format'),
  validate
];

// Copy ID validation
exports.copyIdValidation = [
  param('itemId')
    .isMongoId()
    .withMessage('Invalid item ID format'),
  param('copyId')
    .isMongoId()
    .withMessage('Invalid copy ID format'),
  validate
];

// Create inventory item validation
exports.createItemValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  
  body('typeSpecificFields')
    .optional()
    .isObject()
    .withMessage('Type specific fields must be an object'),
  
  // body('price')
  //   .notEmpty()
  //   .withMessage('Price is required')
  //   .isFloat({ min: 0 })
  //   .withMessage('Price must be a positive number'),
  
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  
  body('categoryId')
    .notEmpty()
    .withMessage('Category is required')
    .isMongoId()
    .withMessage('Invalid category ID format'),
  
  body('subcategoryId')
    .optional()
    .isMongoId()
    .withMessage('Invalid subcategory ID format'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('defaultReturnPeriod')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Default return period must be at least 1 day'),
  
  validate
];

// Update inventory item validation
exports.updateItemValidation = [
  param('itemId')
    .isMongoId()
    .withMessage('Invalid item ID format'),
  
  body('title')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  
  body('typeSpecificFields')
    .optional()
    .isObject()
    .withMessage('Type specific fields must be an object'),
  
  // body('price')
  //   .optional()
  //   .isFloat({ min: 0 })
  //   .withMessage('Price must be a positive number'),
  
  body('categoryId')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID format'),
  
  body('subcategoryId')
    .optional()
    .isMongoId()
    .withMessage('Invalid subcategory ID format'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('defaultReturnPeriod')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Default return period must be at least 1 day'),
  
  validate
];

// Update item status validation
exports.updateItemStatusValidation = [
  param('itemId')
    .isMongoId()
    .withMessage('Invalid item ID format'),
  
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['Available', 'Misplaced', 'Under Repair', 'Lost', 'Donation Pending'])
    .withMessage('Status must be Available, Misplaced, Under Repair, Lost, or Donation Pending'),
  
  body('reason')
    .optional()
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters'),
  
  validate
];

// Add copies validation
exports.addCopiesValidation = [
  param('itemId')
    .isMongoId()
    .withMessage('Invalid item ID format'),
  
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  
  body('condition')
    .optional()
    .isIn(['New', 'Good', 'Fair', 'Poor', 'Damaged'])
    .withMessage('Condition must be New, Good, Fair, Poor, or Damaged'),
  
  validate
];

// Update copy status validation
exports.updateCopyStatusValidation = [
  param('itemId')
    .isMongoId()
    .withMessage('Invalid item ID format'),
  
  param('copyId')
    .isMongoId()
    .withMessage('Invalid copy ID format'),
  
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['Available', 'Issued', 'Misplaced', 'Under Repair', 'Lost'])
    .withMessage('Status must be Available, Issued, Misplaced, Under Repair, or Lost'),
  
  body('condition')
    .optional()
    .isIn(['New', 'Good', 'Fair', 'Poor', 'Damaged'])
    .withMessage('Condition must be New, Good, Fair, Poor, or Damaged'),
  
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  
  validate
];

// Generate barcode validation
exports.generateBarcodeValidation = [
  param('itemId')
    .isMongoId()
    .withMessage('Invalid item ID format'),
  
  body('format')
    .optional()
    .isIn(['CODE128', 'CODE39', 'EAN13', 'UPC', 'QR'])
    .withMessage('Format must be CODE128, CODE39, EAN13, UPC, or QR'),
  
  validate
];

// Print barcode validation
exports.printBarcodeValidation = [
  param('itemId')
    .isMongoId()
    .withMessage('Invalid item ID format'),
  
  query('format')
    .optional()
    .isIn(['CODE128', 'CODE39', 'EAN13', 'UPC', 'QR'])
    .withMessage('Format must be CODE128, CODE39, EAN13, UPC, or QR'),
  
  validate
];