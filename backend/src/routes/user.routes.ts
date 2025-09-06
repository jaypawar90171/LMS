import { Router } from "express";
import {
  dashboardSummaryController,
  extendIssuedItemController,
  getCategoriesController,
  getCategoryItemsController,
  getIssuedItemsController,
  getItemController,
  getQueuedItemsController,
  getRequestedItemsController,
  registerUserController,
  requestItemController,
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

router.get("/inventory/categories/:categoryId/items/",getCategoryItemsController);

router.get("/inventory/categories/items/:itemId", getItemController);

router.get("/:userId/requests", getRequestedItemsController);

router.post("/:userId/requests", requestItemController);

router.get("/items/queud/:userId", getQueuedItemsController);

router.get("/items/:itemId/extend-period", authUser, extendIssuedItemController);

// router.post("/items/:itemId/join-queue");

// router.post("/items/donations/express-interest");

// router.post("/fines/:userId");

// router.get("/account/profile/");

// router.put("/account/profile");

// router.put("/account/password");

// router.put("/account/notifications");

export default router;
