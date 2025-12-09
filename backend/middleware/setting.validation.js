const { body, query } = require('express-validator');
const { validate } = require('./validation.middleware');

// General settings validation
exports.generalSettingsValidation = [
  body('libraryName')
    .optional()
    .isString()
    .withMessage('Library name must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Library name must be between 1 and 100 characters'),
  
  body('contactEmail')
    .optional()
    .isEmail()
    .withMessage('Contact email must be a valid email address'),
  
  body('phoneNumber')
    .optional()
    .isString()
    .withMessage('Phone number must be a string')
    .isLength({ min: 5, max: 20 })
    .withMessage('Phone number must be between 5 and 20 characters'),
  
  body('address')
    .optional()
    .isString()
    .withMessage('Address must be a string')
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  
  body('defaultReturnPeriod')
    .optional()
    .isInt({ min: 1, max: 90 })
    .withMessage('Default return period must be between 1 and 90 days'),
  
  body('operationalHours')
    .optional()
    .isObject()
    .withMessage('Operational hours must be an object'),
  
  body('operationalHours.*.open')
    .optional()
    .isString()
    .withMessage('Open time must be a string'),
  
  body('operationalHours.*.close')
    .optional()
    .isString()
    .withMessage('Close time must be a string'),
  
  validate
];

// Borrowing limits validation
exports.borrowingLimitsValidation = [
  body('maxConcurrentItems')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Maximum concurrent items must be between 1 and 50'),
  
  body('maxConcurrentQueues')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Maximum concurrent queues must be between 1 and 20'),
  
  body('maxPeriodExtensions')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Maximum period extensions must be between 0 and 10'),
  
  body('extensionPeriodDays')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Extension period days must be between 1 and 30'),
  
  validate
];

// Fine rates validation
exports.fineRatesValidation = [
  body('overdueFineRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Overdue fine rate must be between 0 and 100'),
  
  body('lostItemBaseFine')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Lost item base fine must be between 0 and 1000'),
  
  body('damagedItemBaseFine')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Damaged item base fine must be between 0 and 1000'),
  
  body('fineGracePeriodDays')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Fine grace period days must be between 0 and 10'),
  
  validate
];

// Notification settings validation
exports.notificationSettingsValidation = [
  body('emailEnabled')
    .optional()
    .isBoolean()
    .withMessage('Email enabled must be a boolean'),
  
  body('emailSettings')
    .optional()
    .isObject()
    .withMessage('Email settings must be an object'),
  
  body('emailSettings.fromName')
    .optional()
    .isString()
    .withMessage('From name must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('From name must be between 1 and 100 characters'),
  
  body('emailSettings.fromEmail')
    .optional()
    .isEmail()
    .withMessage('From email must be a valid email address'),
  
  body('emailSettings.smtpHost')
    .optional()
    .isString()
    .withMessage('SMTP host must be a string'),
  
  body('emailSettings.smtpPort')
    .optional()
    .isInt({ min: 1, max: 65535 })
    .withMessage('SMTP port must be between 1 and 65535'),
  
  body('emailSettings.smtpSecure')
    .optional()
    .isBoolean()
    .withMessage('SMTP secure must be a boolean'),
  
  body('whatsappEnabled')
    .optional()
    .isBoolean()
    .withMessage('WhatsApp enabled must be a boolean'),
  
  body('whatsappSettings')
    .optional()
    .isObject()
    .withMessage('WhatsApp settings must be an object'),
  
  body('whatsappSettings.apiKey')
    .optional()
    .isString()
    .withMessage('API key must be a string'),
  
  body('whatsappSettings.fromNumber')
    .optional()
    .isString()
    .withMessage('From number must be a string'),
  
  body('inAppEnabled')
    .optional()
    .isBoolean()
    .withMessage('In-app enabled must be a boolean'),
  
  validate
];

// Audit log validation
exports.auditLogValidation = [
  query('actionType')
    .optional()
    .isString()
    .withMessage('Action type must be a string'),
  
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  query('fromDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for fromDate'),
  
  query('toDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for toDate'),
  
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