const express = require('express');
const router = express.Router();
const fineController = require('../controllers/fine.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const csrf = require('csurf');

// CSRF protection for state-changing operations
const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } });

// Test route to verify fine routes are working
router.get('/fines/test', (req, res) => {
  res.json({ success: true, message: 'Fine routes are working', timestamp: new Date() });
});

// Test POST route
router.post('/fines/test-post', csrfProtection, (req, res) => {
  res.json({ success: true, message: 'POST route working', body: req.body, timestamp: new Date() });
});

// Add overdue fine for transaction
router.post(
  '/fines/overdue',
  protect,
  authorize('canAddManualFine'),
  csrfProtection,
  fineController.addOverdueFine
);

// Get all fines with filtering
router.get(
  '/fines',
  protect,
  authorize('canViewFines'),
  fineController.getFines
);

// Record payment for a fine
router.patch(
  '/fines/:id/payment',
  protect,
  authorize('canAddManualFine'),
  csrfProtection,
  fineController.recordPayment
);

// Waive a fine
router.patch(
  '/fines/:id/waive',
  protect,
  authorize('canAddManualFine'),
  csrfProtection,
  fineController.waiveFine
);

module.exports = router;