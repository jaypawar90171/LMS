import User from "../models/user.model";
import { Types } from "mongoose";
import { Request, Response } from "express";
import {
  CategorySchema,
  CategoryUpdateSchema,
  FineSchema,
  FineUpdateSchema,
  InventoryItemsSchema,
  InventoryItemsUpdateSchema,
  RoleSchema,
  loginSchema,
} from "../validations/auth.validation";
import {
  generateIssuedItemsReportPDF,
  getFinesReportService,
  getInventoryReportService,
  getIssuedReportService,
  loginService,
  updateFineService,
} from "../services/admin.service";
import { forgotPasswordService } from "../services/admin.service";
import { verifyResetPasswordService } from "../services/admin.service";
import { resetPasswordService } from "../services/admin.service";
import { updateUserStatusService } from "../services/admin.service";
import { getDashboardSummaryService } from "../services/admin.service";
import { getAllUsersService } from "../services/admin.service";
import { createUserService } from "../services/admin.service";
import { createUserSchema } from "../validations/auth.validation";
import { getUserDetailsService } from "../services/admin.service";
import { forcePasswordResetService } from "../services/admin.service";
import { fetchRolesService } from "../services/admin.service";
import { createRoleService } from "../services/admin.service";
import { updateRoleService } from "../services/admin.service";
import { deleteRoleService } from "../services/admin.service";
import { fetchInventoryIetmsService } from "../services/admin.service";
import { createInventoryItemsService } from "../services/admin.service";
import { fetchSpecificItemServive } from "../services/admin.service";
import { updateItemService } from "../services/admin.service";
import { deleteItemService } from "../services/admin.service";
import { getCategoriesService } from "../services/admin.service";
import { createCategoryService } from "../services/admin.service";
import { updateCategoryService } from "../services/admin.service";
import { deleteCategoryService } from "../services/admin.service";
import { getAllFinesService } from "../services/admin.service";
import { createFineService } from "../services/admin.service";
import { fetchUserFinesService } from "../services/admin.service";
import { generateInventoryReportPDF } from "../services/admin.service";
import { generateFinesReportPDF } from "../services/admin.service";

export const loginController = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const user = await loginService(validatedData);
    if (!user) {
      return res.status(400).json({ message: "invalid creadentials" });
    }

    return res.status(200).json(user);
  } catch (error: any) {
    console.error("Login error:", error.message);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
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

export const updateUserStatusController = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!userId || !status) {
      return res.status(400).json({ message: "userId or status required" });
    }

    const updatedUser = await updateUserStatusService(userId, status);

    return res.status(200).json({
      message: "User status updated successfully.",
      user: updatedUser,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "Internal server error.",
    });
  }
};

export const getDashboardSummaryController = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      totalItems,
      activeUsers,
      overdueItems,
      categories,
      recentActivity,
    } = await getDashboardSummaryService();
    return res.status(200).json({
      totalItems,
      activeUsers,
      overdueItems,
      categories,
      recentActivity,
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getAllUsersController = async (req: Request, res: Response) => {
  try {
    const users = await getAllUsersService();

    return res.status(200).json({
      message: "Users fetched successfully.",
      users: users,
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      error: "Internal server error.",
    });
  }
};

export const createUserController = async (req: Request, res: Response) => {
  try {
    const validatedData = createUserSchema.parse(req.body);
    const { fullName, email, userName, password, role, emp_id, ass_emp_id } =
      validatedData;

    if (!fullName || !email || !userName || !password) {
      return res.status(400).json({
        message:
          "Missing required fields: fullname, email, username, and password.",
      });
    }
    const newUser = await createUserService({
      fullName,
      email,
      userName,
      password,
      role,
      emp_id,
      ass_emp_id,
    });

    return res.status(201).json({
      message: "User created successfully.",
      user: newUser,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "Internal server error.",
    });
  }
};

export const getUserDetailsController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "User does not exists" });
    }

    const user = await getUserDetailsService(userId);
    return res
      .status(200)
      .json({ message: "Data Found for the user", user: user });
  } catch (error: any) {
    console.log("Error in crearing new user");
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "Internal server error.",
    });
  }
};

