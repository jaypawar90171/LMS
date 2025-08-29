import { Router } from "express";
import User from "../models/user.model";

const router = Router();

router.post("/register", async (req, res) => {});

router.post("/login", async (req, res) => {
  const { email, password } = req.body();
  if (!email || !password) {
    return res.status(400).json({ msg: "Email and Passowrd are required" });
  }

  const result = await User.find({ email: email, password: password });
  if (!result) {
    return res.status(400).json({ msg: "Invalid Credentials" });
  }

  return res.status(201).json(result);
});

export default router;
