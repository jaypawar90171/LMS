import { Router } from "express";
import {
  createIssueRequestController,
  dashboardSummaryController,
  expressDonationInterestController,
  extendIssuedItemController,
  getAllFinesController,
  getCategoriesController,
  getCategoryItemsController,
  getHistoryController,
  getIssuedItemsController,
  getItemController,
  getMyIssueRequestsController,
  getNewArrivalsController,
  getProfileDetailsController,
  getQueuedItemsController,
  getQueueItemController,
  getRequestedItemsController,
  registerUserController,
  requestItemController,
  requestNewItemController,
  returnItemRequestController,
  updateNotificationPreferenceController,
  updatePasswordController,
  updateProfileController,
  withdrawFromQueueController,
} from "../controllers/user.controller";
import { loginUserController } from "../controllers/user.controller";
import { forgotPassswordController } from "../controllers/user.controller";
import { resetPasswordController } from "../controllers/user.controller";
import { verifyResetPasswordController } from "../controllers/user.controller";
import { logoutController } from "../controllers/user.controller";
import { authUser } from "../middleware/auth.middleware";

const router = Router();

/* ========================= AUTH ========================= */
router.post("/auth/register", registerUserController);

router.post("/auth/login", loginUserController);

router.post("/auth/forgot-password", forgotPassswordController);

router.get("/auth/reset-password/:id/:token", verifyResetPasswordController);

router.post("/auth/reset-password/:id/:token", resetPasswordController);

router.get("/logout", logoutController);

/* ========================= DASHBOARD ========================= */
router.get("/dashboard/:userId", dashboardSummaryController);

/* ========================= INVENTORY ========================= */
router.get("/items/issued", authUser, getIssuedItemsController);

router.get("/inventory/categories", authUser, getCategoriesController);

router.get("/inventory/categories/:categoryId/items/", authUser, getCategoryItemsController);

router.get("/inventory/categories/items/:itemId", authUser, getItemController);

router.get("/:userId/requests", authUser, getRequestedItemsController);

router.post("/issue-requests", authUser, createIssueRequestController);

// router.get("/issue-requests/my-requests", authUser, getMyIssueRequestsController);

router.post("/:userId/requests", authUser, requestItemController);

router.get("/items/:itemId/extend-period", authUser, extendIssuedItemController);

router.post("/items/:itemId/return-item", authUser, returnItemRequestController);

router.post("/items/request-item", authUser, requestNewItemController);

router.get("/items/new-arrivals", authUser, getNewArrivalsController);

router.get("/history", authUser, getHistoryController);


/* ========================= QUEUE MANAGEMENT ========================= */
router.get("/items/queues/queued", authUser, getQueuedItemsController);

router.get("/items/queues/:queueId", authUser, getQueueItemController);

router.delete("/items/queues/:queueId", authUser, withdrawFromQueueController);


/* ========================= SETTINGS ========================= */
router.get("/account/fines", authUser, getAllFinesController);

router.get("/account/profile", authUser, getProfileDetailsController);

router.put("/account/profile", authUser, updateProfileController);

router.put("/account/password", authUser, updatePasswordController);

router.put(
  "/account/notifications",
  authUser,
  updateNotificationPreferenceController
);

/* ========================= DONATION ========================= */
router.post(
  "/items/donations/express-interest",
  authUser,
  expressDonationInterestController
);

export default router;
