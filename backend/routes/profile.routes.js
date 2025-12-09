const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { protect } = require('../middleware/auth.middleware');
const { getUserPermissions } = require('../middleware/permission.middleware');
const csrf = require('csurf');

// CSRF protection for state-changing operations
const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } });

// Get admin profile
router.get('/profile', protect, profileController.getProfile);

// Update admin profile
router.put('/profile', protect, csrfProtection, profileController.updateProfile);

// Change password
router.post('/profile/change-password', protect, csrfProtection, profileController.changePassword);

// Get user permissions for UI rendering
router.get('/permissions', protect, getUserPermissions);

module.exports = router;