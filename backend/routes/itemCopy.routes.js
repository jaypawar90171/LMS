const express = require('express');
const router = express.Router();
const itemCopyController = require('../controllers/itemCopy.controller');
const { protect } = require('../middleware/auth.middleware');
const csrf = require('csurf');

// CSRF protection for state-changing operations
const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } });

// Generate copies for an item
router.post('/generate/:itemId', protect, csrfProtection, itemCopyController.generateCopies);

// Get all copies of an item
router.get('/item/:itemId', protect, itemCopyController.getItemCopies);

module.exports = router;