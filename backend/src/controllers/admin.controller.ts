import User from "../models/user.model";
import mongoose, { Types } from "mongoose";
import { Request, Response } from "express";
import {
  CategorySchema,
  CategoryUpdateSchema,
  FineSchema,
  FineUpdateSchema,
  InventoryItemsSchema,
  InventoryItemsUpdateSchema,
  RoleSchema,
  SystemRestrictionsUpdateSchema,
  loginSchema,
  updateUserSchema,
} from "../validations/auth.validation";
import {
  addTemplateService,
  checkExpiredNotifications,
  deleteFineService,
  deleteUserService,
  exportDefaulterReport,
  exportIssuedItemsReport,
  exportQueueAnalytics,
  extendPeriodService,
  fetchAllPermissionsService,
  generateBarcodePDF,
  generateBarcodeString,
  generateIssuedItemsReportPDF,
  getAdminProfileService,
  getAllDonationService,
  getCategoryByIdService,
  getDefaulterReport,
  getFinesReportService,
  getInventoryReportService,
  getIssuedReportService,
  getNotificationTemplatesService,
  getQueueAnalytics,
  getSystemRestrictionsService,
  handleUserResponse,
  issueItemFromQueueService,
  loginService,
  processItemReturn,
  recordPaymentService,
  removeUserFromQueueService,
  resetPasswordAdminService,
  sendReminderService,
  updateAdminPasswordServive,
  updateDonationStatusService,
  updateFineService,
  updateNotificationTemplateService,
  updateSystemRestrictionsService,
  updateTemplateService,
  viewQueueService,
  waiveFineService,
} from "../services/admin.service";
import { forgotPasswordService } from "../services/admin.service";
import { verifyResetPasswordService } from "../services/admin.service";
import { resetPasswordService } from "../services/admin.service";
import { updateUserStatusService } from "../services/admin.service";
import { getDashboardSummaryService } from "../services/admin.service";
import { getAllUsersService } from "../services/admin.service";
import { createUserSchema } from "../validations/auth.validation";
import { getUserDetailsService } from "../services/admin.service";
import { forcePasswordResetService } from "../services/admin.service";
import { fetchRolesService } from "../services/admin.service";
import { createRoleService } from "../services/admin.service";
import { updateRoleService } from "../services/admin.service";
import { deleteRoleService } from "../services/admin.service";
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
import { fetchInventoryItemsService } from "../services/admin.service";
import { uploadFile } from "../config/upload";
import fs from "fs";
import Role from "../models/role.model";
import { sendEmail } from "../config/emailService";
import { aw } from "@upstash/redis/zmscore-CgRD7oFR";
import { Permission } from "../models/permission.model";
import Fine from "../models/fine.model";
import { Irole } from "../interfaces/role.interface";
import IssuedItem from "../models/issuedItem.model";
import IssueRequest from "../models/itemRequest.model";
import InventoryItem from "../models/item.model";
import Queue from "../models/queue.model";
import { NotificationService } from "../utility/notificationService";

