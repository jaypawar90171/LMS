const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Get dashboard summary
router.get('/dashboard-summary', protect, authorize('canViewDashboard'), dashboardController.getDashboardSummary);

// Test route for dashboard summary (no auth required)
router.get('/test-dashboard-summary', dashboardController.getDashboardSummary);

module.exports = router;