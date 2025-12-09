const express = require('express');
const router = express.Router();
const settingController = require('../controllers/setting.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  generalSettingsValidation,
  borrowingLimitsValidation,
  fineRatesValidation,
  notificationSettingsValidation,
  auditLogValidation
} = require('../middleware/setting.validation');
const csrf = require('csurf');

// CSRF protection for state-changing operations
const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } });

// General settings
router.get(
  '/settings/general',
  protect,
  authorize('canConfigureGeneralSettings'),
  settingController.getGeneralSettings
);

router.put(
  '/settings/general',
  protect,
  authorize('canConfigureGeneralSettings'),
  csrfProtection,
  generalSettingsValidation,
  settingController.updateGeneralSettings
);

// Borrowing limits
router.get(
  '/settings/borrowing-limits',
  protect,
  authorize('canConfigureBorrowingLimits'),
  settingController.getBorrowingLimits
);

router.put(
  '/settings/borrowing-limits',
  protect,
  authorize('canConfigureBorrowingLimits'),
  csrfProtection,
  borrowingLimitsValidation,
  settingController.updateBorrowingLimits
);

// Fine rates
router.get(
  '/settings/fine-rates',
  protect,
  authorize('canConfigureFineRates'),
  settingController.getFineRates
);

router.put(
  '/settings/fine-rates',
  protect,
  authorize('canConfigureFineRates'),
  csrfProtection,
  fineRatesValidation,
  settingController.updateFineRates
);

// Notification settings
router.get(
  '/settings/notifications',
  protect,
  authorize('canConfigureNotificationChannels'),
  settingController.getNotificationSettings
);

router.put(
  '/settings/notifications',
  protect,
  authorize('canConfigureNotificationChannels'),
  csrfProtection,
  notificationSettingsValidation,
  settingController.updateNotificationSettings
);

// Audit logs
router.get(
  '/settings/audit-log',
  protect,
  authorize('canViewAuditLogs'),
  auditLogValidation,
  settingController.getAuditLogs
);

module.exports = router;