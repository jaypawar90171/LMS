import { Router } from "express";
import { registerUserController } from "../controllers/user.controller";
import { loginUserController } from "../controllers/user.controller";
import { forgotPassswordController } from "../controllers/user.controller";
import { resetPasswordController } from "../controllers/user.controller";
import { verifyResetPasswordController } from "../controllers/user.controller";
import { logoutController } from "../controllers/user.controller";

const router = Router();

router.post("/auth/register", registerUserController);

router.post("/auth/login", loginUserController);

router.post("/auth/forgot-password", forgotPassswordController);

router.get("/auth/reset-password/:id/:token", verifyResetPasswordController);

router.post("/auth/reset-password/:id/:token", resetPasswordController);

router.get('/logout', logoutController);

export default router;