export const updateUserController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    if ("password" in req.body) {
      return res
        .status(400)
        .json({ message: "password cannot be chnaged from here" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const userObj = updatedUser.toObject();
    res.status(200).json(userObj);
  } catch (error: any) {
    console.log("Error in updating user");
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "Internal server error.",
    });
  }
};

export const forcePasswordResetController = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.params;

    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    if (!userId) {
      return res.status(400).json({ message: "user not found" });
    }

    const updatedUser = await forcePasswordResetService(userId);
    return res.status(200).json({ message: "chnages made", user: updatedUser });
  } catch (error: any) {
    console.log("Error in updating user");
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "Internal server error.",
    });
  }
};

export const fetchRolesController = async (req: Request, res: Response) => {
  try {
    const rolesWithPermissions = await fetchRolesService();

    return res
      .status(200)
      .json({ message: "Roles Fetched", roles: rolesWithPermissions });
  } catch (error: any) {
    console.log("Error in fetching roles");
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "Internal server error.",
    });
  }
};

export const createRoleController = async (req: Request, res: Response) => {
  try {
    const validatedData = RoleSchema.parse(req.body);
    const { roleName, description, permissions } = validatedData;

    if (!roleName || !description || !permissions) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newRole = await createRoleService({
      roleName,
      description,
      permissions,
    });

    return res.status(200).json({ message: "Role created", role: newRole });
  } catch (error: any) {
    console.log("Error in creating roles");
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "Internal server error.",
    });
  }
};

export const updateRoleController = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;

    if (!Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const validatedData = req.body;

    const updatedRole = await updateRoleService({ roleId, ...validatedData });

    if (!updatedRole) {
      return res.status(404).json({ error: "Role not found." });
    }

    return res.status(200).json({
      message: "Role updated successfully",
      data: updatedRole,
    });
  } catch (error: any) {
    console.log("Error in updating role");
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "Internal server error.",
    });
  }
};

export const deleteRoleController = async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;

    if (!Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const { message, data } = await deleteRoleService(roleId);

    return res.status(200).json({ message: message, data: data });
  } catch (error: any) {
    console.log("Error in updating role");
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "Internal server error.",
    });
  }
};

export const fetchInventoryItemsController = async (
  req: Request,
  res: Response
) => {
  try {
    const inventoryItems = await fetchInventoryIetmsService();
    return res.status(200).json({ inventoryItems: inventoryItems });
  } catch (error: any) {
    console.log("Error in updating role");
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "Internal server error.",
    });
  }
};

