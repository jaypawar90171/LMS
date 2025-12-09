const express = require('express');
const router = express.Router();
const operationsController = require('../controllers/operations.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  issueItemValidation,
  returnItemValidation,
  extendDueDateValidation,
  requestIdValidation,
  updateRequestStatusValidation,
  addToQueueValidation,
  removeFromQueueValidation,
  allocateItemValidation
} = require('../middleware/operations.validation');
const csrf = require('csurf');

// CSRF protection for state-changing operations
const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } });

// Issue an item to a user
router.post(
  '/operations/issue',
  protect,
  authorize('canIssueItem'),
  // csrfProtection,
  issueItemValidation,
  operationsController.issueItem
);

// Return an issued item
router.post(
  '/operations/return',
  protect,
  authorize('canReturnItem'),
  csrfProtection,
  returnItemValidation,
  operationsController.returnItem
);

// Extend due date for an issued item
router.patch(
  '/operations/extend',
  protect,
  authorize('canExtendPeriod'),
  csrfProtection,
  extendDueDateValidation,
  operationsController.extendDueDate
);

// Get all transactions with filtering
router.get(
  '/operations/transactions',
  protect,
  authorize('canIssueItem', 'canReturnItem'),
  operationsController.getTransactions
);

// Get all requests with filtering
router.get(
  '/operations/requests',
  protect,
  authorize('canViewQueue'),
  operationsController.getRequests
);

// Update request status (approve/reject)
router.patch(
  '/operations/requests/:requestId',
  protect,
  authorize('canAllocateItem'),
  csrfProtection,
  updateRequestStatusValidation,
  operationsController.updateRequestStatus
);

// Get all items with active queues
router.get(
  '/operations/queues',
  protect,
  authorize('canViewQueue'),
  operationsController.getQueues
);

// Get queue details for a specific item
router.get(
  '/operations/queues/:itemId',
  protect,
  authorize('canViewQueue'),
  operationsController.getItemQueue
);

// Add user to item queue
router.post(
  '/operations/queues',
  protect,
  authorize('canAllocateItem'),
  csrfProtection,
  addToQueueValidation,
  operationsController.addToQueue
);

// Remove user from item queue
router.delete(
  '/operations/queues/:itemId/users/:userId',
  protect,
  authorize('canRemoveFromQueue'),
  csrfProtection,
  removeFromQueueValidation,
  operationsController.removeFromQueue
);

// Allocate item to a specific user in the queue
router.post(
  '/operations/queues/:itemId/allocate',
  protect,
  authorize('canAllocateItem'),
  csrfProtection,
  allocateItemValidation,
  operationsController.allocateItem
);

// Renewal request management
router.get(
  '/operations/renewal-requests',
  protect,
  authorize('canExtendPeriod'),
  operationsController.getRenewalRequests
);

router.patch(
  '/operations/renewal-requests/:requestId/approve',
  protect,
  authorize('canExtendPeriod'),
  csrfProtection,
  operationsController.approveRenewalRequest
);

router.patch(
  '/operations/renewal-requests/:requestId/reject',
  protect,
  authorize('canExtendPeriod'),
  csrfProtection,
  operationsController.rejectRenewalRequest
);

module.exports = router;