const express = require('express');
const router = express.Router();
const userPermissionController = require('../controllers/user-permission.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { userIdValidation } = require('../middleware/user.validation');
const csrf = require('csurf');

// CSRF protection for state-changing operations
const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } });

// Get user's effective permissions (role + overrides)
router.get(
  '/users/:userId/permissions',
  protect,
  authorize('canViewUser'),
  userIdValidation,
  userPermissionController.getUserEffectivePermissions
);

// Update user permission overrides (bulk update)
router.put(
  '/users/:userId/permissions',
  protect,
  authorize('canManageUserPermissions'),
  csrfProtection,
  userIdValidation,
  userPermissionController.updateUserPermissions
);

// Grant specific permission to user
router.post(
  '/users/:userId/permissions/grant',
  protect,
  authorize('canManageUserPermissions'),
  csrfProtection,
  userIdValidation,
  userPermissionController.grantPermissionToUser
);

// Revoke specific permission from user
router.post(
  '/users/:userId/permissions/revoke',
  protect,
  authorize('canManageUserPermissions'),
  csrfProtection,
  userIdValidation,
  userPermissionController.revokePermissionFromUser
);

module.exports = router;