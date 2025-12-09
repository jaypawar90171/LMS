const express = require('express');
const router = express.Router();
const debugController = require('../controllers/debug.controller');
const { protect } = require('../middleware/auth.middleware');

// Debug route to check user permissions
router.get('/permissions', protect, debugController.checkUserPermissions);

module.exports = router;