import { Router } from "express";
import User from "../models/user.model";
import { loginController } from "../controllers/admin.controller";
import { forgotPassswordController } from "../controllers/admin.controller";
import { verifyResetPasswordController } from "../controllers/admin.controller";
import { resetPasswordController } from "../controllers/admin.controller";
import { logoutController } from "../controllers/admin.controller";
import { updateUserStatusController } from "../controllers/admin.controller";
import { getDashboardSummaryController } from "../controllers/admin.controller";
import { getAllUsersController } from "../controllers/admin.controller";
import { createUserController } from "../controllers/admin.controller";
import { getUserDetailsController } from "../controllers/admin.controller";
import { updateUserController } from "../controllers/admin.controller";
import { authUser } from "../middleware/auth.middleware";
import { forcePasswordResetController } from "../controllers/admin.controller";

const router = Router();

router.post("/auth/login", loginController);

router.post("/auth/forgot-password", forgotPassswordController);

router.get("/auth/reset-password/:id/:token", verifyResetPasswordController);

router.post("/auth/reset-password/:id/:token", resetPasswordController);

router.get("/auth/logout", authUser, logoutController);

router.post("/users/:userId/status", authUser, updateUserStatusController);

router.get('/dashboard/summary', authUser, getDashboardSummaryController);

router.get("/users", authUser, getAllUsersController);

router.post("/users", authUser, createUserController);

router.get("/users/:userId", authUser, getUserDetailsController);

router.put("/users/:userId", authUser, updateUserController);

router.put("/users/:userId/reset-password", authUser, forcePasswordResetController);

export default router;
