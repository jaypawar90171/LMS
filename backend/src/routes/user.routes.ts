import { Router } from "express";
import {
  dashboardSummaryController,
  expressDonationInterestController,
  extendIssuedItemController,
  getAllFinesController,
  getCategoriesController,
  getCategoryItemsController,
  getHistoryController,
  getIssuedItemsController,
  getItemController,
  getNewArrivalsController,
  getProfileDetailsController,
  getQueuedItemsController,
  getRequestedItemsController,
  issueOrQueueController,
  registerUserController,
  requestItemController,
  requestNewItemController,
  returnItemRequestController,
  updateNotificationPreferenceController,
  updatePasswordController,
  updateProfileController,
} from "../controllers/user.controller";
import { loginUserController } from "../controllers/user.controller";
import { forgotPassswordController } from "../controllers/user.controller";
import { resetPasswordController } from "../controllers/user.controller";
import { verifyResetPasswordController } from "../controllers/user.controller";
import { logoutController } from "../controllers/user.controller";
import { authUser } from "../middleware/auth.middleware";

const router = Router();

router.post("/auth/register", registerUserController);

router.post("/auth/login", loginUserController);

router.post("/auth/forgot-password", forgotPassswordController);

router.get("/auth/reset-password/:id/:token", verifyResetPasswordController);

router.post("/auth/reset-password/:id/:token", resetPasswordController);

router.get("/logout", logoutController);

router.get("/dashboard/:userId", dashboardSummaryController);

router.get("/items/issued/:userId", getIssuedItemsController);

router.get("/inventory/categories", getCategoriesController);

router.get(
  "/inventory/categories/:categoryId/items/",
  getCategoryItemsController
);

router.get("/inventory/categories/items/:itemId", getItemController);

router.get("/:userId/requests", getRequestedItemsController);

router.post("/:userId/requests", requestItemController);

router.get("/items/queud/:userId", getQueuedItemsController);

router.get(
  "/items/:itemId/extend-period",
  authUser,
  extendIssuedItemController
);

router.post(
  "/items/:itemId/return-item",
  authUser,
  returnItemRequestController
);

router.post("/items/request-item", authUser, requestNewItemController);

router.get("/items/new-arrivals", authUser, getNewArrivalsController);

router.post("/items/:itemId/issue-or-queue", authUser, issueOrQueueController);

router.get("/history", authUser, getHistoryController);

router.get("/account/fines", authUser, getAllFinesController);

router.get("/account/profile", authUser, getProfileDetailsController);

router.put("/account/profile", authUser, updateProfileController);

router.put("/account/password", authUser, updatePasswordController);

router.put("/account/notifications", authUser, updateNotificationPreferenceController);

router.post("/items/donations/express-interest", authUser, expressDonationInterestController);

export default router;