export const loginController = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const user = await loginService(validatedData);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    return res.status(200).json(user);
  } catch (error: any) {
    if (error.name === "ZodError" && error.errors?.length) {
      const messages = error.errors.map((err: any) => err.message);
      return res.status(400).json({ errors: messages });
    }
    return res.status(error.statusCode || 500).json({
      error: error.message || "Internal server error",
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
      recentOrders,
    } = await getDashboardSummaryService();
    return res.status(200).json({
      totalItems,
      activeUsers,
      overdueItems,
      categories,
      recentActivity,
      recentOrders,
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getAllUsersController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { users, totalUsers } = await getAllUsersService(page, limit);

    return res.status(200).json({
      message: "Users fetched successfully.",
      users: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
      },
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
    const {
      assignedRoles,
      permissions,
      relationshipType,
      employeeId,
      associatedEmployeeId,
      ...userData
    } = req.body;

    // Validate required fields
    if (!userData.email || !userData.username) {
      return res.status(400).json({
        error: "Email and username are required",
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [{ email: userData.email }, { username: userData.username }],
    });

    if (existingUser) {
      return res.status(409).json({
        error: "User with this email or username already exists.",
      });
    }

    // Handle relationship type and IDs
    if (relationshipType === "Employee") {
      if (!employeeId) {
        return res.status(400).json({
          error: "Employee ID is required for employees",
        });
      }
      userData.employeeId = employeeId;

      // Check if employee ID already exists
      const existingEmployee = await User.findOne({ employeeId });
      if (existingEmployee) {
        return res.status(409).json({
          error: "Employee ID already exists",
        });
      }
    } else if (relationshipType === "Family Member") {
      if (!associatedEmployeeId) {
        return res.status(400).json({
          error: "Associated employee ID is required for family members",
        });
      }
      userData.associatedEmployeeId = associatedEmployeeId;

      // Verify associated employee exists
      const associatedEmployee = await User.findOne({
        $or: [
          { employeeId: associatedEmployeeId },
          { _id: associatedEmployeeId },
        ],
      });
      if (!associatedEmployee) {
        return res.status(400).json({
          error: "Associated employee not found",
        });
      }
    }

    userData.relationshipType = relationshipType;

    // Handle roles
    let permissionsFromRoles: any[] = [];
    if (assignedRoles && assignedRoles.length > 0) {
      const roleDocs = await Role.find({ _id: { $in: assignedRoles } });

      if (roleDocs.length !== assignedRoles.length) {
        return res.status(400).json({
          error: "One or more invalid role IDs provided",
        });
      }

      userData.roles = assignedRoles;
      permissionsFromRoles = roleDocs.flatMap((role) => role.permissions || []);
    }

    // Handle additional permissions
    let additionalPermissionIds: any[] = [];
    if (permissions && permissions.length > 0) {
      const permissionDocs = await Permission.find({
        permissionKey: { $in: permissions },
      });

      if (permissionDocs.length !== permissions.length) {
        const foundKeys = permissionDocs.map((p) => p.permissionKey);
        const missingKeys = permissions.filter(
          (key: any) => !foundKeys.includes(key)
        );
        return res.status(400).json({
          error: `Invalid permission keys: ${missingKeys.join(", ")}`,
        });
      }
      additionalPermissionIds = permissionDocs.map((p) => p._id);
    }

    // Combine permissions from roles and additional permissions
    const allPermissions = [
      ...new Set([...permissionsFromRoles, ...additionalPermissionIds]),
    ];
    userData.permissions = allPermissions;

    // Set default status if not provided
    if (!userData.status) {
      userData.status = "Inactive";
    }

    // Create the user
    const user = await User.create(userData);

    // Populate the created user for response
    const populatedUser = await User.findById(user._id)
      .populate("roles")
      .populate("permissions");

    // Send welcome email
    try {
      const subject = "Welcome to the Library Management System!";
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #0056b3;">Welcome, ${userData.fullName}!</h2>
          <p>An account has been successfully created for you in our Library Management System (LMS).</p>
          <p>You can now log in using the following credentials:</p>
          <ul style="list-style-type: none; padding: 0;">
            <li style="margin-bottom: 10px;"><strong>Username:</strong> ${
              userData.username || "N/A"
            }</li>
            <li style="margin-bottom: 10px;"><strong>Temporary Password:</strong> <code style="background-color: #f4f4f4; padding: 3px 6px; border-radius: 4px; font-size: 1.1em;">${
              userData.password
            }</code></li>
          </ul>
          <p>For your security, you will be required to change this password after your first login.</p>
          <p>Thank you for joining us!</p>
        </div>
      `;

      await sendEmail(userData.email, subject, htmlBody);
      console.log("Welcome email sent successfully to:", userData.email);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      message: "User created successfully",
      user: populatedUser?.toObject() || user.toObject(),
    });
  } catch (error: any) {
    console.error("Error creating user:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({
        error: `User with this ${field} already exists`,
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        error: errors.join(", "),
      });
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create user",
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

// export const updateUserController = async (req: Request, res: Response) => {
//   try {
//     const { userId } = req.params;

//     if (!Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ error: "Invalid userId" });
//     }

//     const { permissions, assignedRoles, ...updateData } = req.body;

//     if ("password" in req.body) {
//       return res
//         .status(400)
//         .json({ message: "password cannot be chnaged from here" });
//     }

//     if (permissions && Array.isArray(permissions)) {
//       const permissionDocs = await Permission.find({
//         permissionKey: { $in: permissions },
//       });

//       const permissionIds = permissionDocs.map((p) => p._id);

//       const user = await User.findById(userId).populate<{ roles: Irole[] }>(
//         "roles"
//       );
//       if (!user) {
//         return res.status(404).json({ error: "User not found" });
//       }

//       const permissionsFromRoles = user.roles.flatMap(
//         (role) => role.permissions || []
//       );
//       const allPermissionIds = [...permissionsFromRoles, ...permissionIds];

//       updateData.permissions = [
//         ...new Set(allPermissionIds.map((id) => id.toString())),
//       ];
//     }

//     if (assignedRoles && Array.isArray(assignedRoles)) {
//       updateData.roles = assignedRoles;
//     }

//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { $set: updateData },
//       { new: true, runValidators: true }
//     ).populate("roles permissions");

//     if (!updatedUser) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     res.status(200).json(updatedUser.toObject());
//   } catch (error: any) {
//     console.log("Error in updating user");
//     const statusCode = error.statusCode || 500;
//     return res.status(statusCode).json({
//       error: error.message || "Internal server error.",
//     });
//   }
// };

export const updateUserController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const {
      permissions,
      assignedRoles,
      relationshipType,
      employeeId,
      associatedEmployeeId,
      password, // Remove password from update data
      ...updateData
    } = req.body;

    console.log("🔄 Update request received for user:", userId);
    console.log("📦 Update data:", updateData);
    console.log("🎯 Roles:", assignedRoles);
    console.log("🔑 Permissions:", permissions);

    // Check if user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Handle relationship type and IDs
    if (relationshipType === "Employee") {
      updateData.employeeId = employeeId;
      updateData.associatedEmployeeId = undefined; // Clear family member field
    } else if (relationshipType === "Family Member") {
      updateData.associatedEmployeeId = associatedEmployeeId;
      updateData.employeeId = undefined; // Clear employee field
    }

    if (relationshipType) {
      updateData.relationshipType = relationshipType;
    }

    // Handle roles FIRST - this is likely causing the hang
    if (assignedRoles && Array.isArray(assignedRoles)) {
      // Validate that all role IDs exist
      const validRoles = await Role.find({ _id: { $in: assignedRoles } });
      if (validRoles.length !== assignedRoles.length) {
        return res.status(400).json({
          error: "One or more invalid role IDs provided",
        });
      }
      updateData.roles = assignedRoles;
    }

    // Handle permissions - SIMPLIFIED to avoid circular references
    if (permissions && Array.isArray(permissions)) {
      const permissionDocs = await Permission.find({
        permissionKey: { $in: permissions },
      });

      const permissionIds = permissionDocs.map((p) => p._id);

      // Get permissions from the assigned roles
      let permissionsFromRoles: any[] = [];
      if (updateData.roles && updateData.roles.length > 0) {
        const roleDocs = await Role.find({ _id: { $in: updateData.roles } });
        permissionsFromRoles = roleDocs.flatMap(
          (role) => role.permissions || []
        );
      }

      // Combine role permissions and additional permissions
      const allPermissionIds = [...permissionsFromRoles, ...permissionIds];
      updateData.permissions = [
        ...new Set(allPermissionIds.map((id) => id.toString())),
      ];
    }

    console.log("✅ Final update data:", updateData);

    // Use lean() to avoid mongoose document issues and simplify the query
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
        lean: true, // Add this to return plain JavaScript object
      }
    )
      .populate("roles", "roleName description") // Only populate specific fields
      .populate("permissions", "permissionKey description") // Only populate specific fields
      .exec(); // Explicitly execute the query

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found after update" });
    }

    console.log("✅ User updated successfully:", updatedUser._id);

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("❌ Error in updating user:", error);

    // More specific error handling
    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        error: "Invalid data format",
      });
    }

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

export const deleteUserController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await deleteUserService(userId);
    return res.status(200).json(result);
  } catch (error: any) {
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
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  try {
    const { items, totalItems } = await fetchInventoryItemsService(page, limit);

    return res.status(200).json({
      inventoryItems: items,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
      },
    });
  } catch (error: any) {
    console.error("Error in fetching inventory items:", error);
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
    const file = req.file;
    let mediaUrl;

    if (file) {
      const result = await uploadFile(file.path);

      if (result) {
        mediaUrl = result.secure_url;
      }

      fs.unlinkSync(file.path);
    }

    const barcode = await generateBarcodeString();

    const dataToSave = {
      ...validatedData,
      mediaUrl: mediaUrl,
      barcode: barcode,
    };
    const newItem = await createInventoryItemsService(dataToSave);

    return res.status(201).json({
      message: "Inventory item created successfully",
      data: newItem,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation error in createInventoryItemsController",
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

const checkUserEligibility = async (userId: Types.ObjectId) => {
  // Check if user has any overdue items
  const overdueItems = await IssuedItem.find({
    userId,
    dueDate: { $lt: new Date() },
    status: "Issued",
  });

  if (overdueItems.length > 0) {
    return {
      eligible: false,
      reason: `User has ${overdueItems.length} overdue item(s)`,
    };
  }

  // Check if user has reached maximum issue limit (e.g., 5 items)
  const currentIssuedItems = await IssuedItem.countDocuments({
    userId,
    status: "Issued",
  });

  const maxIssuedItems = 5; // This could be configurable
  if (currentIssuedItems >= maxIssuedItems) {
    return {
      eligible: false,
      reason: `User has reached maximum issue limit of ${maxIssuedItems} items`,
    };
  }

  return { eligible: true };
};

const calculateDueDate = (defaultReturnPeriod?: number) => {
  const defaultPeriod = defaultReturnPeriod || 14; // Default 14 days
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + defaultPeriod);
  return dueDate;
};

export const getPendingIssueRequestsController = async (
  req: Request,
  res: Response
) => {
  try {
    const accessToken = req.headers.authorization?.split(" ")[1];
    if (!accessToken) {
      return res.status(401).json({ message: "No access token provided" });
    }

    const requests = await IssueRequest.find({ status: "pending" })
      .populate("userId", "fullName email employeeId")
      .populate("itemId", "title authorOrCreator availableCopies categoryId")
      .sort({ requestedAt: -1 });

    res.json({ requests });
  } catch (error: any) {
    console.error("Error fetching pending requests:", error);
    res.status(500).json({ message: "Error fetching pending requests" });
  }
};

export const issueItemController = async (req: Request, res: Response) => {
  try {
    const { userId, itemId } = req.body;
    const adminId = (req as any).user?.id;

    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid user ID or item ID" });
    }

    // Check if user exists and is active
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check user eligibility
    const eligibility = await checkUserEligibility(new Types.ObjectId(userId));
    if (!eligibility.eligible) {
      return res.status(400).json({ message: eligibility.reason });
    }

    // Check if item exists and is available
    const item = await InventoryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.availableCopies <= 0) {
      return res.status(400).json({ message: "Item not available" });
    }

    if (item.status !== "Available") {
      return res.status(400).json({ message: `Item is ${item.status}` });
    }

    // Calculate due date
    const dueDate = calculateDueDate(item.defaultReturnPeriod);

    // Create issued item record
    const issuedItem = new IssuedItem({
      itemId,
      userId,
      issuedDate: new Date(),
      dueDate,
      issuedBy: adminId,
      status: "Issued",
    });

    await issuedItem.save();

    // Update item available copies
    item.availableCopies -= 1;
    if (item.availableCopies === 0) {
      item.status = "Issued";
    }
    await item.save();

    res.json({
      message: "Item issued successfully",
      issuedItem: {
        _id: issuedItem._id,
        itemTitle: item.title,
        userName: user.fullName,
        dueDate: issuedItem.dueDate,
      },
    });
  } catch (error: any) {
    console.error("Error issuing item:", error);
    res.status(500).json({ message: "Error issuing item" });
  }
};

export const approveIssueRequestController = async (
  req: Request,
  res: Response
) => {
  try {
    const { requestId } = req.params;
    const adminId = (req as any).user?.id;

    if (!Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid request ID" });
    }

    const issueRequest = await IssueRequest.findById(requestId)
      .populate("userId")
      .populate("itemId");

    if (!issueRequest) {
      return res.status(404).json({ message: "Issue request not found" });
    }

    if (issueRequest.status !== "pending") {
      return res.status(400).json({ message: "Request already processed" });
    }

    // Check user eligibility
    const eligibility = await checkUserEligibility(issueRequest.userId._id);
    if (!eligibility.eligible) {
      return res.status(400).json({ message: eligibility.reason });
    }

    const item = await InventoryItem.findById(issueRequest.itemId._id);
    if (!item || item.availableCopies <= 0) {
      return res.status(400).json({ message: "Item no longer available" });
    }

    // Calculate due date
    const dueDate = calculateDueDate(item.defaultReturnPeriod);

    // Create issued item record
    const issuedItem = new IssuedItem({
      itemId: issueRequest.itemId._id,
      userId: issueRequest.userId._id,
      issuedDate: new Date(),
      dueDate,
      issuedBy: adminId,
      status: "Issued",
    });

    await issuedItem.save();

    // Update item available copies
    item.availableCopies -= 1;
    if (item.availableCopies === 0) {
      item.status = "Issued";
    }
    await item.save();

    // Update issue request status
    issueRequest.status = "approved";
    issueRequest.processedAt = new Date();
    issueRequest.processedBy = adminId;
    await issueRequest.save();

    res.json({
      message: "Issue request approved successfully",
      issuedItem: {
        _id: issuedItem._id,
        itemTitle: item.title,
        userName: (issueRequest.userId as any).fullName,
        dueDate: issuedItem.dueDate,
      },
    });
  } catch (error: any) {
    console.error("Error approving issue request:", error);
    res.status(500).json({ message: "Error approving issue request" });
  }
};

export const rejectIssueRequestController = async (
  req: Request,
  res: Response
) => {
  try {
    const { requestId } = req.params;
    const adminId = (req as any).user?.id;

    if (!Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid request ID" });
    }

    const issueRequest = await IssueRequest.findById(requestId);

    if (!issueRequest) {
      return res.status(404).json({ message: "Issue request not found" });
    }

    if (issueRequest.status !== "pending") {
      return res.status(400).json({ message: "Request already processed" });
    }

    // Update issue request status
    issueRequest.status = "rejected";
    issueRequest.processedAt = new Date();
    issueRequest.processedBy = adminId;
    await issueRequest.save();

    res.json({ message: "Issue request rejected" });
  } catch (error: any) {
    console.error("Error rejecting issue request:", error);
    res.status(500).json({ message: "Error rejecting issue request" });
  }
};

export const extendPeriodController = async (req: Request, res: Response) => {
  try {
    const { issuedItemId } = req.params;
    const { extensionDays } = req.body;

    // Validate input
    if (!issuedItemId) {
      return res.status(400).json({
        success: false,
        message: "Issued item ID is required",
      });
    }

    if (
      !extensionDays ||
      typeof extensionDays !== "number" ||
      extensionDays <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid extension days (positive number) is required",
      });
    }

    // Call service to extend period
    const result = await extendPeriodService(issuedItemId, extensionDays);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Due date extended successfully",
    });
  } catch (error) {
    console.error("Error in extend period controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// export const createIssueRequestController = async (req: Request, res: Response) => {
//   try {
//     const { itemId } = req.body;
//     const userId = (req as any).user?.userId;
//     console.log(userId);
//     console.log(req.user.id);

//     if (!Types.ObjectId.isValid(itemId)) {
//       return res.status(400).json({ message: "Invalid item ID" });
//     }

//     // Check if item exists and is available
//     const item = await InventoryItem.findById(itemId);
//     if (!item) {
//       return res.status(404).json({ message: "Item not found" });
//     }

//     if (item.availableCopies <= 0) {
//       return res.status(400).json({ message: "Item not available" });
//     }

//     // Check if user already has a pending request for this item
//     const existingRequest = await IssueRequest.findOne({
//       userId,
//       itemId,
//       status: "pending"
//     });

//     if (existingRequest) {
//       return res.status(400).json({ message: "You already have a pending request for this item" });
//     }

//     // Check user eligibility
//     const eligibility = await checkUserEligibility(new Types.ObjectId(userId));
//     if (!eligibility.eligible) {
//       return res.status(400).json({ message: eligibility.reason });
//     }

//     // Create issue request
//     const issueRequest = new IssueRequest({
//       userId,
//       itemId,
//       status: "pending"
//     });

//     await issueRequest.save();

//     // Populate the response
//     await issueRequest.populate("itemId", "title authorOrCreator");

//     res.status(201).json({
//       message: "Issue request submitted successfully",
//       request: issueRequest
//     });
//   } catch (error: any) {
//     console.error("Error creating issue request:", error);
//     res.status(500).json({ message: "Error creating issue request" });
//   }
// };

export const getCategoriesController = async (req: Request, res: Response) => {
  try {
    const { tree } = req.query;
    const includeTree = tree === "true";

    const categories = await getCategoriesService(includeTree);
    return res.status(200).json({
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const createCategoryController = async (req: Request, res: Response) => {
  try {
    const validatedData = CategorySchema.parse(req.body);

    const category = await createCategoryService(validatedData);
    return res
      .status(200)
      .json({ message: "Category created successfully", category: category });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }

    if (error.statusCode === 409) {
      return res.status(409).json({
        message: error.message || "Category already exists",
      });
    }

    if (error.statusCode === 404) {
      return res.status(404).json({
        message: error.message || "Parent category not found",
      });
    }

    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const updateCategoryController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = CategorySchema.partial().parse(req.body);

    const category = await updateCategoryService(id, validatedData);
    return res.status(200).json({
      message: "Category updated successfully",
      category: category,
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
        message: error.message || "Category not found",
      });
    }

    if (error.statusCode === 409) {
      return res.status(409).json({
        message: error.message || "Category name conflict",
      });
    }

    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const deleteCategoryController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await deleteCategoryService(id);
    return res.status(200).json(result);
  } catch (error: any) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        message: error.message || "Category not found",
      });
    }

    if (error.statusCode === 400) {
      return res.status(400).json({
        message: error.message || "Cannot delete category",
      });
    }

    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const getCategoryByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const category = await getCategoryByIdService(id);
    return res.status(200).json({
      message: "Category fetched successfully",
      data: category,
    });
  } catch (error: any) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        message: error.message || "Category not found",
      });
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

export const deleteFinesController = async (req: Request, res: Response) => {
  try {
    const { fineId } = req.params;

    if (!Types.ObjectId.isValid(fineId)) {
      return res.status(400).json({ error: "Invalid fineId" });
    }

    const message = await deleteFineService(fineId);
    return res.status(200).json({ msg: message });
  } catch (error: any) {
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

export const recordPaymentController = async (req: Request, res: Response) => {
  try {
    const { fineId } = req.params;
    const { amountPaid, paymentMethod, referenceId, notes } = req.body;

    if (!Types.ObjectId.isValid(fineId)) {
      return res.status(400).json({ error: "Invalid fineId" });
    }

    const fine = await Fine.findById(fineId);
    if (!fine) {
      return res.status(404).json({ message: "Fine not found" });
    }

    if (fine.status !== "Outstanding") {
      return res
        .status(400)
        .json({ message: "Can only record payment for outstanding fines" });
    }

    if (amountPaid > fine.outstandingAmount) {
      return res
        .status(400)
        .json({ message: "Payment amount cannot exceed outstanding amount" });
    }

    const updatedFine = await recordPaymentService({
      fineId,
      amountPaid,
      paymentMethod,
      referenceId,
      notes,
      managedByAdminId: req.user?.id,
    });

    return res.status(200).json({
      message: "Payment recorded successfully",
      fine: updatedFine,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const waiveFineController = async (req: Request, res: Response) => {
  try {
    const { fineId } = req.params;
    const { waiverReason } = req.body;

    if (!Types.ObjectId.isValid(fineId)) {
      return res.status(400).json({ error: "Invalid fineId" });
    }

    if (!waiverReason) {
      return res.status(400).json({ message: "Waiver reason is required" });
    }

    const fine = await Fine.findById(fineId);
    if (!fine) {
      return res.status(404).json({ message: "Fine not found" });
    }

    if (fine.status !== "Outstanding") {
      return res
        .status(400)
        .json({ message: "Can only waive outstanding fines" });
    }

    const updatedFine = await waiveFineService({
      fineId,
      waiverReason,
      managedByAdminId: req.user?.id,
    });

    return res.status(200).json({
      message: "Fine waived successfully",
      fine: updatedFine,
    });
  } catch (error: any) {
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

export const getSystemRestrictionsController = async (
  req: Request,
  res: Response
) => {
  try {
    const restrictions = await getSystemRestrictionsService();
    res.status(200).json({
      message: "System restrictions fetched successfully",
      data: restrictions,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to fetch system restrictions",
    });
  }
};

export const updateSystemRestrictionsController = async (
  req: Request,
  res: Response
) => {
  try {
    const updateData = SystemRestrictionsUpdateSchema.parse(req.body);

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
      });
    }

    const updatedSettings = await updateSystemRestrictionsService(updateData);

    res.status(200).json({
      success: true,
      message: "System restrictions updated successfully",
      data: updatedSettings,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to update system restrictions",
    });
  }
};

export const getNotificationTemplatesController = async (
  req: Request,
  res: Response
) => {
  try {
    const templates = await getNotificationTemplatesService();

    if (!templates) {
      return res.status(404).json({
        success: false,
        message: "No notification templates found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification templates fetched successfully",
      data: templates,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching notification templates",
      error: error.message,
    });
  }
};

export const addNotoficationTemplateController = async (
  req: Request,
  res: Response
) => {
  try {
    const { key, emailSubject, emailBody, whatsappMessage } = req.body;

    if (!key || !emailSubject || !emailBody || !whatsappMessage) {
      return res
        .status(400)
        .json({ success: false, message: "All fields required" });
    }

    const updated = await addTemplateService(key, {
      emailSubject,
      emailBody,
      whatsappMessage,
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error in adding notification templates",
      error: error.message,
    });
  }
};

export const updateNotificationTemplate = async (
  req: Request,
  res: Response
) => {
  const { key } = req.params;
  const { emailSubject, emailBody, whatsappMessage } = req.body;

  const updated = await updateTemplateService(key, {
    emailSubject,
    emailBody,
    whatsappMessage,
  });
  res.json({ success: true, data: updated });
};

export const updateNotificationTemplateController = async (
  req: Request,
  res: Response
) => {
  try {
    const { templateKey } = req.params;
    const updateData = req.body;

    if (!templateKey) {
      return res.status(400).json({ message: "Template key is required" });
    }

    const updatedTemplate = await updateNotificationTemplateService({
      templateKey,
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: "Notification template updated successfully",
      template: updatedTemplate,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update notification template",
    });
  }
};

export const getAdminProfileController = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Admin not logged in" });
    }

    const adminProfile = await getAdminProfileService(userId);

    return res.status(200).json({
      success: true,
      message: "Admin profile fetched successfully",
      data: adminProfile,
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch profile",
    });
  }
};

export const updateAdminController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }
    const updateData = { ...req.body };

    if (req.file) {
      const result = await uploadFile(req.file.path);

      if (result) {
        updateData.profile = result.secure_url;
      }
      fs.unlinkSync(req.file.path);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser.toObject(),
    });
  } catch (error: any) {
    console.log(error.message);
    console.log("Error in updating user");
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "Internal server error.",
    });
  }
};

// export const updateAdminAvatarController = async (req: Request, res: Response) => {
//   try {
//     const { adminId } = req.params;
//     const { avatarUrl } = req.body();

//     if (!Types.ObjectId.isValid(adminId)) {
//       return res.status(400).json({ error: "Invalid adminId" });
//     }

//     if (!avatarUrl) {
//       return res.status(400).json({ message: "url not found" });
//     }
//     const result = await updateAdminAvatarService({ adminId, avatarUrl });

//     return res?.status(200).json({
//       success: true,
//       message: "Admin avatar updated successfully",
//       data: result,
//     });
//   } catch (error: any) {
//     console.log("Error in uploading avtar");
//     const statusCode = error.statusCode || 500;
//     return res.status(statusCode).json({
//       error: error.message || "Internal server error.",
//     });
//   }
// };

export const resetPasswordAdminController = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.params;
    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const user = await resetPasswordAdminService(userId);

    return res.status(200).json({
      success: true,
      message: "Admin avatar updated successfully",
      data: user,
    });
  } catch (error: any) {
    console.log("Error in reset password request");
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "Internal server error.",
    });
  }
};

export const updateAdminPasswordController = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.params;
    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const validatedData = updateUserSchema.parse(req.body);

    const user = await updateAdminPasswordServive({
      userId,
      password: validatedData.password,
    });

    return res.status(200).json({
      success: true,
      message: "Admin password updated successfully",
      data: user,
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

export const generateBarcodeController = async (
  req: Request,
  res: Response
) => {
  try {
    const barcodeString = await generateBarcodeString();
    return res.status(200).json({ barcode: barcodeString });
  } catch (error: any) {
    console.log("Error in barcode generation");
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "Internal server error.",
    });
  }
};

export const downloadBarcodeController = async (
  req: Request,
  res: Response
) => {
  try {
    const { itemId } = req.params;
    if (!Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ error: "Invalid itemId" });
    }
    if (!itemId) {
      return res.status(400).json({ message: "Barcode value is required" });
    }

    await generateBarcodePDF(itemId, res);
  } catch (error: any) {
    console.log("Error in barcode generation");
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "Internal server error.",
    });
  }
};

export const getAllDonationsController = async (
  req: Request,
  res: Response
) => {
  try {
    const donations = await getAllDonationService();
    return res.status(200).json({
      success: true,
      message: "Donations fetched successfully",
      data: donations,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export const updateDonationStatusController = async (
  req: Request,
  res: Response
) => {
  try {
    const { donationId } = req.params;
    const { status } = req.body;

    if (!["Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updatedDonation = await updateDonationStatusService(
      donationId,
      status as "Accepted" | "Rejected"
    );

    return res.status(200).json({
      success: true,
      message: `Donation ${status} successfully`,
      donation: updatedDonation,
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "Error updating donation status" });
  }
};

export const viewQueueController = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid itemId" });
    }

    const queue = await viewQueueService(itemId);
    return res.status(200).json({
      success: true,
      message: "Queue fetched successfully",
      donation: queue,
    });
  } catch (error: any) {
    console.error("Error in viewQueueController:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error" });
  }
};

export const issueItemFromQueueController = async (
  req: Request,
  res: Response
) => {
  try {
    const adminId = req.user._id;
    const { queueId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const issuedItem = await issueItemFromQueueService(
      queueId,
      userId,
      adminId
    );
    return res.status(200).json({
      success: true,
      message: "Item issued for the queue member successfully",
      donation: issuedItem,
    });
  } catch (error: any) {
    console.error("Error in issueItemFromQueueController:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error" });
  }
};

export const removeUserFromQueueController = async (
  req: Request,
  res: Response
) => {
  try {
    const { queueId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const result = await removeUserFromQueueService(queueId, userId);
    return res.status(200).json({
      success: true,
      message: result,
    });
  } catch (error: any) {
    console.error("Error in removeUserFromQueueController:", error);
    return res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Internal server error" });
  }
};

export const processReturnController = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid itemId" });
    }

    const result = await processItemReturn(itemId);
    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: any) {
    console.error("Error in processReturnController:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
};

export const userResponseController = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;
    const { accept } = req.body;

    if (typeof accept !== "boolean") {
      return res
        .status(400)
        .json({ message: "Accept field is required and must be boolean" });
    }

    const result = await handleUserResponse(userId.toString(), itemId, accept);
    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: any) {
    console.error("Error in userResponseController:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
};

export const checkExpiredNotificationsController = async (
  req: Request,
  res: Response
) => {
  try {
    await checkExpiredNotifications();
    return res.status(200).json({
      success: true,
      message: "Expired notifications processed successfully",
    });
  } catch (error: any) {
    console.error("Error in checkExpiredNotificationsController:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
};

export const fetchAllPermissionsController = async (
  req: Request,
  res: Response
) => {
  try {
    const permissions = await fetchAllPermissionsService();
    console.log("Permissions fetched successfully");
    return res.status(200).json({
      message: "Permissions fetched successfully",
      data: permissions,
    });
  } catch (error) {
    console.log("Error in fetching permissions");
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getAllQueuesController = async (req: Request, res: Response) => {
  try {
    const queues = await Queue.find()
      .populate("itemId", "title status availableCopies categoryId")
      .populate("queueMembers.userId", "fullName email")
      .populate("currentNotifiedUser", "fullName")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      message: "All queues fetched successfully",
      data: queues,
    });
  } catch (error: any) {
    console.error("Error in getAllQueuesController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const getQueueAnalyticsController = async (
  req: Request,
  res: Response
) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const analytics = await getQueueAnalytics(start, end);

    return res.status(200).json({
      success: true,
      message: "Analytics fetched successfully",
      data: analytics,
    });
  } catch (error: any) {
    console.error("Error in getQueueAnalyticsController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const exportQueueAnalyticsController = async (
  req: Request,
  res: Response
) => {
  try {
    const csvData = await exportQueueAnalytics();

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=queue-analytics.csv"
    );

    return res.send(csvData);
  } catch (error: any) {
    console.error("Error in exportQueueAnalyticsController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const exportIssuedItemsController = async (
  req: Request,
  res: Response
) => {
  try {
    const { startDate, endDate } = req.query;

    const csvData = await exportIssuedItemsReport(
      startDate as string,
      endDate as string
    );

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=issued-items-${
        new Date().toISOString().split("T")[0]
      }.csv`
    );

    return res.send(csvData);
  } catch (error: any) {
    console.error("Error in exportIssuedItemsController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const getDefaulterReportController = async (
  req: Request,
  res: Response
) => {
  try {
    const { overdueSince, categoryId, roleId } = req.query;

    console.log("Defaulters request received:", {
      overdueSince,
      categoryId,
      roleId,
    });

    const filters = {
      overdueSince: overdueSince as string,
      categoryId: categoryId as string,
      roleId: roleId as string,
    };

    const defaulters = await getDefaulterReport(filters);

    return res.status(200).json({
      success: true,
      data: defaulters,
    });
  } catch (error: any) {
    console.error("Error in getDefaulterReportController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const sendReminderController = async (req: Request, res: Response) => {
  try {
    const { issuedItemId, userId, itemId } = req.body;

    const result = await sendReminderService(issuedItemId, userId, itemId);

    return res.status(200).json({
      success: true,
      message: "Reminder sent successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Error in sendReminderController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send reminder",
    });
  }
};

export const exportDefaulterReportController = async (
  req: Request,
  res: Response
) => {
  try {
    const { overdueSince, categoryId, roleId } = req.query;

    const filters = {
      overdueSince: overdueSince as string,
      categoryId: categoryId as string,
      roleId: roleId as string,
    };

    const csvData = await exportDefaulterReport(filters);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=defaulter-report-${
        new Date().toISOString().split("T")[0]
      }.csv`
    );

    return res.send(csvData);
  } catch (error: any) {
    console.error("Error in exportDefaulterReportController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const getNotificationsController = async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      type,
      level,
      read,
      page = 1,
      limit = 20
    } = req.query;

    const filters = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      type: type as string,
      level: level as string,
      read: read !== undefined ? read === 'true' : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const result = await NotificationService.getAdminNotifications(filters);

    return res.status(200).json({
      success: true,
      data: result.notifications,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error("Error in getNotificationsController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

export const markAsReadController = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;

    const notification = await NotificationService.markAsRead(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification
    });
  } catch (error: any) {
    console.error("Error in markAsReadController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

export const markAllAsReadController = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const result = await NotificationService.markAllAsRead(userId);

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error: any) {
    console.error("Error in markAllAsReadController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

export const deleteNotificationController = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;

    const notification = await NotificationService.deleteNotification(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully"
    });
  } catch (error: any) {
    console.error("Error in deleteNotificationController:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};
