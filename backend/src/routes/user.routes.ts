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

router.get("/logout", logoutController);

// router.get("/dashboard");

// router.get("/items/issued");

// router.get("/items/queud");

// router.get("/items/new-arrivals");

// router.get("/items/categories");

// router.post("/items/:itemId/request-issue");

// router.post("/items/:itemId/join-queue");

// router.post("/items/:itemId/extend-period");

// router.post("/items/request/new-item");

// router.post("/items/donations/express-interest");

// router.post("/fines/:userId");

// router.get("/account/profile/");

// router.put("/account/profile");

// router.put("/account/password");

// router.put("/account/notifications");

export default router;
