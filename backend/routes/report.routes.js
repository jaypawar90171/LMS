const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  defaultersReportValidation,
  queueReportValidation,
  allocationReportValidation,
  finesReportValidation,
  inventoryReportValidation,
  activityReportValidation
} = require('../middleware/report.validation');

// Defaulters report
router.get(
  '/reports/defaulters',
  protect,
  authorize('canViewReports'),
  defaultersReportValidation,
  reportController.getDefaultersReport
);

// Queue report
router.get(
  '/reports/queue',
  protect,
  authorize('canViewReports'),
  queueReportValidation,
  reportController.getQueueReport
);

// Allocation report
router.get(
  '/reports/allocation',
  protect,
  authorize('canViewReports'),
  allocationReportValidation,
  reportController.getAllocationReport
);

// Fines report
router.get(
  '/reports/fines',
  protect,
  authorize('canViewReports'),
  finesReportValidation,
  reportController.getFinesReport
);

// Inventory report
router.get(
  '/reports/inventory',
  protect,
  authorize('canViewReports'),
  inventoryReportValidation,
  reportController.getInventoryReport
);

// Activity report
router.get(
  '/reports/activity',
  protect,
  authorize('canViewReports'),
  activityReportValidation,
  reportController.getActivityReport
);

module.exports = router;