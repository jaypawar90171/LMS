const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const csrf = require('csurf');

// CSRF protection for state-changing operations
const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } });

// Get admin notifications
router.get(
  '/notifications',
  protect,
  authorize('canViewNotifications'),
  notificationController.getAdminNotifications
);

// Generate notifications
router.post(
  '/notifications/generate',
  protect,
  authorize('canManageNotifications'),
  csrfProtection,
  notificationController.generateRequestNotifications
);

// Send notification to user
router.post(
  '/notifications',
  protect,
  authorize('canManageNotifications'),
  csrfProtection,
  notificationController.sendNotification
);

// Mark notification as read
router.patch(
  '/notifications/:notificationId/read',
  protect,
  authorize('canViewNotifications'),
  csrfProtection,
  notificationController.markNotificationRead
);

// Mark all notifications as read
router.patch(
  '/notifications/mark-all-read',
  protect,
  authorize('canViewNotifications'),
  csrfProtection,
  notificationController.markAllNotificationsRead
);

// Delete notification
router.delete(
  '/notifications/:notificationId',
  protect,
  authorize('canManageNotifications'),
  csrfProtection,
  notificationController.deleteNotification
);

// Get notification statistics
router.get(
  '/notifications/stats',
  protect,
  authorize('canViewNotifications'),
  notificationController.getNotificationStats
);



module.exports = router;