import { Request, Response } from "express";
import {
  createIssueRequestService,
  dashboardSummaryService,
  expressDonationInterestService,
  extendIssuedItemService,
  getAllFinesService,
  getCategoriesService,
  getCategoryItemsService,
  getHistoryService,
  getIssueddItemsSerive,
  getItemService,
  getMyIssueRequestsService,
  getNewArrivalsService,
  getProfileDetailsService,
  getQueuedItemsService,
  getQueueItemByIdService,
  getRequestedItemsSerice,
  registerUserService,
  requestItemService,
  requestNewItemService,
  returnItemRequestService,
  updateNotificationPreferenceService,
  updatePasswordService,
  updateProfileService,
  withdrawFromQueueService,
} from "../services/user.service";
import {
  InventoryItemsUpdateSchema,
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
import InventoryItem from "../models/item.model";

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
    const userId  = req.user.id;
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
      message: "Items fetched successfully",
      data: items,
    });
  } catch (error: any) {
    console.error("Error fetching items data:", error);
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
      message: "Requested items fetched successfully",
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
    const userId = req.user.id;

    if (!Types.ObjectId.isValid(userId) || !userId) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const queuedItems = await getQueuedItemsService(userId);

    return res.status(200).json({
      success: true,
      message: "Queue items fetched successfully",
      queuedItems,
    });
  } catch (error: any) {
    console.error("Error fetching queue items data:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error." });
  }
};

export const getQueueItemController = async (req: Request, res: Response) => {
  try {
    const { queueId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const queueItem = await getQueueItemByIdService(queueId);

     const isUserInQueue = queueItem.queueMembers.some(
      (member: any) => member.userId && member.userId._id.toString() === userId
    );

    if (!isUserInQueue) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this queue item",
      });
    }
    res.status(200).json({
      success: true,
      message: "Queue item fetched successfully",
      data: queueItem,
    });
  } catch (error: any) {
    console.error("Get queue item error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch queue item",
    });
  }
};

export const withdrawFromQueueController = async(req: Request, res: Response) => {
   try {
    const { queueId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await withdrawFromQueueService(queueId, userId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: any) {
    console.error("Withdraw from queue error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to withdraw from queue",
    });
  }
}

export const searchItemsController = async (req: Request, res: Response) => {
  try {
    const { query, category, status } = req.query;
    const userId = req.user.id;

    const searchCriteria: any = {};
    
    if (query) {
      searchCriteria.$or = [
        { title: { $regex: query, $options: 'i' } },
        { authorOrCreator: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { isbnOrIdentifier: { $regex: query, $options: 'i' } }
      ];
    }

    if (category) {
      searchCriteria['categoryId._id'] = category;
    }

    if (status) {
      searchCriteria.status = status;
    }

    const items = await InventoryItem.find(searchCriteria)
      .populate('categoryId', 'name description')
      .sort({ title: 1 })
      .limit(50);

    res.status(200).json({
      success: true,
      message: "Search completed successfully",
      data: items,
      total: items.length
    });

  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during search"
    });
  }
};

