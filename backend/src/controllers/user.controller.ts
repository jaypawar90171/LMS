import { Request, Response } from "express";
import { registerUserService } from "../services/user.service";
import { registrationSchema } from "../validations/auth.validation";
import { loginSchema } from "../validations/auth.validation";
import { loginUserService } from "../services/user.service";
import { forgotPasswordService } from "../services/user.service";
import { verifyResetPasswordService } from "../services/user.service";
import { resetPasswordService } from "../services/user.service";
import { email } from "zod";

export const registerUserController = async (req: Request, res: Response) => {
  try {
    const validatedData = registrationSchema.parse(req.body);

    const user = await registerUserService(validatedData);

    return res.status(201).json({
      message:
        "Registration successful. Your account is pending admin approval.",
      userId: user._id,
    });
  } catch (error: any) {
    console.error("Error during user registration:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error." });
  }
};

export const loginUserController = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const { user, token } = await loginUserService(validatedData);

    return res.status(201).json({
      message: "Login successful.",
      user: user,
      token: token,
    });
  } catch (error: any) {
    console.error("Error during user login:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error." });
  }
};

export const forgotPassswordController = async (
  req: Request,
  res: Response
) => {
  try {
    const { email } = req.body;

    const link = await forgotPasswordService(email);
    return res.status(200).json({ link: link });
  } catch (error: any) {
    console.error("Error during forgot password:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error." });
  }
};

export const verifyResetPasswordController = async (
  req: Request,
  res: Response
) => {
  try {
    const data = req.params;
    const result = await verifyResetPasswordService(data);

    if (typeof result === "string") {
      return res
        .status(400)
        .json({ error: "Password reset link is invalid or expired." });
    }

    console.log("Verified user email:", result.email);
    res.render("index", { email: result.email, status: "Not Verified" });
  } catch (error: any) {
    console.error("Error during verifying reset-password link:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error." });
  }
};

export const resetPasswordController = async (req: Request, res: Response) => {
  try {
    const { id, token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }
    const result = await resetPasswordService({
      id,
      token,
      newPassword,
      confirmPassword,
    });
    if (typeof result === "string") {
      return res
        .status(400)
        .json({ error: "Password reset link is invalid or expired." });
    }
    console.log("Password has chnaged");
    res.render("index", { email: result?.email, status: "verified" });
  } catch (error: any) {
    console.error("Error during resetting password:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error." });
  }
};

export const logoutController = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  } catch (error) {}
};
