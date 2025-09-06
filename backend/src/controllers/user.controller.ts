import { Request, Response } from "express";
import {
  dashboardSummaryService,
  extendIssuedItemService,
  getCategoriesService,
  getCategoryItemsService,
  getIssueddItemsSerive,
  getItemService,
  getQueuedItemsService,
  getRequestedItemsSerice,
  registerUserService,
  requestItemService,
} from "../services/user.service";
import {
  itemRequestUpdateSchema,
  registrationSchema,
} from "../validations/auth.validation";
import { loginSchema } from "../validations/auth.validation";
import { loginUserService } from "../services/user.service";
import { forgotPasswordService } from "../services/user.service";
import { verifyResetPasswordService } from "../services/user.service";
import { resetPasswordService } from "../services/user.service";
import { Types } from "mongoose";
import { success } from "zod";

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

export const dashboardSummaryController = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.params;
    if (!Types.ObjectId.isValid(userId) || !userId) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const { issuedItems, queuedItems, newArrivals } =
      await dashboardSummaryService(userId);
    return res.status(200).json({
      success: true,
      message: "Dashboard data fetched successfully",
      data: { issuedItems, queuedItems, newArrivals },
    });
  } catch (error: any) {
    console.error("Error fetching dashboard data:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error." });
  }
};

export const getIssuedItemsController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!Types.ObjectId.isValid(userId) || !userId) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const issuedItems = await getIssueddItemsSerive(userId);
    return res.status(200).json({
      success: true,
      message: "Items fetched succesfully",
      data: issuedItems,
    });
  } catch (error: any) {
    console.error("Error fetching issued items data:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error." });
  }
};

export const getCategoriesController = async (req: Request, res: Response) => {
  try {
    const categories = await getCategoriesService();

    return res.status(200).json({
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error: any) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: "No categories found" });
    }

    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const getCategoryItemsController = async (
  req: Request,
  res: Response
) => {
  try {
    const { categoryId } = req.params;
    if (!Types.ObjectId.isValid(categoryId) || !categoryId) {
      return res.status(400).json({ error: "Invalid categoryId" });
    }

    const items = await getCategoryItemsService(categoryId);
    return res.status(200).json({
      success: true,
      message: "Items fetched succesfully",
      data: items,
    });
  } catch (error: any) {
    console.error("Error fetching fetching items data:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error." });
  }
};

export const getItemController = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    if (!Types.ObjectId.isValid(itemId) || !itemId) {
      return res.status(400).json({ error: "Invalid itemId" });
    }

    const items = await getItemService(itemId);
    return res.status(200).json({
      success: true,
      message: "Items fetched succesfully",
      data: items,
    });
  } catch (error: any) {
    console.error("Error fetching fetching items data:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error." });
  }
};

export const getRequestedItemsController = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.params;
    if (!Types.ObjectId.isValid(userId) || !userId) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const requestedItems = await getRequestedItemsSerice(userId);
    return res.status(200).json({
      success: true,
      message: "requestd items fetched succesfully",
      data: requestedItems,
    });
  } catch (error: any) {
    console.error("Error fetching requested items data:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error." });
  }
};

export const requestItemController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const validatedData = itemRequestUpdateSchema.parse(req.body);

    if (!Types.ObjectId.isValid(userId) || !userId) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const request = await requestItemService(userId, validatedData);

    return res.status(201).json({
      success: true,
      message: "Item requested successfully",
      request,
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Something went wrong",
    });
  }
};

export const getQueuedItemsController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!Types.ObjectId.isValid(userId) || !userId) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const queuedItems = await getQueuedItemsService(userId);
    return res.status(201).json({
      success: true,
      message: "queue items fetched successfully",
      queuedItems,
    });
  } catch (error: any) {
    console.error("Error fetching queue items data:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error." });
  }
};

export const extendIssuedItemController = async (
  req: Request,
  res: Response
) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;
    console.log(userId);

    if (!Types.ObjectId.isValid(itemId) || !Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid itemId or userId" });
    }

    const updatedItem = await extendIssuedItemService(itemId, userId);

    return res.status(200).json({
      success: true,
      message: "Issued item period extended successfully",
      updatedItem,
    });
  } catch (error: any) {
    console.error("Error extending issued item:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error" });
  }
};
