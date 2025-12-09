const { query } = require('express-validator');
const { validate } = require('./validation.middleware');

// Defaulters report validation
exports.defaultersReportValidation = [
  query('fromDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for fromDate'),
  
  query('toDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for toDate'),
  
  query('itemType')
    .optional()
    .isIn(['Book', 'Course', 'Toy'])
    .withMessage('Item type must be Book, Course, or Toy'),
  
  query('userRole')
    .optional()
    .isString()
    .withMessage('User role must be a string'),
  
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Format must be json or csv'),
  
  validate
];

// Queue report validation
exports.queueReportValidation = [
  query('itemType')
    .optional()
    .isIn(['Book', 'Course', 'Toy'])
    .withMessage('Item type must be Book, Course, or Toy'),
  
  query('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID format'),
  
  query('minQueueLength')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Minimum queue length must be at least 1'),
  
  query('maxQueueLength')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum queue length must be at least 1'),
  
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Format must be json or csv'),
  
  validate
];

// Allocation report validation
exports.allocationReportValidation = [
  query('adminUser')
    .optional()
    .isMongoId()
    .withMessage('Invalid admin user ID format'),
  
  query('itemStatus')
    .optional()
    .isIn(['Issued', 'Overdue', 'Returned'])
    .withMessage('Item status must be Issued, Overdue, or Returned'),
  
  query('returnStatus')
    .optional()
    .isIn(['Returned', 'NotReturned'])
    .withMessage('Return status must be Returned or NotReturned'),
  
  query('fromDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for fromDate'),
  
  query('toDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for toDate'),
  
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Format must be json or csv'),
  
  validate
];

// Fines report validation
exports.finesReportValidation = [
  query('status')
    .optional()
    .isIn(['Outstanding', 'Partial Paid', 'Paid', 'Waived'])
    .withMessage('Status must be Outstanding, Partial Paid, Paid, or Waived'),
  
  query('reason')
    .optional()
    .isIn(['Overdue', 'Damaged', 'Lost', 'Manual'])
    .withMessage('Reason must be Overdue, Damaged, Lost, or Manual'),
  
  query('userRole')
    .optional()
    .isString()
    .withMessage('User role must be a string'),
  
  query('fromDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for fromDate'),
  
  query('toDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for toDate'),
  
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Format must be json or csv'),
  
  validate
];

// Inventory report validation
exports.inventoryReportValidation = [
  query('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID format'),
  
  query('status')
    .optional()
    .isIn(['Available', 'Issued', 'Misplaced', 'Under Repair', 'Lost', 'Donation Pending'])
    .withMessage('Status must be Available, Issued, Misplaced, Under Repair, Lost, or Donation Pending'),
  
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Format must be json or csv'),
  
  validate
];

// Activity report validation
exports.activityReportValidation = [
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
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Format must be json or csv'),
  
  validate
];