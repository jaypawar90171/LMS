const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permission.controller');
const { protect } = require('../middleware/auth.middleware');

// Get all permissions
router.get('/permissions', protect, permissionController.getAllPermissions);

// Get user permissions
router.get('/permissions/user', protect, permissionController.getUserPermissions);

module.exports = router;