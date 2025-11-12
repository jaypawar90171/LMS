import { Router } from "express";
import {
  createIssueRequestController,
  dashboardSummaryController,
  deleteNotificationController,
  deleteRequestedItemController,
  expressDonationInterestController,
  extendIssuedItemController,
  getAllFinesController,
  getCategoriesController,
  getCategoryItemsController,
  getDonationDetailsController,
  getHistoryController,
  getIssuedItemsController,
  getItemController,
  getMyDonationsController,
  getMyIssueRequestsController,
  getNewArrivalsController,
  getNewRequestedItemController,
  getNewSpecificRequestedItemController,
  getProfileDetailsController,
  getQueuedItemsController,
  getQueueItemController,
  getRequestedItemsController,
  getUserNotificationController,
  markAsReadController,
  registerUserController,
  requestItemController,
  requestNewItemController,
  returnItemRequestController,
  searchItemsController,
  updateNotificationPreferenceController,
  updatePasswordController,
  updateProfileController,
  updateProfilePictureController,
  uploadPhotoController,
  withdrawDonationController,
  withdrawFromQueueController,
} from "../controllers/user.controller";
import { loginUserController } from "../controllers/user.controller";
import { forgotPassswordController } from "../controllers/user.controller";
import { resetPasswordController } from "../controllers/user.controller";
import { verifyResetPasswordController } from "../controllers/user.controller";
import { logoutController } from "../controllers/user.controller";
import { authUser } from "../middleware/auth.middleware";
import { upload } from "../config/upload";
import { markAllAsReadController } from "../controllers/admin.controller";

const router = Router();

/* ========================= AUTH ========================= */
router.post("/auth/register", registerUserController);

router.post("/auth/login", loginUserController);

router.post("/auth/forgot-password", forgotPassswordController);

router.get("/auth/reset-password/:id/:token", verifyResetPasswordController);

router.post("/auth/reset-password/:id/:token", resetPasswordController);

router.get("/logout", logoutController);

/* ========================= DASHBOARD ========================= */
router.get("/dashboard/:userId", authUser, dashboardSummaryController);

/* ========================= INVENTORY ========================= */
router.get("/items/issued", authUser, getIssuedItemsController);

router.get("/inventory/categories", authUser, getCategoriesController);

router.get("/inventory/categories/items/:categoryId", authUser, getCategoryItemsController);

router.get("/inventory/categories/:itemId", authUser, getItemController);

router.get("/:userId/requests", authUser, getRequestedItemsController);

//previous flow of user request item
// router.post("/issue-requests", authUser, createIssueRequestController);

router.post("/:itemId/request-item", authUser, requestItemController);

router.get("/items/:itemId/extend-period", authUser, extendIssuedItemController);

router.post("/items/:itemId/return-item", authUser, returnItemRequestController);

router.get("/items/new-arrivals", authUser, getNewArrivalsController);

router.get("/history", authUser, getHistoryController);

/* ========================= New Requested Items ========================= */
router.post("/items/new/request-item", authUser, requestNewItemController);

router.get("/items/requested-items", authUser, getNewRequestedItemController);

router.get("/items/requested-item/:itemId", authUser, getNewSpecificRequestedItemController);

router.delete("/items/requested-item/:itemId", authUser, deleteRequestedItemController);

/* ========================= QUEUE MANAGEMENT ========================= */
router.get("/items/queues/queued", authUser, getQueuedItemsController);

router.get("/items/queues/:queueId", authUser, getQueueItemController);

router.delete("/items/queues/:queueId", authUser, withdrawFromQueueController);


/* ========================= SEARCH ========================= */
router.get("/search/items", authUser, searchItemsController);

/* ========================= SETTINGS ========================= */
router.get("/account/fines", authUser, getAllFinesController);

router.get("/account/profile", authUser, getProfileDetailsController);

router.put("/account/profile", authUser, updateProfileController);

router.put("/account/password", authUser, updatePasswordController);

router.put("/account/notifications", authUser, updateNotificationPreferenceController);

router.put("/account/profile/picture", authUser, upload.single("image"), updateProfilePictureController);

/* ========================= DONATION ========================= */
router.post("/items/donations/express-interest", authUser, expressDonationInterestController);

router.get("/items/donations/my-donations", authUser, getMyDonationsController);

router.get("/items/donations/:donationId", authUser, getDonationDetailsController);

router.delete("/items/donations/:donationId/withdraw", authUser, withdrawDonationController);

router.post("/upload/image", authUser, upload.single("image"), uploadPhotoController);

/* ========================= NOTIFICATION ========================= */
router.get("/notifications", authUser, getUserNotificationController);

router.patch("/notifications/mark-as-read", authUser, markAsReadController);

router.delete("/notifications", authUser, deleteNotificationController);

export default router;
