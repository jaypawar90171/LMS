const { body, param } = require('express-validator');
const { validate } = require('./validation.middleware');

// Rule ID validation
exports.ruleIdValidation = [
  param('ruleId')
    .isMongoId()
    .withMessage('Invalid rule ID format'),
  
  validate
];

// Template ID validation
exports.templateIdValidation = [
  param('templateId')
    .isMongoId()
    .withMessage('Invalid template ID format'),
  
  validate
];

// Create reminder rule validation
exports.createRuleValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters'),
  
  body('eventTrigger')
    .notEmpty()
    .withMessage('Event trigger is required')
    .isIn(['DueDateApproaching', 'ItemOverdue', 'FineCreated', 'FinePaymentDue', 'ReservationAvailable', 'ItemReturned'])
    .withMessage('Invalid event trigger'),
  
  body('timing.value')
    .notEmpty()
    .withMessage('Timing value is required')
    .isInt({ min: 0 })
    .withMessage('Timing value must be a non-negative integer'),
  
  body('timing.unit')
    .notEmpty()
    .withMessage('Timing unit is required')
    .isIn(['minutes', 'hours', 'days'])
    .withMessage('Timing unit must be minutes, hours, or days'),
  
  body('medium')
    .notEmpty()
    .withMessage('Medium is required')
    .isArray()
    .withMessage('Medium must be an array')
    .custom(value => {
      const validMediums = ['email', 'inApp', 'whatsapp'];
      return value.every(medium => validMediums.includes(medium));
    })
    .withMessage('Medium must contain only valid values: email, inApp, whatsapp'),
  
  body('templateId')
    .notEmpty()
    .withMessage('Template ID is required')
    .isMongoId()
    .withMessage('Invalid template ID format'),
  
  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be Active or Inactive'),
  
  validate
];

// Update reminder rule validation
exports.updateRuleValidation = [
  param('ruleId')
    .isMongoId()
    .withMessage('Invalid rule ID format'),
  
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters'),
  
  body('eventTrigger')
    .optional()
    .isIn(['DueDateApproaching', 'ItemOverdue', 'FineCreated', 'FinePaymentDue', 'ReservationAvailable', 'ItemReturned'])
    .withMessage('Invalid event trigger'),
  
  body('timing.value')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Timing value must be a non-negative integer'),
  
  body('timing.unit')
    .optional()
    .isIn(['minutes', 'hours', 'days'])
    .withMessage('Timing unit must be minutes, hours, or days'),
  
  body('medium')
    .optional()
    .isArray()
    .withMessage('Medium must be an array')
    .custom(value => {
      const validMediums = ['email', 'inApp', 'whatsapp'];
      return value.every(medium => validMediums.includes(medium));
    })
    .withMessage('Medium must contain only valid values: email, inApp, whatsapp'),
  
  body('templateId')
    .optional()
    .isMongoId()
    .withMessage('Invalid template ID format'),
  
  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be Active or Inactive'),
  
  validate
];

// Create reminder template validation
exports.createTemplateValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters'),
  
  body('subject')
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Subject must be between 3 and 200 characters'),
  
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters'),
  
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['DueDateApproaching', 'ItemOverdue', 'FineCreated', 'FinePaymentDue', 'ReservationAvailable', 'ItemReturned', 'General'])
    .withMessage('Invalid template type'),
  
  body('variables')
    .optional()
    .isArray()
    .withMessage('Variables must be an array'),
  
  body('variables.*')
    .optional()
    .isString()
    .withMessage('Each variable must be a string'),
  
  validate
];

// Update reminder template validation
exports.updateTemplateValidation = [
  param('templateId')
    .isMongoId()
    .withMessage('Invalid template ID format'),
  
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters'),
  
  body('subject')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('Subject must be between 3 and 200 characters'),
  
  body('content')
    .optional()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters'),
  
  body('type')
    .optional()
    .isIn(['DueDateApproaching', 'ItemOverdue', 'FineCreated', 'FinePaymentDue', 'ReservationAvailable', 'ItemReturned', 'General'])
    .withMessage('Invalid template type'),
  
  body('variables')
    .optional()
    .isArray()
    .withMessage('Variables must be an array'),
  
  body('variables.*')
    .optional()
    .isString()
    .withMessage('Each variable must be a string'),
  
  validate
];