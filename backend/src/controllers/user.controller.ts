import { Request, Response } from "express";
import { registerUserService } from "../services/user.service";
import { registrationSchema } from "../validations/auth.validation";
import { loginSchema } from "../validations/auth.validation";
import { loginUserService } from "../services/user.service";

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
