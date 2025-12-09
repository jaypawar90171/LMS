const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  userIdValidation,
  createUserValidation,
  updateUserValidation,
  updateUserStatusValidation,
  rejectUserValidation
} = require('../middleware/user.validation');
const { validate } = require('../middleware/validation.middleware');
const csrf = require('csurf');

// CSRF protection for state-changing operations
const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } });

// Check phone number uniqueness
router.get(
  '/users/check-phone',
  protect,
  userController.checkPhoneUniqueness
);

// Get all users
router.get(
  '/users',
  protect,
  authorize('canViewUser'),
  userController.getUsers
);

// Get pending user approvals
router.get(
  '/users/pending-approvals',
  protect,
  authorize('canViewUser'),
  userController.getPendingApprovals
);

// Get user by ID
router.get(
  '/users/:userId',
  protect,
  authorize('canViewUser'),
  userIdValidation,
  userController.getUserById
);

// Create new user
router.post(
  '/users',
  protect,
  authorize('canCreateUser'),
  csrfProtection,
  createUserValidation,
  userController.createUser
);

// Update user
router.put(
  '/users/:userId',
  protect,
  authorize('canEditUser'),
  csrfProtection,
  updateUserValidation,
  userController.updateUser
);

// Update user status
router.patch(
  '/users/:userId/status',
  protect,
  authorize('canDeactivateUser'),
  csrfProtection,
  updateUserStatusValidation,
  userController.updateUserStatus
);

// Reset user password
router.post(
  '/users/:userId/reset-password',
  protect,
  authorize('canResetUserPassword'),
  csrfProtection,
  userIdValidation,
  userController.resetUserPassword
);

// Approve user account
router.post(
  '/users/:userId/approve',
  protect,
  authorize('canCreateUser'),
  csrfProtection,
  userIdValidation,
  userController.approveUser
);

// Reject user account
router.post(
  '/users/:userId/reject',
  protect,
  authorize('canCreateUser'),
  csrfProtection,
  rejectUserValidation,
  userController.rejectUser
);

// Unlock user account
router.post(
  '/users/:userId/unlock',
  protect,
  authorize('canUnlockUser'),
  csrfProtection,
  userIdValidation,
  userController.unlockUserAccount
);

// Delete user permanently
router.delete(
  '/users/:userId',
  protect,
  authorize('canDeleteUser'),
  csrfProtection,
  userIdValidation,
  userController.deleteUser
);

module.exports = router;