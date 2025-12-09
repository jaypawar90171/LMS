const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { mobileRoutes: donationMobileRoutes } = require("./donation.routes");
const mobileAuthController = require("../controllers/mobile.auth.controller");
const mobileProfileController = require("../controllers/mobile.profile.controller");
const mobileItemController = require("../controllers/mobile.item.controller");
const mobileRequestController = require("../controllers/mobile.request.controller");
const mobileTransactionController = require("../controllers/mobile.transaction.controller");
const mobileFineController = require("../controllers/mobile.fine.controller");
const mobileNotificationController = require("../controllers/mobile.notification.controller");
const mobileCategoryController = require("../controllers/mobile.category.controller");
const mobileServiceController = require("../controllers/mobile.service.controller");
const mobileDashboardController = require("../controllers/mobile.dashboard.controller");
const mobileQueueController = require("../controllers/mobile.queue.controller");

const csrf = require("csurf");
console.log(require("../config/upload"))
const { upload } = require("../config/upload");

// CSRF protection for state-changing operations
const csrfProtection = csrf({
  cookie: { httpOnly: true, secure: process.env.NODE_ENV === "production" },
});

const {
  loginValidation,
  signupValidation,
  updateProfileValidation,
  getItemsValidation,
  itemIdValidation,
  createRequestValidation,
  getRequestsValidation,
  getTransactionsValidation,
  getFinesValidation,
  getNotificationsValidation,
  markNotificationReadValidation,
  addItemRequestValidation,
  requestItemValidation,
} = require("../middleware/mobile.validation");

// Auth routes (no CSRF protection for mobile auth endpoints)
router.post("/auth/signup", signupValidation, mobileAuthController.signup);
router.post("/auth/login", loginValidation, mobileAuthController.login);
router.post("/auth/logout", mobileAuthController.logout);
router.post("/auth/refresh", mobileAuthController.refreshToken);
router.post("/auth/forgot-password", mobileAuthController.forgotPassword);
router.get(
  "/auth/validate-reset-token",
  mobileAuthController.validateResetToken
);
router.post(
  "/auth/change-password",
  protect,
  mobileAuthController.changePassword
);
router.post("/auth/reset-password", mobileAuthController.resetPassword);
router.get("/auth/check-user", mobileAuthController.checkUserStatus); // Debug endpoint

// Dashboard route
router.get("/dashboard", protect, mobileDashboardController.getDashboardData);

// Profile routes
router.get("/profile", protect, mobileProfileController.getProfile);
router.put(
  "/profile",
  protect,
  // csrfProtection,    
  updateProfileValidation,
  mobileProfileController.updateProfile
);

router.put(
  "/profile/picture",
  upload.single("image"),
  protect,
  // csrfProtection,
  mobileProfileController.updateProfilePicture
);

// Category routes
router.get("/categories", protect, mobileCategoryController.getCategories);
router.get(
  "/categories/:id",
  protect,
  mobileCategoryController.getCategoryDetails
);

// Item routes
router.get(
  "/items",
  protect,
  getItemsValidation,
  mobileItemController.getItems
);

router.get("/items/new-arrivals", protect, mobileItemController.getNewArrivals);

router.get("/items/search", protect, mobileItemController.searchItems);

router.get(
  "/items/:itemId",
  protect,
  itemIdValidation,
  mobileItemController.getItemById
);

router.post(
  "/items/:itemId/request",
  protect,
  itemIdValidation,
  mobileItemController.requestItem
);

// Request routes (no CSRF protection for mobile endpoints)
router.post(
  "/requests",
  protect,
  createRequestValidation,
  mobileRequestController.createRequest
); //request a item which is available

router.get(
  "/requests",
  protect,
  getRequestsValidation,
  mobileRequestController.getUserRequests
);
router.delete("/requests/:id", protect, mobileRequestController.cancelRequest);

// Item request routes (user sharing system)
router.post(
  "/add-item-request",
  protect,
  addItemRequestValidation,
  mobileRequestController.submitAddItemRequest
); //duration based donation

router.post(
  "/item-request",
  protect,
  requestItemValidation,
  mobileRequestController.submitItemRequest
);

router.get(
  "/my-item-requests",
  protect,
  mobileRequestController.getUserItemRequests
);

router.delete(
  "/item-requests/:id",
  protect,
  mobileRequestController.cancelItemRequest
);

// Transaction routes
router.get(
  "/transactions",
  protect,
  getTransactionsValidation,
  mobileTransactionController.getUserTransactions
);

router.post(
  "/transactions/:transactionId/renew",
  protect,
  mobileTransactionController.requestRenewal
);

router.get(
  "/renewal-requests",
  protect,
  mobileTransactionController.getUserRenewalRequests
);

// Fine routes
router.get(
  "/fines",
  protect,
  getFinesValidation,
  mobileFineController.getUserFines
);

// Notification routes
router.get(
  "/notifications",
  protect,
  getNotificationsValidation,
  mobileNotificationController.getUserNotifications
);
router.post(
  "/notifications/:notificationId/read",
  protect,
  // csrfProtection,
  mobileNotificationController.markNotificationRead
);
router.post(
  "/notifications/mark-all-read",
  protect,
  // csrfProtection,
  mobileNotificationController.markAllNotificationsRead
);
router.delete(
  "/notifications/:notificationId",
  protect,
  // csrfProtection,
  mobileNotificationController.deleteNotification
);
router.post(
  "/notifications",
  protect,
  csrfProtection,
  mobileNotificationController.createNotification
);
router.get(
  "/notifications/settings",
  protect,
  mobileNotificationController.getNotificationSettings
);
router.put(
  "/notifications/settings",
  protect,
  // csrfProtection,
  mobileNotificationController.updateNotificationSettings
);

// Donation routes
router.post("/donations", ...donationMobileRoutes.createDonation);
router.get("/donations", ...donationMobileRoutes.getUserDonations);

// Service routes
router.get("/services", protect, mobileServiceController.getAvailableServices);

router.get(
  "/services/my-services",
  protect,
  mobileServiceController.getUserServices
);

router.post(
  "/services/request",
  protect,
  // csrfProtection,
  mobileServiceController.requestService
);

router.post(
  "/services/extend-borrowing",
  protect,
  csrfProtection,
  mobileServiceController.requestExtendedBorrowing
);

router.post(
  "/services/priority-reservation",
  protect,
  csrfProtection,
  mobileServiceController.requestPriorityReservation
);

router.get(
  "/services/usage-history",
  protect,
  mobileServiceController.getServiceUsageHistory
);


// Queue routes
router.get("/queue", protect, mobileQueueController.getQueuedItemsForUser);

router.get("/queue/:queueId", protect, mobileQueueController.getQueueDetailsByItem);

router.delete("/queue/:queueId/leave", protect, mobileQueueController.withdrawFromQueue);

module.exports = router;