export const extendIssuedItemController = async (
  req: Request,
  res: Response
) => {
  try {
    const { itemId } = req.params;
    const userId = (req as any).user.id;

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

export const returnItemRequestController = async (
  req: Request,
  res: Response
) => {
  try {
    const { itemId } = req.params;
    const userId = (req as any).user?.id;
    const { status } = req.body;

    if (!Types.ObjectId.isValid(itemId) || !Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid itemId or userId" });
    }

    const { issuedItem, fine } = await returnItemRequestService(
      itemId,
      userId,
      status
    );

    return res.status(200).json({
      success: true,
      message: "Item return processed successfully",
      item: issuedItem,
      fine: fine,
    });
  } catch (error: any) {
    console.error("Error in returning an item:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error" });
  }
};

export const requestNewItemController = async (req: Request, res: Response) => {
  try {
    const validatedData = itemRequestUpdateSchema.parse(req.body);
    const userId = (req as any).user.id;

    const item = await requestNewItemService(userId, validatedData);
    return res.status(200).json({
      success: true,
      message: "Item request processed successfully",
      item: item,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Error in requesting new item:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error" });
  }
};

export const getNewArrivalsController = async (req: Request, res: Response) => {
  try {
    const newArrivals = await getNewArrivalsService();
    return res.status(200).json({
      success: true,
      message: "New Arrivals fetched successfully",
      items: newArrivals,
    });
  } catch (error: any) {
    console.error("Error in fetching an item:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error" });
  }
};

export const getHistoryController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id; // Fixed: use auth middleware user
    if (!userId) {
      return res.status(400).json({ message: "userId not found" });
    }

    const history = await getHistoryService(userId);
    return res.status(200).json({
      success: true,
      message: "User history fetched successfully",
      data: history,
    });
  } catch (error: any) {
    console.error("Error in getHistoryController:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error" });
  }
};

export const createIssueRequestController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: "Item ID is required",
      });
    }

    const result = await createIssueRequestService(userId.toString(), itemId);

    // Proper type checking with type guards
    if (result.type === "immediate" && "issuedItem" in result) {
      return res.status(201).json({
        success: true,
        message: result.message,
        data: {
          issuedItem: result.issuedItem,
          type: result.type,
        },
      });
    } else if (result.type === "queued" && "queuePosition" in result) {
      return res.status(201).json({
        success: true,
        message: result.message,
        data: {
          queuePosition: result.queuePosition,
          type: result.type,
        },
      });
    } else {
      // Fallback for any other type
      return res.status(201).json({
        success: true,
        message: result.message,
        data: { type: result.type },
      });
    }
  } catch (error: any) {
    console.error("Error creating issue request:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const getMyIssueRequestsController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user?.id;

    const requests = await getMyIssueRequestsService(userId);

    return res.status(200).json({
      success: true,
      message: "Issue requests fetched successfully",
      data: requests,
    });
  } catch (error: any) {
    console.error("Error in getMyIssueRequestsController:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error" });
  }
};

export const getAllFinesController = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ message: "userId not found" });
    }

    const fines = await getAllFinesService(userId);
    return res.status(200).json({
      success: true,
      message: "User fines fetched successfully",
      data: fines,
    });
  } catch (error: any) {
    console.error("Error in getAllFinesController:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error" });
  }
};

export const getProfileDetailsController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ message: "userId not found" });
    }

    const profile = await getProfileDetailsService(userId);

    return res.status(200).json({
      success: true,
      message: "Profile details fetched successfully",
      data: profile,
    });
  } catch (error: any) {
    console.error("Error in getProfileDetailsController:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error" });
  }
};

export const updateProfileController = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ message: "userId not found" });
    }

    const updatedProfile = await updateProfileService(userId, req.body);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedProfile,
    });
  } catch (error: any) {
    console.error("Error in updateProfileController:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error" });
  }
};

export const updateNotificationPreferenceController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ message: "userId not found" });
    }

    const updatedUser = await updateNotificationPreferenceService(
      userId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Notification preferences updated successfully",
      data: updatedUser.notificationPreference,
    });
  } catch (error: any) {
    console.error("Error in updateNotificationPreferenceController:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error" });
  }
};

export const updatePasswordController = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ message: "userId not found" });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both currentPassword and newPassword are required" });
    }

    await updatePasswordService(userId, currentPassword, newPassword);

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error: any) {
    console.error("Error in updatePasswordController:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error" });
  }
};

export const expressDonationInterestController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ message: "userId not found" });
    }

    const donation = await expressDonationInterestService(userId, req.body);

    return res.status(201).json({
      success: true,
      message: "Donation interest submitted successfully",
      data: donation,
    });
  } catch (error: any) {
    console.error("Error in expressDonationInterestController:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
};
