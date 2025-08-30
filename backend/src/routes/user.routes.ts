import { Router } from "express";
import { registerUserController } from "../controllers/user.controller";
import { loginUserController } from "../controllers/user.controller";

const router = Router();

router.post("/auth/register", registerUserController);

router.post("/auth/login", loginUserController);

router.post("/login", async (req, res) => {});

export default router;
