"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const user_controller_2 = require("../controllers/user.controller");
const user_controller_3 = require("../controllers/user.controller");
const user_controller_4 = require("../controllers/user.controller");
const user_controller_5 = require("../controllers/user.controller");
const user_controller_6 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_1 = require("../config/upload");
const router = (0, express_1.Router)();
/* ========================= AUTH ========================= */
router.post("/auth/register", user_controller_1.registerUserController);
router.post("/auth/login", user_controller_2.loginUserController);
router.post("/auth/forgot-password", user_controller_3.forgotPassswordController);
router.get("/auth/reset-password/:id/:token", user_controller_5.verifyResetPasswordController);
router.post("/auth/reset-password/:id/:token", user_controller_4.resetPasswordController);
router.get("/logout", user_controller_6.logoutController);
/* ========================= DASHBOARD ========================= */
router.get("/dashboard/:userId", auth_middleware_1.authUser, user_controller_1.dashboardSummaryController);
/* ========================= INVENTORY ========================= */
router.get("/items/issued", auth_middleware_1.authUser, user_controller_1.getIssuedItemsController);
router.get("/inventory/categories", auth_middleware_1.authUser, user_controller_1.getCategoriesController);
router.get("/inventory/categories/items/:categoryId", auth_middleware_1.authUser, user_controller_1.getCategoryItemsController);
router.get("/inventory/categories/:itemId", auth_middleware_1.authUser, user_controller_1.getItemController);
router.get("/:userId/requests", auth_middleware_1.authUser, user_controller_1.getRequestedItemsController);
router.post("/issue-requests", auth_middleware_1.authUser, user_controller_1.createIssueRequestController);
// router.post("/:userId/requests", authUser, requestItemController);
router.get("/items/:itemId/extend-period", auth_middleware_1.authUser, user_controller_1.extendIssuedItemController);
router.post("/items/:itemId/return-item", auth_middleware_1.authUser, user_controller_1.returnItemRequestController);
router.get("/items/new-arrivals", auth_middleware_1.authUser, user_controller_1.getNewArrivalsController);
router.get("/history", auth_middleware_1.authUser, user_controller_1.getHistoryController);
/* ========================= New Requested Items ========================= */
router.post("/items/request-item", auth_middleware_1.authUser, user_controller_1.requestNewItemController);
router.get("/items/requested-items", auth_middleware_1.authUser, user_controller_1.getNewRequestedItemController);
router.get("/items/requested-item/:itemId", auth_middleware_1.authUser, user_controller_1.getNewSpecificRequestedItemController);
router.delete("/items/requested-item/:itemId", auth_middleware_1.authUser, user_controller_1.deleteRequestedItemController);
/* ========================= QUEUE MANAGEMENT ========================= */
router.get("/items/queues/queued", auth_middleware_1.authUser, user_controller_1.getQueuedItemsController);
router.get("/items/queues/:queueId", auth_middleware_1.authUser, user_controller_1.getQueueItemController);
router.delete("/items/queues/:queueId", auth_middleware_1.authUser, user_controller_1.withdrawFromQueueController);
/* ========================= SEARCH ========================= */
router.get("/search/items", auth_middleware_1.authUser, user_controller_1.searchItemsController);
/* ========================= SETTINGS ========================= */
router.get("/account/fines", auth_middleware_1.authUser, user_controller_1.getAllFinesController);
router.get("/account/profile", auth_middleware_1.authUser, user_controller_1.getProfileDetailsController);
router.put("/account/profile", auth_middleware_1.authUser, user_controller_1.updateProfileController);
router.put("/account/password", auth_middleware_1.authUser, user_controller_1.updatePasswordController);
router.put("/account/notifications", auth_middleware_1.authUser, user_controller_1.updateNotificationPreferenceController);
router.put("/account/profile/picture", auth_middleware_1.authUser, upload_1.upload.single("image"), user_controller_1.updateProfilePictureController);
/* ========================= DONATION ========================= */
router.post("/items/donations/express-interest", auth_middleware_1.authUser, user_controller_1.expressDonationInterestController);
router.get("/items/donations/my-donations", auth_middleware_1.authUser, user_controller_1.getMyDonationsController);
router.get("/items/donations/:donationId", auth_middleware_1.authUser, user_controller_1.getDonationDetailsController);
router.delete("/items/donations/:donationId/withdraw", auth_middleware_1.authUser, user_controller_1.withdrawDonationController);
router.post("/upload/image", auth_middleware_1.authUser, upload_1.upload.single("image"), user_controller_1.uploadPhotoController);
/* ========================= NOTIFICATION ========================= */
router.get("/notifications", auth_middleware_1.authUser, user_controller_1.getUserNotificationController);
router.patch("/notifications/mark-as-read", auth_middleware_1.authUser, user_controller_1.markAsReadController);
router.delete("/notifications", auth_middleware_1.authUser, user_controller_1.deleteNotificationController);
exports.default = router;
