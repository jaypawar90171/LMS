const { body, query, param } = require('express-validator');
const { validate } = require('./validation.middleware');

// Login validation
exports.loginValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  body('deviceId')
    .optional()
    .isString()
    .withMessage('Device ID must be a string'),
  
  validate
];

// Update profile validation
exports.updateProfileValidation = [
  body('fullName')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Full name must be between 3 and 100 characters')
    .matches(/^[a-zA-Z0-9\s.\-']+$/)
    .withMessage('Full name can only contain alphanumeric characters, spaces, and common special characters'),
  
  body('phoneNumber')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Invalid phone number format')
    .isLength({ min: 5, max: 20 })
    .withMessage('Phone number must be between 5 and 20 characters'),
  
  body('address')
    .optional()
    .isString()
    .withMessage('Address must be a string')
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  
  body('dateOfBirth')
    .optional()
    .isDate()
    .withMessage('Invalid date format for date of birth'),
  
  validate
];

// Get items validation
exports.getItemsValidation = [
  query('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID format'),
  
  query('search')
    .optional()
    .isString()
    .withMessage('Search query must be a string'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be at least 1'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  validate
];

// Item ID validation
exports.itemIdValidation = [
  param('itemId')
    .isMongoId()
    .withMessage('Invalid item ID format'),
  
  validate
];

// Create request validation
exports.createRequestValidation = [
  body('itemId')
    .notEmpty()
    .withMessage('Item ID is required')
    .isMongoId()
    .withMessage('Invalid item ID format'),
  
  body('requestType')
    .notEmpty()
    .withMessage('Request type is required')
    .isIn(['Borrow', 'Reserve', 'Extend'])
    .withMessage('Request type must be Borrow, Reserve, or Extend'),
  
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  
  validate
];

// Get requests validation
exports.getRequestsValidation = [
  query('status')
    .optional()
    .isIn(['Pending', 'Approved', 'Rejected', 'Cancelled', 'Fulfilled'])
    .withMessage('Status must be Pending, Approved, Rejected, Cancelled, or Fulfilled'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be at least 1'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  validate
];

// Get transactions validation
exports.getTransactionsValidation = [
  query('status')
    .optional()
    .isIn(['Pending', 'Issued', 'Returned', 'Overdue'])
    .withMessage('Status must be Pending, Issued, Returned, or Overdue'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be at least 1'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  validate
];

// Get fines validation
exports.getFinesValidation = [
  query('status')
    .optional()
    .isIn(['Outstanding', 'Partial Paid', 'Paid', 'Waived'])
    .withMessage('Status must be Outstanding, Partial Paid, Paid, or Waived'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be at least 1'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
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
  
  validate
];

// Get notifications validation
exports.getNotificationsValidation = [
  query('read')
    .optional()
    .isBoolean()
    .withMessage('Read must be a boolean'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be at least 1'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  validate
];

// Mark notification read validation
exports.markNotificationReadValidation = [
  param('notificationId')
    .isMongoId()
    .withMessage('Invalid notification ID format'),
  
  body('read')
    .optional()
    .isBoolean()
    .withMessage('Read must be a boolean'),
  
  validate
];

// Signup validation
exports.signupValidation = [
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Full name must be between 3 and 100 characters'),
  
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
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
  
  body('address')
    .optional()
    .isString()
    .withMessage('Address must be a string'),
  
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

// Add item request validation
exports.addItemRequestValidation = [
  body('itemName')
    .notEmpty()
    .withMessage('Item name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Item name must be between 3 and 100 characters'),
  
  body('itemDescription')
    .optional()
    .isLength({ min: 10, max: 500 })
    .withMessage('Item description must be between 10 and 500 characters'),
  
  // body('itemImage')
  //   .notEmpty()
  //   .withMessage('Item image is required')
  //   .isURL()
  //   .withMessage('Item image must be a valid URL'),
  
  body('categoryId')
    .notEmpty()
    .withMessage('Category is required')
    .isMongoId()
    .withMessage('Invalid category ID format'),
  
  body('condition')
    .optional()
    .isIn(['New', 'Like New', 'Good', 'Fair', 'Poor'])
    .withMessage('Invalid condition value'),
  
  body('availableFrom')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  
  // body('availableUntil')
  //   .notEmpty()
  //   .withMessage('Available until date is required')
  //   .isISO8601()
  //   .withMessage('Invalid date format'),
  
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