const express = require('express');
const router = express.Router();
const itemRequestController = require('../controllers/itemRequest.controller');
const { protect } = require('../middleware/auth.middleware');
const { 
  addItemRequestValidation, 
  requestItemValidation, 
  reviewRequestValidation 
} = require('../middleware/itemRequest.validation');
const csrf = require('csurf');

// CSRF protection for state-changing operations
const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } });

// Admin routes only
router.get('/all-requests', protect, itemRequestController.getAllRequests);
router.patch('/requests/:requestId/review', protect, reviewRequestValidation, itemRequestController.reviewRequest);

module.exports = router;