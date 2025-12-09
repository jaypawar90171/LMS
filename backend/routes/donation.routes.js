const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donation.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  donationIdValidation,
  updateDonationStatusValidation,
  processDonationValidation,
  createDonationValidation
} = require('../middleware/donation.validation');
const csrf = require('csurf');

// CSRF protection for state-changing operations
const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } });

// Admin routes
router.get(
  '/donations',
  protect,
  authorize('canViewDonations'),
  donationController.getDonations
);

router.get(
  '/donations/:donationId',
  protect,
  authorize('canViewDonations'),
  donationIdValidation,
  donationController.getDonationById
);

router.patch(
  '/donations/:donationId',
  protect,
  authorize('canManageDonations'),
  csrfProtection,
  updateDonationStatusValidation,
  donationController.updateDonationStatus
);

router.post(
  '/donations/:donationId/process',
  protect,
  authorize('canManageDonations'),
  csrfProtection,
  processDonationValidation,
  donationController.processDonation
);

// Mobile app routes (to be used in mobile.routes.js)
const mobileRoutes = {
  createDonation: [
    protect,
    // csrfProtection,
    createDonationValidation,
    donationController.createDonation
  ],
  getUserDonations: [
    protect,
    donationController.getUserDonations
  ]
};

module.exports = { router, mobileRoutes };