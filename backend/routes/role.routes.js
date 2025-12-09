const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  roleIdValidation,
  createRoleValidation,
  updateRoleValidation,
  cloneRoleValidation,
  compareRolesValidation
} = require('../middleware/role.validation');
const csrf = require('csurf');

// CSRF protection for state-changing operations
const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } });

// Get all roles
router.get(
  '/roles',
  protect,
  authorize('canViewRole'),
  roleController.getRoles
);

// Get role by ID
router.get(
  '/roles/:roleId',
  protect,
  authorize('canViewRole'),
  roleIdValidation,
  roleController.getRoleById
);

// Create new role
router.post(
  '/roles',
  protect,
  authorize('canCreateRole'),
  csrfProtection,
  createRoleValidation,
  roleController.createRole
);

// Update role permissions
router.put(
  '/roles/:roleId',
  protect,
  authorize('canEditRolePermissions'),
  csrfProtection,
  updateRoleValidation,
  roleController.updateRole
);

// Clone role
router.post(
  '/roles/clone',
  protect,
  authorize('canCreateRole'),
  csrfProtection,
  cloneRoleValidation,
  roleController.cloneRole
);

// Compare roles
router.post(
  '/roles/compare',
  protect,
  authorize('canViewRole'),
  csrfProtection,
  compareRolesValidation,
  roleController.compareRoles
);

// Get role statistics
router.get(
  '/roles/statistics',
  protect,
  authorize('canViewRole'),
  roleController.getRoleStatistics
);

// Delete role
router.delete(
  '/roles/:roleId',
  protect,
  authorize('canDeleteRole'),
  csrfProtection,
  roleIdValidation,
  roleController.deleteRole
);

// Get all permissions
router.get(
  '/permissions',
  protect,
  authorize('canViewRole'),
  roleController.getPermissions
);

// Get users assigned to a role
router.get(
  '/roles/:roleId/users',
  protect,
  authorize('canViewRole'),
  roleIdValidation,
  roleController.getUsersByRole
);

// User-specific permission management routes
// Get user's effective permissions
router.get(
  '/users/:userId/permissions',
  protect,
  authorize('canViewUser'),
  roleController.getUserPermissions
);

// Grant additional permissions to user
router.post(
  '/users/:userId/permissions/grant',
  protect,
  authorize('canEditUser'),
  csrfProtection,
  roleController.grantUserPermissions
);

// Revoke permissions from user
router.post(
  '/users/:userId/permissions/revoke',
  protect,
  authorize('canEditUser'),
  csrfProtection,
  roleController.revokeUserPermissions
);

// Get user's permission breakdown
router.get(
  '/users/:userId/permissions/breakdown',
  protect,
  authorize('canViewUser'),
  roleController.getUserPermissionBreakdown
);

module.exports = router;