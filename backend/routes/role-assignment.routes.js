const express = require('express');
const router = express.Router();
const roleAssignmentController = require('../controllers/role-assignment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  assignRolesToUsersValidation,
  removeRolesFromUsersValidation,
  getUsersByRoleValidation
} = require('../middleware/role-assignment.validation');
const csrf = require('csurf');

// CSRF protection for state-changing operations
const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } });

// Assign roles to users
router.post(
  '/roles/assign',
  protect,
  authorize('canManageRoles'),
  csrfProtection,
  assignRolesToUsersValidation,
  roleAssignmentController.assignRolesToUsers
);

// Remove roles from users
router.post(
  '/roles/remove',
  protect,
  authorize('canManageRoles'),
  csrfProtection,
  removeRolesFromUsersValidation,
  roleAssignmentController.removeRolesFromUsers
);

// Get users by role
router.get(
  '/roles/:roleId/users',
  protect,
  authorize('canViewRole', 'canViewUser'),
  getUsersByRoleValidation,
  roleAssignmentController.getUsersByRole
);

module.exports = router;