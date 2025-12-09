const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const automatedFineController = require('../controllers/automated-fine.controller');
const csrf = require('csurf');

// CSRF protection for state-changing operations
const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } });

// Manual trigger for automated processing (Admin only)
router.post('/trigger', protect, authorize(['Admin']), csrfProtection, automatedFineController.triggerAutomatedProcessing);

// Get automation status
router.get('/status', protect, authorize(['Admin']), automatedFineController.getAutomationStatus);

module.exports = router;