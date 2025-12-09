const express = require('express');
const router = express.Router();
const reminderTemplateController = require('../controllers/reminderTemplate.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const csrf = require('csurf');

// CSRF protection for state-changing operations
const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } });

// Get all templates
router.get(
  '/reminder-templates',
  protect,
  authorize('canViewNotifications'),
  reminderTemplateController.getReminderTemplates
);

// Create template
router.post(
  '/reminder-templates',
  protect,
  authorize('canManageNotifications'),
  csrfProtection,
  reminderTemplateController.createReminderTemplate
);

// Update template
router.put(
  '/reminder-templates/:id',
  protect,
  authorize('canManageNotifications'),
  csrfProtection,
  reminderTemplateController.updateReminderTemplate
);

module.exports = router;