export const createInventoryItemsController = async (
  req: Request,
  res: Response
) => {
  try {
    const validatedData = InventoryItemsSchema.parse(req.body);
    const newItem = await createInventoryItemsService(validatedData);

    return res.status(201).json({
      message: "Inventory item created successfully",
      data: newItem,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry: ISBN/Barcode must be unique",
      });
    }

    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const fetchSpecificItemController = async (
  req: Request,
  res: Response
) => {
  try {
    const { itemId } = req.params;

    if (!Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ error: "Invalid itemId" });
    }

    const item = await fetchSpecificItemServive(itemId);
    return res.status(200).json({ item: item });
  } catch (error: any) {
    if (error.code === 404) {
      return res.status(409).json({
        message: "item not found",
      });
    }

    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const updateItemController = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;

    if (!Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ error: "Invalid itemId" });
    }

    const validatedData = InventoryItemsUpdateSchema.parse(req.body);

    const updatedItem = await updateItemService({ itemId, validatedData });

    return res.status(200).json({
      message: "Inventory item updated successfully",
      data: updatedItem,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }

    if (error.code === 404) {
      return res.status(409).json({
        message: "No such item exits",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry: ISBN/Barcode must be unique",
      });
    }

    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const deleteItemController = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;

    if (!Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ error: "Invalid itemId" });
    }

    const deletedItem = await deleteItemService(itemId);
    return res.status(200).json({
      message: "Inventory item deleted successfully",
      data: deletedItem,
    });
  } catch (error: any) {
    if (error.code === 404) {
      return res.status(409).json({
        message: "No such item exits",
      });
    }

    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
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

export const createCatgoryController = async (req: Request, res: Response) => {
  try {
    const validatedData = CategorySchema.parse(req.body);

    const category = await createCategoryService(validatedData);
    return res
      .status(200)
      .json({ message: "Category created", category: category });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }

    if (error.code === 404) {
      return res.status(409).json({
        message: "Category already exists",
      });
    }

    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const updateCategoryController = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;

    if (!Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ error: "Invalid categoryId" });
    }
    const validatedData = CategoryUpdateSchema.parse(req.body);
    const updatedCatgory = await updateCategoryService({
      categoryId,
      data: validatedData,
    });

    return res.status(200).json({
      message: "Category updated succesfully",
      category: updatedCatgory,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }

    if (error.code === 404) {
      return res.status(409).json({
        message: "No such category exits",
      });
    }

    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const deleteCategoryController = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;

    if (!Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ error: "Invalid categoryId" });
    }

    const result = await deleteCategoryService(categoryId);

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const getAllFinesController = async (req: Request, res: Response) => {
  try {
    const fines = await getAllFinesService();

    return res.status(200).json({
      message: "Fines fetched successfully",
      fines,
    });
  } catch (error: any) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const fetchUserFinesController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const fines = await fetchUserFinesService(userId);
    return res.status(200).json({ fines: fines });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const createFinesController = async (req: Request, res: Response) => {
  try {
    const validatedData = FineSchema.parse(req.body);
    const {
      userId,
      itemId,
      reason,
      amountIncurred,
      amountPaid,
      paymentDetails,
      managedByAdminId,
    } = validatedData;

    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    if (!Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ error: "Invalid itemId" });
    }

    const fine = await createFineService({
      userId,
      itemId,
      reason,
      amountIncurred,
      amountPaid,
      paymentDetails,
      managedByAdminId,
    });

    return res.status(201).json({
      message: "Fine created successfully",
      fine,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }

    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const updateFineController = async (req: Request, res: Response) => {
  try {
    const { fineId } = req.params;

    if (!Types.ObjectId.isValid(fineId)) {
      return res.status(400).json({ error: "Invalid fineId" });
    }

    const validatedData = FineUpdateSchema.parse(req.body);

    const updatedFine = await updateFineService({
      fineId,
      data: validatedData,
    });

    return res.status(200).json({
      message: "Fine updated successfully",
      fine: updatedFine,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }

    if (error.statusCode === 404) {
      return res.status(404).json({
        message: "No such fine exists",
      });
    }

    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const getInventoryReportPDF = async (req: Request, res: Response) => {
  try {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=inventory-report.pdf"
    );

    await generateInventoryReportPDF(res);
  } catch (error: any) {
    console.error("Error generating PDF:", error.message);
    res
      .status(500)
      .json({ message: "Failed to generate PDF", error: error.message });
  }
};

export const getFinesReportPDF = async (req: Request, res: Response) => {
  try {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=fines-report.pdf"
    );

    await generateFinesReportPDF(res);
  } catch (error: any) {
    console.error("Error generating PDF:", error.message);
    res
      .status(500)
      .json({ message: "Failed to generate PDF", error: error.message });
  }
};

export const getIssuedItemsReportPDF = async (req: Request, res: Response) => {
  try {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=issuedItems-report.pdf"
    );

    await generateIssuedItemsReportPDF(res);
  } catch (error: any) {
    console.error("Error generating PDF:", error.message);
    res
      .status(500)
      .json({ message: "Failed to generate PDF", error: error.message });
  }
};

export const getInventoryReportController = async (
  req: Request,
  res: Response
) => {
  try {
    const report = await getInventoryReportService();
    res.status(200).json({ report });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch inventory report",
      error: error.message,
    });
  }
};

export const getFinesReportController = async (req: Request, res: Response) => {
  try {
    const report = await getFinesReportService();
    res.status(200).json(report);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to fetch fines report", error: error.message });
  }
};

export const getIssuedReportController = async (
  req: Request,
  res: Response
) => {
  try {
    const report = await getIssuedReportService();
    res.status(200).json({ report });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to fetch issued report", error: error.message });
  }
};
