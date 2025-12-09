const express = require('express');
const router = express.Router();
const reminderRuleController = require('../controllers/reminderRule.controller');
const reminderTemplateController = require('../controllers/reminderTemplate.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  ruleIdValidation,
  templateIdValidation,
  createRuleValidation,
  updateRuleValidation,
  createTemplateValidation,
  updateTemplateValidation
} = require('../middleware/reminder.validation');
const csrf = require('csurf');

// CSRF protection for state-changing operations
const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } });

// Reminder Rules Routes
router.get(
  '/reminders/rules',
  protect,
  authorize('canConfigureReminders'),
  reminderRuleController.getReminderRules
);

router.get(
  '/reminders/rules/:ruleId',
  protect,
  authorize('canConfigureReminders'),
  ruleIdValidation,
  reminderRuleController.getReminderRuleById
);

router.post(
  '/reminders/rules',
  protect,
  authorize('canConfigureReminders'),
  csrfProtection,
  createRuleValidation,
  reminderRuleController.createReminderRule
);

router.put(
  '/reminders/rules/:ruleId',
  protect,
  authorize('canConfigureReminders'),
  csrfProtection,
  updateRuleValidation,
  reminderRuleController.updateReminderRule
);

router.delete(
  '/reminders/rules/:ruleId',
  protect,
  authorize('canConfigureReminders'),
  csrfProtection,
  ruleIdValidation,
  reminderRuleController.deleteReminderRule
);

// Reminder Templates Routes
router.get(
  '/reminders/templates',
  reminderTemplateController.getReminderTemplates
);

router.get(
  '/reminders/templates/:templateId',
  protect,
  authorize('canConfigureReminders'),
  templateIdValidation,
  reminderTemplateController.getReminderTemplateById
);

router.post(
  '/reminders/templates',
  protect,
  authorize('canConfigureReminders'),
  csrfProtection,
  createTemplateValidation,
  reminderTemplateController.createReminderTemplate
);

router.put(
  '/reminders/templates/:templateId',
  csrfProtection,
  updateTemplateValidation,
  reminderTemplateController.updateReminderTemplate
);

router.delete(
  '/reminders/templates/:templateId',
  protect,
  authorize('canConfigureReminders'),
  csrfProtection,
  templateIdValidation,
  reminderTemplateController.deleteReminderTemplate
);

module.exports = router;