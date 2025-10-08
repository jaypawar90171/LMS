import User from "../models/user.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import Fine from "../models/fine.model";
import mongoose, { Types } from "mongoose";
import InventoryItem from "../models/item.model";
import IssuedIetm from "../models/issuedItem.model";
import Category from "../models/category.model";
import Activity from "../models/activity.model";
import { IUser } from "../interfaces/user.interface";
import Role from "../models/role.model";
import { Permission } from "../models/permission.model";
import { Response } from "express";
import PDFDocument from "pdfkit";
import Item from "../models/item.model";
import Setting from "../models/setting.model";
import Notification from "../models/notofication.modal";
import { UpdateTemplateData } from "../interfaces/updateTemplate";
import { v4 as uuidv4 } from "uuid";
import bwipjs from "bwip-js";
import Donation from "../models/donation.model";
import Queue from "../models/queue.model";
import IssuedItem from "../models/issuedItem.model";
import nodemailer from "nodemailer";
import { PopulatedDoc, Document } from "mongoose";
import { Icategory } from "../interfaces/category.interface";
import { sendWhatsAppMessage } from "../config/whatsapp";
import { sendEmail } from "../config/emailService";
import { getNotificationTemplate } from "../utility/getNotificationTemplate";
import { UserDefinedMessageInstance } from "twilio/lib/rest/api/v2010/account/call/userDefinedMessage";
import {
  IDefaulterListQuery,
  IDefaulterReportItem,
} from "../interfaces/report.interface";
import { IInventoryItem } from "../interfaces/inventoryItems.interface";
import type { Request as ExpressRequest } from "express";
import { IIssuedItem } from "../interfaces/issuedItems.interface";
import { DefaulterFilters, DefaulterItem } from "../interfaces/defaulter.interface";

interface loginDTO {
  email: string;
  password: string;
}

interface loginDTOWithRemember extends loginDTO {
  rememberMe: boolean;
}

export const loginService = async (data: loginDTOWithRemember) => {
  const { email, password, rememberMe } = data;
  if (!email || !password) {
    const err: any = new Error("Email and Password required");
    throw err;
  }

  const user = await User.findOne({
    email: email,
  })
    .select("+password")
    .exec();

  if (!user) {
    const err: any = new Error(`email '${email}' not found.`);
    err.statusCode = 404;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password!);
  if (!isMatch) {
    const err: any = new Error(`password not match.`);
    err.statusCode = 404;
    throw err;
  }

  const accessTokenPayload = { id: user._id, email: user.email };
  const refreshTokenPayload = { id: user._id };

  const accessToken = jwt.sign(accessTokenPayload, process.env.SECRET_KEY!, {
    expiresIn: "1d",
  });
  const refreshToken = jwt.sign(refreshTokenPayload, process.env.SECRET_KEY!, {
    expiresIn: "30d",
  });

  //add the last login time
  user.lastLogin = new Date();
  await user.save();

  return {
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
    },
    accessToken,
    refreshToken,
    rememberMe,
  };
};

export const forgotPasswordService = async (email: any) => {
  console.log(email);
  if (!email) {
    const err: any = new Error("Email is required");
    err.statusCode = 403;
    throw err;
  }

  const oldUser = await User.findOne({ email: email })
    .select("+password")
    .exec();

  if (!oldUser) {
    const err: any = new Error("Email does not exist");
    err.statusCode = 403;
    throw err;
  }

  const secret = process.env.SECRET_KEY + oldUser.password;
  const payload = {
    id: oldUser._id,
    email: oldUser.email,
    username: oldUser.username,
  };

  const token = jwt.sign(payload, secret, { expiresIn: "1h" });

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: oldUser.email,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #4CAF50;">Password Reset Request</h2>
        <p>Dear ${oldUser.username || oldUser.email},</p>
        <p>We received a request to reset the password for your account.</p>
        <p>Please click the button below to reset your password. This link is valid for <strong>1 Hour</strong>.</p>
        <a href="http://localhost:3000/api/admin/auth/reset-password/${
          oldUser._id
        }/${token}" 
           style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #007BFF; text-decoration: none; border-radius: 5px;">
           Reset Password
        </a>
        <p style="margin-top: 20px;">If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
        <p><a href="http://localhost:3000/api/admin/auth/reset-password/${
          oldUser._id
        }/${token}">http://localhost:3000/api/admin/auth/reset-password/${
      oldUser._id
    }/${token}</a></p>
        <p style="color: #888;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
        <p style="font-size: 12px; color: #888;">Sincerely,<br>The [Your Company/App Name] Team</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    const err: any = new Error("Failed to send password reset email");
    err.statusCode = 500;
    throw err;
  }

  const link = `http://localhost:3000/api/admin/auth/reset-password/${oldUser._id}/${token}`;
  if (oldUser.phoneNumber) {
    const message = `Hi ${oldUser.fullName}, you requested a password reset. Use this link (valid for 1 hour): ${link}`;
    sendWhatsAppMessage(oldUser.phoneNumber, message);
  }
  return link;
};

export const verifyResetPasswordService = async (data: any) => {
  const { id, token } = data;

  const oldUser = await User.findOne({ _id: id }).select("+password").exec();
  if (!oldUser) {
    const err: any = new Error("User does not exists");
    err.statusCode = 403;
    throw err;
  }
  const secret = process.env.SECRET_KEY + oldUser.password!;
  try {
    const verify = jwt.verify(token, secret);
    if (typeof verify === "object" && "email" in verify) {
      console.log("email:", verify.email);
    } else {
      throw new Error("Invalid token payload or missing email.");
    }
    return verify;
  } catch (error: any) {
    return "not verified";
  }
};

export const resetPasswordService = async (data: any) => {
  const { id, token, newPassword, confirmPassword } = data;
  try {
    const oldUser = await User.findOne({ _id: id }).select("+password").exec();
    if (!oldUser) {
      const err: any = new Error("User does not exists");
      err.statusCode = 403;
      throw err;
    }
    const secret = process.env.SECRET_KEY + oldUser.password!;
    const verify = jwt.verify(token, secret);

    const salt = await bcrypt.genSalt(10);
    const encryptedPassword = await bcrypt.hash(newPassword, salt);
    await User.updateOne(
      {
        _id: id,
      },
      {
        $set: { password: encryptedPassword },
      }
    );
    return verify;
  } catch (error) {}
};

export const updateUserStatusService = async (userId: any, status: string) => {
  if (status !== "Active" && status != "Inactive") {
    const err: any = new Error("Invalid status value provided.");
    err.statusCode = 400;
    throw err;
  }
  if (!Types.ObjectId.isValid(userId)) {
    const err: any = new Error("Invalid user ID format.");
    err.statusCode = 400;
    throw err;
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    const err: any = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  if (status === "Inactive") {
    // 1. Check issued inventory (Books, Courses, Toys) not returned
    const issuedItems = await InventoryItem.findOne({
      userId: targetUser._id,
      status: "Issued",
    });

    if (issuedItems) {
      const err: any = new Error(
        "User cannot be deactivated: issued items are not yet returned."
      );
      err.statusCode = 400;
      throw err;
    }

    // 2. Check unpaid fines
    const unpaidFine = await Fine.findOne({
      userId: targetUser._id,
      status: "Outstanding",
    });

    if (unpaidFine) {
      const err: any = new Error(
        "User cannot be deactivated: outstanding unpaid fines exist."
      );
      err.statusCode = 400;
      throw err;
    }
  }

  const updatedUser = await User.findOneAndUpdate(
    {
      _id: userId,
    },
    {
      $set: { status: status },
    },
    { new: true }
  );

  if (!updatedUser) {
    const err: any = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  // notifications
  if (status === "Active") {
    const { subject, body, whatsapp } = await getNotificationTemplate(
      "userActivated",
      { user: updatedUser.fullName },
      {
        subject: "Account Activated",
        body: `Hi ${updatedUser.fullName}, your account has been activated! You can now log in.`,
        whatsapp: `Hi ${updatedUser.fullName}, your account has been activated! 🎉`,
      }
    );

    if (updatedUser.email && updatedUser.notificationPreference?.email) {
      await sendEmail(updatedUser.email, subject, body);
    }

    if (
      updatedUser.phoneNumber &&
      updatedUser.notificationPreference?.whatsApp
    ) {
      await sendWhatsAppMessage(updatedUser.phoneNumber, whatsapp!);
    }
  }

  return updatedUser;
};

export const getDashboardSummaryService = async () => {
  const [
    totalItems,
    activeUsers,
    overdueItems,
    categories,
    recentActivityData,
    recentOrdersData,
  ] = await Promise.all([
    InventoryItem.countDocuments(),
    User.countDocuments({ status: "Active" }),
    IssuedItem.countDocuments({
      status: "Issued",
      dueDate: { $lt: new Date() },
    }),
    Category.countDocuments(),
    Activity.find({}).sort({ createdAt: -1 }).limit(10).exec(),
    IssuedItem.find({})
      .sort({ issuedDate: -1 })
      .limit(10)
      .populate("itemId", "title")
      .populate("userId", "fullName email")
      .exec(),
  ]);

  const recentActivity = recentActivityData.map((activity) => ({
    user: activity.actor?.name || "Unknown User",
    action: activity.actionType,
    item: activity.target?.name || "Unknown Item",
    date: activity.createdAt?.toISOString().split("T")[0] || "N/A",
  }));

  const recentOrders = (
    recentOrdersData as unknown as Array<{
      userId: { fullName: string } | null;
      itemId: { title: string } | null;
      status: string;
      issuedDate: Date;
    }>
  ).map((order) => ({
    user: order.userId ? order.userId.fullName : "Unknown User",
    item: order.itemId ? order.itemId.title : "Unknown Item",
    status: order.status,
    issuedDate: order.issuedDate
      ? order.issuedDate.toISOString().split("T")[0]
      : "N/A",
  }));

  return {
    totalItems,
    activeUsers,
    overdueItems,
    categories,
    recentActivity,
    recentOrders,
  };
};

export const getAllUsersService = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const totalUsers = await User.countDocuments({});
  const users = await User.find({})
    .select("-password")
    .populate("roles", "roleName")
    .populate("permissions", "permissionKey")
    .limit(limit)
    .skip(skip);

  return { users, totalUsers };
};

// export const createUserService = async ({
//   fullName,
//   email,
//   userName,
//   password,
//   role,
//   assignedRoles,
//   emp_id,
//   ass_emp_id,
//   passwordResetRequired,
// }: any) => {
//   try {
//     // Check for existing user
//     const existingUser = await User.findOne({
//       $or: [{ email }, { username: userName }],
//     });

//     if (existingUser) {
//       throw new Error("User with this email or username already exists.");
//     }

//     // Find and validate roles
//     const rolesToFind =
//       assignedRoles && assignedRoles.length > 0 ? assignedRoles : [role];
//     const userRoleDocuments = await Role.find({ _id: { $in: rolesToFind } });

//     if (userRoleDocuments.length !== rolesToFind.length) {
//       throw new Error("One or more specified roles could not be found.");
//     }

//     // Handle employee/family member logic
//     let employeeIdValue = emp_id;
//     let associatedEmployeeIdValue = undefined;

//     if (role === "Family Member") {
//       if (!ass_emp_id) {
//         throw new Error(
//           "Associated employee ID is required for a family member."
//         );
//       }
//       const associatedEmployee = await User.findOne({ employeeId: ass_emp_id });
//       if (!associatedEmployee) {
//         throw new Error(`Employee with ID '${ass_emp_id}' not found.`);
//       }
//       associatedEmployeeIdValue = associatedEmployee._id;
//       employeeIdValue = undefined;
//     }

//     // Create new user
//     const newUser = new User({
//       fullName,
//       email,
//       username: userName,
//       password,
//       roles: userRoleDocuments.map((r) => r._id),
//       employeeId: employeeIdValue,
//       associatedEmployeeId: associatedEmployeeIdValue,
//       passwordResetRequired,
//       status: "Inactive",
//     });

//     // Save user first
//     const savedUser = await newUser.save();
//     if (!savedUser) {
//       throw new Error("Failed to create user");
//     }

//     console.log("start to sending an email");
//     try {
//       const subject = "Welcome to the Library Management System!";
//       const htmlBody = `
//         <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
//           <h2 style="color: #0056b3;">Welcome, ${fullName}!</h2>
//           <p>An account has been successfully created for you in our Library Management System (LMS).</p>
//           <p>You can now log in using the following credentials:</p>
//           <ul style="list-style-type: none; padding: 0;">
//             <li style="margin-bottom: 10px;"><strong>Username:</strong> ${userName}</li>
//             <li style="margin-bottom: 10px;"><strong>Temporary Password:</strong> <code style="background-color: #f4f4f4; padding: 3px 6px; border-radius: 4px; font-size: 1.1em;">${password}</code></li>
//           </ul>
//           <p>For your security, you will be required to change this password after your first login.</p>
//           <p>Thank you for joining us!</p>
//         </div>
//       `;

//       await sendEmail(email, subject, htmlBody);
//       console.log("Welcome email sent successfully to:", email);
//     } catch (emailError) {
//       console.error("Failed to send welcome email:", emailError);
//       // Don't throw here - we still want to return the created user
//     }

//     return savedUser;
//   } catch (error) {
//     console.error("Error in createUserService:", error);
//     throw error; // Re-throw to be handled by the controller
//   }
// };

export const getUserDetailsService = async (userId: any) => {
  const user = await User.findOne({ _id: userId });
  return user;
};

export const forcePasswordResetService = async (userId: any) => {
  const user = await User.findOneAndUpdate(
    { _id: userId },
    { $set: { passwordResetRequired: true } },
    { new: true }
  );

  if (!user) {
    const err: any = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  return user;
};

export const deleteUserService = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const err: any = new Error("Invalid user ID format.");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(userId);
  if (!user) {
    const err: any = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  const issuedItems = await InventoryItem.findOne({
    userId: userId,
    status: "Issued",
  });

  if (issuedItems) {
    const err: any = new Error(
      "User cannot be deactivated: issued items are not yet returned."
    );
    err.statusCode = 400;
    throw err;
  }

  const unpaidFine = await Fine.findOne({
    userId: userId,
    status: "Outstanding",
  });

  if (unpaidFine) {
    const err: any = new Error(
      "User cannot be deactivated: outstanding unpaid fines exist."
    );
    err.statusCode = 400;
    throw err;
  }
  await User.findByIdAndDelete(userId);
  return { message: "User deleted successfully." };
};

export const fetchRolesService = async () => {
  const rolesWithPermissions = await Role.aggregate([
    {
      $lookup: {
        from: "permissions",
        localField: "permissions",
        foreignField: "_id",
        as: "permissions",
      },
    },
    {
      $project: {
        roleName: 1,
        description: 1,
        "permissions.permissionKey": 1,
        "permissions.description": 1,
      },
    },
  ]);

  if (!rolesWithPermissions?.length) {
    throw Object.assign(new Error("No roles found."), { statusCode: 404 });
  }

  return rolesWithPermissions;
};

export const createRoleService = async ({
  roleName,
  description,
  permissions,
}: {
  roleName: string;
  description?: string;
  permissions: string[];
}) => {
  // 1. Check if role already exists
  const existingRole = await Role.findOne({ roleName });
  if (existingRole) {
    const err: any = new Error(`Role with name '${roleName}' already exists.`);
    err.statusCode = 409; // 409 Conflict
    throw err;
  }

  const foundPermissions = await Permission.find({
    permissionKey: { $in: permissions },
  }).select("_id");

  // 2. Improved check: Ensure ALL requested permissions were found
  if (foundPermissions.length !== permissions.length) {
    const err: any = new Error("One or more permissions not found.");
    err.statusCode = 400;
    throw err;
  }

  const permissionIds = foundPermissions.map((p) => p._id);

  const newRole = new Role({
    roleName,
    description,
    permissions: permissionIds,
  });

  // 3. Correctly await the save operation
  await newRole.save();
  return newRole;
};

export const updateRoleService = async ({
  roleId,
  roleName,
  description,
  permissions,
}: {
  roleId: string;
  roleName?: string;
  description?: string;
  permissions?: string[];
}) => {
  const updateData: any = {};

  if (roleName) {
    updateData.roleName = roleName;
  }

  if (description) {
    updateData.description = description;
  }

  if (permissions && permissions.length > 0) {
    const foundPermissions = await Permission.find({
      permissionKey: { $in: permissions },
    }).select("_id");

    if (foundPermissions.length !== permissions.length) {
      const err: any = new Error("One or more permissions not found.");
      err.statusCode = 400;
      throw err;
    }

    updateData.permissions = foundPermissions.map((p) => p._id);
  }

  if (Object.keys(updateData).length === 0) {
    const err: any = new Error("No valid fields provided for update.");
    err.statusCode = 400;
    throw err;
  }

  const updatedRole = await Role.findByIdAndUpdate(roleId, updateData, {
    new: true,
    runValidators: true,
  }).populate("permissions", "permissionKey description _id");

  return updatedRole;
};

export const deleteRoleService = async (roleId: string) => {
  const deletedRole = await Role.findByIdAndDelete(roleId);

  if (!deletedRole) {
    const err: any = new Error("Role not found.");
    err.statusCode = 404;
    throw err;
  }

  return {
    message: "Role deleted successfully",
    data: deletedRole,
  };
};

export const fetchInventoryItemsService = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const totalItems = await InventoryItem.countDocuments({});

  // Don't throw error for empty collection, just return empty array
  if (totalItems === 0) {
    return { items: [], totalItems: 0 };
  }

  const items = await InventoryItem.find()
    .populate("categoryId", "name")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  return { items, totalItems };
};

export const createInventoryItemsService = async (data: any) => {
  // Handle ISBN for non-book items
  if (!data.isbnOrIdentifier && data.categoryId) {
    // Check if it's a book category or generate generic identifier
    const category = await Category.findById(data.categoryId);
    if (category && category.name.toLowerCase() === "books") {
      const err: any = new Error("ISBN is required for book items");
      err.statusCode = 400;
      throw err;
    } else {
      // Generate unique identifier for non-book items
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substring(2, 8);
      data.isbnOrIdentifier = `ITEM-${timestamp}-${random}`;
    }
  }

  const newItem = new InventoryItem(data);

  try {
    return await newItem.save();
  } catch (error: any) {
    if (error.code === 11000) {
      const err: any = new Error(
        "Duplicate ISBN/Barcode. Item already exists."
      );
      err.statusCode = 409;
      throw err;
    }
    throw error;
  }
};

export const fetchSpecificItemServive = async (itemId: any) => {
  const item = await InventoryItem.findById(itemId)
    .populate("categoryId", "name")
    .lean();

  if (!item) {
    const err: any = new Error("No inventory items found");
    err.statusCode = 404;
    throw err;
  }

  // Manually populate the category
  if (item.categoryId) {
    const category = await Category.findById(item.categoryId)
      .select("name description")
      .lean();

    if (category) {
      (item as any).category = category;
      // Optionally remove the categoryId if you don't need it
      // delete item.categoryId;
    }
  }

  return item;
};

export const updateItemService = async ({ itemId, validatedData }: any) => {
  const existingItem = await InventoryItem.findById(itemId);

  if (!existingItem) {
    const err: any = new Error("No such item exits");
    err.statusCode = 404;
    throw err;
  }

  const updatedData = await InventoryItem.findByIdAndUpdate(
    itemId,
    validatedData,
    {
      new: true,
      runValidators: true,
    }
  );

  return updatedData;
};

export const deleteItemService = async (itemId: any) => {
  const deletedItem = await InventoryItem.findByIdAndDelete(itemId);

  if (!deletedItem) {
    const err: any = new Error("No such item exists");
    err.statusCode = 404;
    throw err;
  }

  return deletedItem;
};

const buildCategoryTree = (categories: any[]) => {
  const categoryMap = new Map();
  const rootCategories: any[] = [];

  // Create a map of all categories
  categories.forEach((category) => {
    categoryMap.set(category._id.toString(), {
      ...category.toObject(),
      children: [],
    });
  });

  // Build the tree structure
  categories.forEach((category) => {
    const node = categoryMap.get(category._id.toString());
    if (
      category.parentCategoryId &&
      categoryMap.has(category.parentCategoryId._id?.toString())
    ) {
      const parent = categoryMap.get(category.parentCategoryId._id.toString());
      parent.children.push(node);
    } else {
      rootCategories.push(node);
    }
  });

  return rootCategories;
};

export const getCategoriesService = async (includeTree = false) => {
  if (includeTree) {
    // Return categories in tree structure
    const allCategories = await Category.find({})
      .populate("parentCategoryId", "name description")
      .sort({ name: 1 });

    return buildCategoryTree(allCategories);
  }

  return await Category.find({})
    .populate("parentCategoryId", "name description")
    .sort({ name: 1 });
};

export const createCategoryService = async (data: any) => {
  const { name, description, parentCategoryId, defaultReturnPeriod } = data;

  const existingCategory = await Category.findOne({
    name,
    parentCategoryId: parentCategoryId || null,
  });

  if (existingCategory) {
    const err: any = new Error(
      "Category with this name already exists at this level"
    );
    err.statusCode = 409;
    throw err;
  }

  if (parentCategoryId) {
    const parentCategory = await Category.findById(parentCategoryId);
    if (!parentCategory) {
      const err: any = new Error("Parent category not found");
      err.statusCode = 404;
      throw err;
    }

    // Prevent circular reference (category cannot be its own parent)
    if (parentCategoryId === data._id) {
      const err: any = new Error("Category cannot be its own parent");
      err.statusCode = 400;
      throw err;
    }

    // Check if parent category has a parent (max 2 levels deep)
    if (parentCategory.parentCategoryId) {
      const err: any = new Error(
        "Cannot add subcategory to a subcategory. Maximum hierarchy depth is 2 levels."
      );
      err.statusCode = 400;
      throw err;
    }
  }

  const category = new Category({
    name,
    description: description || "",
    parentCategoryId: parentCategoryId || null,
    defaultReturnPeriod: defaultReturnPeriod || 20,
  });

  await category.save();
  const populatedCategory = await Category.findById(category._id).populate(
    "parentCategoryId",
    "name description"
  );

  return populatedCategory;
};

export const updateCategoryService = async (categoryId: string, data: any) => {
  const { name, description, defaultReturnPeriod } = data;

  const category = await Category.findById(categoryId);
  if (!category) {
    const err: any = new Error("Category not found");
    err.statusCode = 404;
    throw err;
  }

  // Check if name is being changed and if it conflicts with existing category at same level
  if (name && name !== category.name) {
    const existingCategory = await Category.findOne({
      name,
      parentCategoryId: category.parentCategoryId,
      _id: { $ne: categoryId }, // Exclude current category
    });

    if (existingCategory) {
      const err: any = new Error(
        "Category with this name already exists at this level"
      );
      err.statusCode = 409;
      throw err;
    }
  }

  // Update category fields
  if (name) category.name = name;
  if (description !== undefined) category.description = description;
  if (defaultReturnPeriod !== undefined)
    category.defaultReturnPeriod = defaultReturnPeriod;

  await category.save();

  return await Category.findById(categoryId).populate(
    "parentCategoryId",
    "name description"
  );
};

export const deleteCategoryService = async (categoryId: string) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    const err: any = new Error("Category not found");
    err.statusCode = 404;
    throw err;
  }

  // Check if category has children
  const childCategories = await Category.find({ parentCategoryId: categoryId });
  if (childCategories.length > 0) {
    const err: any = new Error(
      "Cannot delete category that has child categories"
    );
    err.statusCode = 400;
    throw err;
  }

  //Check if category has inventory items
  const itemsCount = await InventoryItem.countDocuments({ categoryId });
  if (itemsCount > 0) {
    const err: any = new Error(
      "Cannot delete category that has inventory items"
    );
    err.statusCode = 400;
    throw err;
  }

  await Category.findByIdAndDelete(categoryId);
  return { message: "Category deleted successfully" };
};

export const getCategoryByIdService = async (categoryId: string) => {
  const category = await Category.findById(categoryId).populate(
    "parentCategoryId",
    "name description"
  );

  if (!category) {
    const err: any = new Error("Category not found");
    err.statusCode = 404;
    throw err;
  }

  // Get child categories
  const children = await Category.find({ parentCategoryId: categoryId }).sort({
    name: 1,
  });

  return {
    ...category.toObject(),
    children,
  };
};

export const getAllFinesService = async () => {
  const fines = await Fine.find()
    .populate("userId", "username email")
    .populate("itemId", "title");

  return fines || "";
};

export const fetchUserFinesService = async (userId: any) => {
  const isUserExists = await User.findById(userId);
  if (!userId) {
    const err: any = new Error("No user found");
    err.statusCode = 404;
    throw err;
  }

  const fines = await Fine.find({ userId: userId });
  if (fines.length === 0) {
    const err: any = new Error("No Fines found");
    err.statusCode = 404;
    throw err;
  }
  return fines;
};

export const createFineService = async (data: any) => {
  const {
    userId,
    itemId,
    reason,
    amountIncurred,
    amountPaid = 0,
    paymentDetails,
    managedByAdminId,
  } = data;
  const outstandingAmount = amountIncurred - amountPaid;

  const fine = await Fine.create({
    userId,
    itemId,
    reason,
    amountIncurred,
    amountPaid,
    outstandingAmount,
    paymentDetails,
    status: outstandingAmount > 0 ? "Outstanding" : "Paid",
    managedByAdminId,
    dateSettled: outstandingAmount === 0 ? new Date() : null,
  });
  const user = await User.findById(data.userId).lean();
  if (user && user.phoneNumber) {
    const message = `Hi ${user.fullName}, a new fine of $${data.amountIncurred} for "${data.reason}" has been added to your account.`;
    sendWhatsAppMessage(user.phoneNumber, message);
  }
  return fine;
};

export const updateFineService = async ({ fineId, data }: any) => {
  const isFineExists = await Fine.findById(fineId);
  if (!isFineExists) {
    const err: any = new Error("No such fine exists");
    err.statusCode = 404;
    throw err;
  }

  if (data.amountPaid !== undefined) {
    const newOutstanding =
      (data.amountIncurred ?? isFineExists.amountIncurred) - data.amountPaid;

    data.outstandingAmount = newOutstanding;
    data.status = newOutstanding > 0 ? "Outstanding" : "Paid";
    data.dateSettled = newOutstanding === 0 ? new Date() : null;
  }

  const updatedFine = await Fine.findByIdAndUpdate(
    fineId,
    { $set: data },
    { new: true, runValidators: true }
  );

  return updatedFine;
};

export const deleteFineService = async (fineId: string) => {
  const isExists = await Fine.findById(fineId);

  if (!isExists) {
    const err: any = new Error("No such Fine Exits");
    err.statusCode = 404;
    throw err;
  }

  await Fine.findByIdAndDelete(fineId);
  return { message: "Fine deleted successfully" };
};

export const recordPaymentService = async (data: any) => {
  const {
    fineId,
    amountPaid,
    paymentMethod,
    referenceId,
    notes,
    managedByAdminId,
  } = data;

  const fine = await Fine.findById(fineId);
  if (!fine) {
    const err: any = new Error("Fine not found");
    err.statusCode = 404;
    throw err;
  }

  const newPayment = {
    amountPaid: amountPaid,
    paymentMethod: paymentMethod,
    transactionId: referenceId,
    notes: notes,
    paymentDate: new Date(),
    recordedBy: managedByAdminId,
  };

  console.log("DEBUG: Pushing this payment object:", newPayment);

  fine.paymentDetails.push(newPayment);

  fine.amountPaid += amountPaid;
  fine.outstandingAmount = fine.amountIncurred - fine.amountPaid;

  if (fine.outstandingAmount <= 0) {
    fine.outstandingAmount = 0;
    fine.status = "Paid";
    fine.dateSettled = new Date();
  }

  const updatedFine = await fine.save();

  const user = await User.findById(fine.userId).lean();
  if (user && user.phoneNumber) {
    const message = `Hi ${
      user.fullName
    }, a payment of ₹${amountPaid} has been recorded for your fine. The new outstanding amount is ₹${fine.outstandingAmount.toFixed(
      2
    )}.`;
    sendWhatsAppMessage(user.phoneNumber, message);
  }

  //send email

  return updatedFine;
};

export const waiveFineService = async (data: any) => {
  const { fineId, waiverReason, managedByAdminId } = data;

  const fine = await Fine.findById(fineId);
  if (!fine) {
    const err: any = new Error("Fine not found");
    err.statusCode = 404;
    throw err;
  }

  const updatedFine = await Fine.findByIdAndUpdate(
    fineId,
    {
      $set: {
        status: "Waived",
        outstandingAmount: 0,
        dateSettled: new Date(),
        waiverReason,
        managedByAdminId,
      },
    },
    { new: true, runValidators: true }
  );

  // Send notification to user
  const user = await User.findById(fine.userId).lean();
  if (user && user.phoneNumber) {
    const message = `Hi ${user.fullName}, your fine of ₹${fine.amountIncurred} has been waived. Reason: ${waiverReason}`;
    sendWhatsAppMessage(user.phoneNumber, message);
  }

  return updatedFine;
};

export const generateInventoryReportPDF = async (res: Response) => {
  // Fetch inventory items with populated category
  const items = (await InventoryItem.find()
    .populate<{ categoryId: Icategory }>("categoryId")
    .lean()
    .exec()) as unknown as Array<{
    _id: Types.ObjectId;
    title: string;
    categoryId: Icategory | null;
    publisherOrManufacturer?: string;
    status: string;
    createdAt?: Date;
  }>;

  const doc = new PDFDocument({ margin: 30, size: "A4" });

  doc.pipe(res);

  // Title
  doc.fontSize(20).text("Inventory Report", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text("Comprehensive overview of the library's collection", {
    align: "center",
  });
  doc.moveDown(2);

  // Table header
  const tableTop = 120;
  const itemSpacing = 25;
  let y = tableTop;

  doc.fontSize(10).text("Item ID", 30, y);
  doc.text("Title", 120, y);
  doc.text("Category", 250, y);
  doc.text("Publisher", 350, y);
  doc.text("Status", 450, y);
  doc.text("Added On", 520, y);

  y += itemSpacing;

  // Table rows
  items.forEach((item) => {
    doc.text(item._id.toString() as any, 30, y, { width: 80 });
    doc.text(item.title || "-", 120, y, { width: 120 });
    doc.text(item.categoryId?.name || "-", 250, y, { width: 90 });
    doc.text(item.publisherOrManufacturer || "-", 350, y, { width: 90 });
    doc.text(item.status || "-", 450, y, { width: 60 });
    doc.text(
      item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-",
      520,
      y,
      { width: 80 }
    );
    y += itemSpacing;
  });

  doc.end();
};

export const generateFinesReportPDF = async (res: Response) => {
  const fines = await Fine.find().lean();

  const doc = new PDFDocument({ margin: 30, size: "A4" });

  doc.pipe(res);

  // Title
  doc.fontSize(20).text("Fines Report", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text("Comprehensive overview of the library's collection", {
    align: "center",
  });
  doc.moveDown(2);

  // Table header
  const tableTop = 120;
  const itemSpacing = 25;
  let y = tableTop;

  doc.fontSize(10).text("User ID", 30, y);
  doc.text("Item ID", 120, y);
  doc.text("Reason", 250, y);
  doc.text("amount Incurred", 350, y);
  doc.text("amount Paid", 450, y);
  doc.text("outstanding", 520, y);

  y += itemSpacing;

  // Table rows
  fines.forEach((fine) => {
    doc.text(fine.userId.toString(), 30, y, { width: 80 });
    doc.text(fine.itemId.toString() || "-", 120, y, { width: 120 });
    doc.text((fine.reason as any) || "-", 250, y, { width: 90 });
    doc.text(fine.amountIncurred.toString() || "-", 350, y, { width: 90 });
    doc.text(fine.amountPaid.toString() || "-", 450, y, { width: 60 });
    doc.text(fine.outstandingAmount.toString() || "-", 520, y, { width: 80 });
    y += itemSpacing;
  });

  doc.end();
};

export const generateIssuedItemsReportPDF = async (res: Response) => {
  const items = await IssuedIetm.find().lean();

  const doc = new PDFDocument({ margin: 30, size: "A4" });

  doc.pipe(res);

  // Title
  doc.fontSize(20).text("issued-items Report", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text("Comprehensive overview of the library's collection", {
    align: "center",
  });
  doc.moveDown(2);

  // Table header
  const tableTop = 120;
  const itemSpacing = 25;
  let y = tableTop;

  doc.fontSize(10).text("Item ID", 30, y);
  doc.text("Item ID", 120, y);
  doc.text("Issued Date", 250, y);
  doc.text("Due date", 350, y);
  doc.text("Status", 450, y);
  doc.text("Fine ID", 520, y);

  y += itemSpacing;

  // Table rows
  items.forEach((item) => {
    doc.text(item.userId as any, 30, y, { width: 80 });
    doc.text(item.itemId?.toString() || "-", 120, y, { width: 120 });
    doc.text((item.issuedDate as any) || "-", 250, y, { width: 90 });
    doc.text((item.dueDate as any) || "-", 350, y, { width: 90 });
    doc.text(item.status.toString() || "-", 450, y, { width: 60 });
    doc.text((item.fineId as any) || "-", 520, y, { width: 80 });
    y += itemSpacing;
  });

  doc.end();
};

export const getInventoryReportService = async () => {
  const items = await InventoryItem.find()
    .populate("categoryId", "name")
    .lean();

  return items.map((item: any) => ({
    id: item._id,
    title: item.title,
    category: item.categoryId?.name || "N/A",
    author: item.authorOrCreator || "-",
    availability: item.status || "N/A",
    acquisitionDate: item.createdAt
      ? new Date(item.createdAt).toISOString().split("T")[0]
      : "-",
  }));
};

export const getFinesReportService = async () => {
  const fines = await Fine.find()
    .populate("userId", "fullName")
    .populate("itemId", "title")
    .lean();

  let total = 0,
    paid = 0,
    outstanding = 0;

  const fineDetails = fines.map((fine: any) => {
    total += fine.amount;
    if (fine.status === "Paid") paid += fine.amount;
    else outstanding += fine.amount;

    return {
      user: fine.userId?.fullName || "Unknown",
      item: fine.itemId?.title || "-",
      fineAmount: `$${fine.amount}`,
      status: fine.status,
      date: fine.createdAt
        ? new Date(fine.createdAt).toISOString().split("T")[0]
        : "-",
    };
  });

  return {
    summary: {
      totalFines: total,
      paidFines: paid,
      outstandingFines: outstanding,
    },
    details: fineDetails,
  };
};

// export const getIssuedReportService = async () => {
//   const records = await IssuedIetm.find()
//     .populate("userId", "fullName email roles")
//     .populate("itemId", "title authorOrCreator description price quantity availableCopies categoryId subcategoryId")
//     .populate("issuedBy", "fullName email roles")
//     .populate("returnedTo", "fullName email role")
//     .populate("fineId", "userId itemId reason amountIncurred amountPaid outstandingAmount")
//     .lean();

//   return records.map((record: any) => ({
//     user: record.userId?.fullName || "Unknown",
//     item: record.itemId?.title || "-",
//     issueDate: record.issueDate
//       ? new Date(record.issueDate).toISOString().split("T")[0]
//       : "-",
//     returnDate: record.returnDate
//       ? new Date(record.returnDate).toISOString().split("T")[0]
//       : "-",
//     status: record.status || "Issued",
//   }));
// };

export const getIssuedReportService = async () => {
  const records = await IssuedItem.find()
    .populate("userId", "fullName email roles")
    .populate(
      "itemId",
      "title authorOrCreator description price quantity availableCopies categoryId subcategoryId"
    )
    .populate("issuedBy", "fullName email roles")
    .populate("returnedTo", "fullName email roles")
    .populate(
      "fineId",
      "userId itemId reason amountIncurred amountPaid outstandingAmount"
    )
    .lean();

  return records.map((record: any) => ({
    // 🔹 Core Details
    id: record._id,
    status: record.status || "Issued",

    // 🔹 User (Borrower)
    user: {
      id: record.userId?._id || null,
      fullName: record.userId?.fullName || "Unknown",
      email: record.userId?.email || "-",
      roles: record.userId?.roles || [],
    },

    // 🔹 Item Details
    item: {
      id: record.itemId?._id || null,
      title: record.itemId?.title || "-",
      authorOrCreator: record.itemId?.authorOrCreator || "-",
      description: record.itemId?.description || "-",
      categoryId: record.itemId?.categoryId || "-",
      subcategoryId: record.itemId?.subcategoryId || "-",
      price: record.itemId?.price ?? "-",
      quantity: record.itemId?.quantity ?? "-",
      availableCopies: record.itemId?.availableCopies ?? "-",
    },

    // 🔹 Issued & Returned Staff
    issuedBy: {
      id: record.issuedBy?._id || null,
      fullName: record.issuedBy?.fullName || "-",
      email: record.issuedBy?.email || "-",
      roles: record.issuedBy?.roles || [],
    },
    returnedTo: record.returnedTo
      ? {
          id: record.returnedTo._id,
          fullName: record.returnedTo.fullName,
          email: record.returnedTo.email,
          roles: record.returnedTo.roles,
        }
      : null,

    // 🔹 Dates
    issuedDate: record.issuedDate
      ? new Date(record.issuedDate).toISOString().split("T")[0]
      : "-",
    dueDate: record.dueDate
      ? new Date(record.dueDate).toISOString().split("T")[0]
      : "-",
    returnDate: record.returnDate
      ? new Date(record.returnDate).toISOString().split("T")[0]
      : "-",

    // 🔹 Extensions
    extensionCount: record.extensionCount ?? 0,
    maxExtensionAllowed: record.maxExtensionAllowed ?? 2,

    // 🔹 Fine Details (if any)
    fine: record.fineId
      ? {
          id: record.fineId._id,
          reason: record.fineId.reason || "-",
          amountIncurred: record.fineId.amountIncurred ?? 0,
          amountPaid: record.fineId.amountPaid ?? 0,
          outstandingAmount: record.fineId.outstandingAmount ?? 0,
        }
      : null,

    // 🔹 Metadata
    createdAt: record.createdAt
      ? new Date(record.createdAt).toISOString().split("T")[0]
      : "-",
    updatedAt: record.updatedAt
      ? new Date(record.updatedAt).toISOString().split("T")[0]
      : "-",
  }));
};

// export const getDefaulterListService = async (
//   filters: IDefaulterListQuery
// ): Promise<IDefaulterReportItem[]> => {
//   const queryConditions: any = {
//     status: "Issued",
//     dueDate: { $lt: new Date() },
//   };

//   if (filters.overdueSince) {
//     queryConditions.dueDate = { $lte: new Date(filters.overdueSince) };
//   }

//   let overdueItems = await IssuedItem.find(queryConditions)
//     .populate<{ userId: IUser }>({
//       path: "userId",
//       select: "fullName email employeeId phoneNumber roles",
//     })
//     .populate<{ itemId: IInventoryItem }>({
//       path: "itemId",
//       select: "title barcode categoryId",
//     })
//     .lean();

//   if (filters.itemCategory) {
//     overdueItems = overdueItems.filter((item) => {
//       const inventoryItem = item.itemId as IInventoryItem;
//       return inventoryItem.categoryId?.toString() === filters.itemCategory;
//     });
//   }

//   if (filters.userRole) {
//     overdueItems = overdueItems.filter((item) => {
//       const user = item.userId as IUser;
//       return user.roles?.some((roleId) => roleId.toString() === filters.userRole);
//     });
//   }

//   const formattedReport = overdueItems.map((item): IDefaulterReportItem => {
//     const user = item.userId as IUser;
//     const inventoryItem = item.itemId as IInventoryItem;

//     const today = new Date();
//     const dueDate = new Date(item.dueDate);
//     const timeDiff = today.getTime() - dueDate.getTime();
//     const daysOverdue = Math.max(0, Math.floor(timeDiff / (1000 * 3600 * 24)));

//     return {
//       userName: user.fullName,
//       identifier: user.employeeId || user.email,
//       itemTitle: inventoryItem.title,
//       barcode: inventoryItem.barcode,
//       issuedDate: new Date(item.issuedDate).toISOString().split("T")[0],
//       dueDate: new Date(item.dueDate).toISOString().split("T")[0],
//       daysOverdue: daysOverdue,
//       contact: {
//         email: user.email,
//         phone: user.phoneNumber || "N/A",
//       },
//       userId: user._id.toString(),
//       issuedItemId: item._id.toString(),
//     };
//   });

//   return formattedReport;
// };

// export const getDefaulterReportPDF = async (req: ExpressRequest, res: Response) => {
//   try {
//     const filters: IDefaulterListQuery = {
//       overdueSince: req.query.overdueSince as string | undefined,
//       itemCategory: req.query.itemCategory as string | undefined,
//       userRole: req.query.userRole as string | undefined,
//     };

//     const reportData = await getDefaulterListService(filters);

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       'attachment; filename="defaulter-list-report.pdf"'
//     );

//     // **TODO**: Call your PDF generation logic here, passing it the `reportData` and `res` stream
//     // For example:
//     // await generateDefaulterReportPDF(reportData, res);

//     // For now, let's just send the data as JSON to confirm it works
//     res.status(200).json(reportData);

//   } catch (error: any) {
//     console.error("Error generating defaulter report:", error.message);
//     res
//       .status(500)
//       .json({ message: "Failed to generate report", error: error.message });
//   }
// };
export const getQueueAnalytics = async (startDate?: Date, endDate?: Date) => {
  const dateFilter: any = {};
  if (startDate && endDate) {
    dateFilter.createdAt = {
      $gte: startDate,
      $lte: endDate,
    };
  }

  // Get all queues with populated data
  const queues = await Queue.find(dateFilter)
    .populate("itemId", "title categoryId")
    .populate("queueMembers.userId")
    .lean();

  // Calculate summary statistics
  const totalQueues = queues.length;
  const activeQueues = queues.filter((q) => q.queueMembers.length > 0).length;
  const totalUsersWaiting = queues.reduce(
    (sum, queue) => sum + queue.queueMembers.length,
    0
  );

  // Calculate average wait time (simplified)
  const avgWaitTime = await calculateAverageWaitTime();

  // Calculate notification response rate
  const responseRate = await calculateNotificationResponseRate();

  // Average queue length
  const avgQueueLength = totalQueues > 0 ? totalUsersWaiting / totalQueues : 0;

  // Queue length distribution
  const lengthDistribution = calculateQueueLengthDistribution(queues);

  // Popular items analysis
  const popularItems = await getPopularItems(queues);

  // Wait time analysis
  const waitTimeAnalysis = await getWaitTimeAnalysis();

  // Notification performance
  const notificationPerformance = await getNotificationPerformance();

  // Peak hours analysis
  const peakHours = await getPeakHoursAnalysis();

  // Category analysis
  const categoryAnalysis = await getCategoryAnalysis(queues);

  return {
    summary: {
      totalQueues,
      activeQueues,
      totalUsersWaiting,
      avgWaitTime,
      notificationResponseRate: responseRate,
      avgQueueLength,
    },
    queueLengthDistribution: lengthDistribution,
    popularItems,
    waitTimeAnalysis,
    notificationPerformance,
    peakHours,
    categoryAnalysis,
  };
};

const calculateQueueLengthDistribution = (queues: any[]) => {
  const distribution = {
    "1-5": 0,
    "6-10": 0,
    "11-20": 0,
    "21-50": 0,
    "50+": 0,
  };

  queues.forEach((queue) => {
    const length = queue.queueMembers.length;
    if (length <= 5) distribution["1-5"]++;
    else if (length <= 10) distribution["6-10"]++;
    else if (length <= 20) distribution["11-20"]++;
    else if (length <= 50) distribution["21-50"]++;
    else distribution["50+"]++;
  });

  return Object.entries(distribution).map(([length, count]) => ({
    length,
    count,
  }));
};

const getPopularItems = async (queues: any[]) => {
  const itemStats = new Map();

  queues.forEach((queue) => {
    const itemName = queue.itemId?.title || "Unknown Item";
    const queueLength = queue.queueMembers.length;

    if (itemStats.has(itemName)) {
      const current = itemStats.get(itemName);
      itemStats.set(itemName, {
        queueLength: current.queueLength + queueLength,
        totalRequests: current.totalRequests + 1,
      });
    } else {
      itemStats.set(itemName, {
        queueLength,
        totalRequests: 1,
      });
    }
  });

  return Array.from(itemStats.entries())
    .map(([itemName, stats]) => ({
      itemName,
      queueLength: stats.queueLength,
      totalRequests: stats.totalRequests,
    }))
    .sort((a, b) => b.queueLength - a.queueLength)
    .slice(0, 15);
};

const calculateAverageWaitTime = async (): Promise<number> => {
  // Simplified calculation - in real scenario, calculate based on actual wait times
  const result = await Queue.aggregate([
    { $unwind: "$queueMembers" },
    {
      $group: {
        _id: null,
        avgWaitTime: {
          $avg: {
            $divide: [
              { $subtract: [new Date(), "$queueMembers.dateJoined"] },
              1000 * 60 * 60 * 24, // Convert to days
            ],
          },
        },
      },
    },
  ]);

  return result[0]?.avgWaitTime || 0;
};

const calculateNotificationResponseRate = async (): Promise<number> => {
  // This would require tracking notification responses
  // For now, return a simulated value
  return 75; // 75% response rate
};

const getWaitTimeAnalysis = async () => {
  // Return wait time trends for the last 7 days
  return [
    { period: "Mon", avgWaitTime: 5.2 },
    { period: "Tue", avgWaitTime: 4.8 },
    { period: "Wed", avgWaitTime: 6.1 },
    { period: "Thu", avgWaitTime: 5.5 },
    { period: "Fri", avgWaitTime: 4.9 },
    { period: "Sat", avgWaitTime: 7.2 },
    { period: "Sun", avgWaitTime: 8.1 },
  ];
};

const getNotificationPerformance = async () => {
  return [
    { status: "Accepted", count: 150, percentage: 60 },
    { status: "Declined", count: 50, percentage: 20 },
    { status: "Expired", count: 30, percentage: 12 },
    { status: "Pending", count: 20, percentage: 8 },
  ];
};

const getPeakHoursAnalysis = async () => {
  return [
    { hour: "9 AM", queueJoins: 45 },
    { hour: "10 AM", queueJoins: 78 },
    { hour: "11 AM", queueJoins: 92 },
    { hour: "12 PM", queueJoins: 85 },
    { hour: "1 PM", queueJoins: 67 },
    { hour: "2 PM", queueJoins: 54 },
    { hour: "3 PM", queueJoins: 48 },
    { hour: "4 PM", queueJoins: 35 },
  ];
};

const getCategoryAnalysis = async (queues: any[]) => {
  const categoryMap = new Map();

  queues.forEach((queue) => {
    const category = queue.itemId?.categoryId?.name || "Uncategorized";
    if (categoryMap.has(category)) {
      const current = categoryMap.get(category);
      categoryMap.set(category, {
        queueCount: current.queueCount + 1,
        totalWaitTime: current.totalWaitTime + queue.queueMembers.length * 5, // Simplified
      });
    } else {
      categoryMap.set(category, {
        queueCount: 1,
        totalWaitTime: queue.queueMembers.length * 5,
      });
    }
  });

  return Array.from(categoryMap.entries()).map(([category, stats]) => ({
    category,
    queueCount: stats.queueCount,
    avgWaitTime: stats.totalWaitTime / stats.queueCount,
  }));
};

export const exportQueueAnalytics = async () => {
  const analytics = await getQueueAnalytics();

  // Convert to CSV format
  const csvHeaders = [
    "Metric,Value",
    `Total Queues,${analytics.summary.totalQueues}`,
    `Active Queues,${analytics.summary.activeQueues}`,
    `Total Users Waiting,${analytics.summary.totalUsersWaiting}`,
    `Average Wait Time,${analytics.summary.avgWaitTime}`,
    `Notification Response Rate,${analytics.summary.notificationResponseRate}%`,
    `Average Queue Length,${analytics.summary.avgQueueLength}`,
  ].join("\n");

  return csvHeaders;
};

export const exportIssuedItemsReport = async (
  startDate?: string,
  endDate?: string
) => {
  try {
    // Build query with date filters
    const query: any = {};

    if (startDate || endDate) {
      query.issuedDate = {};
      if (startDate) query.issuedDate.$gte = new Date(startDate);
      if (endDate) query.issuedDate.$lte = new Date(endDate);
    }

    const report = await IssuedItem.find(query)
      .populate("userId", "fullName email")
      .populate("itemId", "title authorOrCreator")
      .populate("issuedBy", "fullName email")
      .populate("returnedTo", "fullName email")
      .sort({ issuedDate: -1 });

    // CSV headers
    const headers = [
      "User Name",
      "User Email",
      "Item Title",
      "Item Author",
      "Status",
      "Issue Date",
      "Due Date",
      "Return Date",
      "Extensions Used",
      "Max Extensions",
      "Issued By",
      "Returned To",
    ];

    // Convert data to CSV rows
    const csvRows = report.map((item: IIssuedItem) => {
      // Safely access populated fields
      const userName = (item.userId as any)?.fullName || "-";
      const userEmail = (item.userId as any)?.email || "-";
      const itemTitle = (item.itemId as any)?.title || "-";
      const itemAuthor = (item.itemId as any)?.authorOrCreator || "-";
      const issuedByName = (item.issuedBy as any)?.fullName || "-";
      const returnedToName = (item.returnedTo as any)?.fullName || "-";

      // Format dates
      const issueDate = item.issuedDate
        ? new Date(item.issuedDate).toISOString().split("T")[0]
        : "-";
      const dueDate = item.dueDate
        ? new Date(item.dueDate).toISOString().split("T")[0]
        : "-";
      const returnDate = item.returnDate
        ? new Date(item.returnDate).toISOString().split("T")[0]
        : "-";

      return [
        `"${userName}"`,
        `"${userEmail}"`,
        `"${itemTitle}"`,
        `"${itemAuthor}"`,
        `"${item.status}"`,
        `"${issueDate}"`,
        `"${dueDate}"`,
        `"${returnDate}"`,
        `"${item.extensionCount}"`,
        `"${item.maxExtensionAllowed}"`,
        `"${issuedByName}"`,
        `"${returnedToName}"`,
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");

    return csvContent;
  } catch (error: any) {
    throw new Error(`Failed to export issued items: ${error.message}`);
  }
};

export const getSystemRestrictionsService = async () => {
  const settings = await Setting.findOne().lean();

  if (!settings) {
    const error: any = new Error("System settings not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    libraryName: settings.libraryName,
    operationalHours: settings.operationalHours,
    borrowingLimits: settings.borrowingLimits,
    fineRates: settings.fineRates,
  };
};

export const extendPeriodService = async (
  issuedItemId: string,
  extensionDays: number
): Promise<{
  success: boolean;
  updatedItem?: IIssuedItem;
  message?: string;
}> => {
  try {
    // Find the issued item
    const issuedItem = await IssuedItem.findById(issuedItemId);

    if (!issuedItem) {
      return { success: false, message: "Issued item not found" };
    }

    // Check if item is already returned
    if (issuedItem.status === "Returned") {
      return {
        success: false,
        message: "Cannot extend period for returned item",
      };
    }

    // Check if maximum extensions reached
    if (issuedItem.extensionCount >= issuedItem.maxExtensionAllowed) {
      return {
        success: false,
        message: `Maximum extensions (${issuedItem.maxExtensionAllowed}) already reached`,
      };
    }

    // Validate extension days
    if (extensionDays <= 0) {
      return { success: false, message: "Extension days must be positive" };
    }

    // Calculate new due date
    const currentDueDate = issuedItem.dueDate || new Date();
    const newDueDate = new Date(currentDueDate);
    newDueDate.setDate(newDueDate.getDate() + extensionDays);

    // Update the issued item
    const updatedItem = await IssuedItem.findByIdAndUpdate(
      issuedItemId,
      {
        $set: {
          dueDate: newDueDate,
          extensionCount: issuedItem.extensionCount + 1,
        },
      },
      { new: true }
    )
      .populate("userId", "fullName email roles")
      .populate(
        "itemId",
        "title authorOrCreator description price quantity availableCopies categoryId subcategoryId"
      )
      .populate("issuedBy", "fullName email roles")
      .populate("returnedTo", "fullName email roles")
      .populate(
        "fineId",
        "userId itemId reason amountIncurred amountPaid outstandingAmount"
      );

    if (!updatedItem) {
      return { success: false, message: "Failed to update issued item" };
    }

    return {
      success: true,
      updatedItem: updatedItem.toObject() as IIssuedItem,
    };
  } catch (error) {
    console.error("Error extending period:", error);
    return { success: false, message: "Internal server error" };
  }
};

export const updateSystemRestrictionsService = async (updateData: any) => {
  try {
    const updatedSettings = await Setting.findOneAndUpdate(
      {},
      { $set: updateData },
      { new: true, runValidators: false, upsert: true }
    ).lean();

    return updatedSettings;
  } catch (error: any) {
    throw new Error(error.message || "Failed to update system settings");
  }
};

export const getNotificationTemplatesService = async () => {
  const templates = await Setting.findOne().select(
    "notificationTemplates -_id"
  );
  return templates;
};

export const addTemplateService = async (key: string, template: any) => {
  const settings = await Setting.findOneAndUpdate(
    {},
    { $set: { [`notificationTemplates.${key}`]: template } },
    { upsert: true, new: true }
  );
  return settings.notificationTemplates;
};

export const updateTemplateService = async (key: string, template: any) => {
  const settings = await Setting.findOneAndUpdate(
    {},
    { $set: { [`notificationTemplates.${key}`]: template } },
    { new: true }
  );
  return settings?.notificationTemplates || "";
};

export const updateNotificationTemplateService = async ({
  templateKey,
  data,
}: UpdateTemplateData) => {
  const setting = await Setting.findOne();
  if (!setting) {
    throw new Error("System settings not found");
  }

  const updateFields: Record<string, any> = {};
  if (data.emailSubject !== undefined)
    updateFields[`notificationTemplates.${templateKey}.emailSubject`] =
      data.emailSubject;
  if (data.emailBody !== undefined)
    updateFields[`notificationTemplates.${templateKey}.emailBody`] =
      data.emailBody;
  if (data.whatsappMessage !== undefined)
    updateFields[`notificationTemplates.${templateKey}.whatsappMessage`] =
      data.whatsappMessage;

  const updatedSetting = await Setting.findOneAndUpdate(
    {},
    { $set: updateFields },
    { new: true, lean: true }
  );

  return updatedSetting?.notificationTemplates?.[templateKey];
};

export const getAdminProfileService = async (userId: any) => {
  const admin = await User.findById(userId).lean();

  if (!admin) {
    const err: any = new Error("Admin profile not found");
    err.statusCode = 404;
    throw err;
  }

  return admin;
};

// export const updateAdminAvatarService = async ({ adminId, avatarUrl }: any) => {
//   const isExistingAdmin = await User.findById(adminId);

//   if (!isExistingAdmin) {
//     const err: any = new Error("no admin found with this amdinId");
//     err.statusCode = 404;
//     throw err;
//   }

//   const res = await User.findByIdAndUpdate(
//     adminId,
//     { $set: avatarUrl },
//     { new: true, runValidators: false }
//   );

//   return res;
// };

export const resetPasswordAdminService = async (userId: string) => {
  const isExistingAdmin = await User.findById(userId);

  if (!isExistingAdmin) {
    const err: any = new Error("no admin found with this amdinId");
    err.statusCode = 404;
    throw err;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { passwordResetRequired: true } },
    { new: true, runValidators: false }
  );

  return user;
};

export const updateAdminPasswordServive = async (data: any) => {
  const { userId, password } = data;
  const isExistingAdmin = await User.findById(userId);
  if (!isExistingAdmin) {
    const err: any = new Error("no admin found with this amdinId");
    err.statusCode = 404;
    throw err;
  }

  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { password: hashPassword } },
    { new: true, runValidators: false }
  ).select("+password");

  return user;
};

export const generateBarcodeString = async (): Promise<string> => {
  return `ITEM-${uuidv4()}`;
};

export const generateBarcodePDF = async (itemId: string, res: Response) => {
  try {
    const isItemExisting = await InventoryItem.findById(itemId);
    if (!isItemExisting) {
      const err: any = new Error("no admin found with this amdinId");
      err.statusCode = 404;
      throw err;
    }

    const barcodeValue = isItemExisting.barcode;

    const pngBuffer = await bwipjs.toBuffer({
      bcid: "code128",
      text: barcodeValue,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: "center",
    });

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=barcode-${barcodeValue}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(18).text("Item Barcode", { align: "center" });
    doc.moveDown(1);

    doc.image(pngBuffer, {
      fit: [250, 100],
      align: "center",
      valign: "center",
    });

    doc.moveDown(1);
    doc.fontSize(14).text(`Code: ${barcodeValue}`, { align: "center" });

    doc.end();
  } catch (err) {
    throw new Error("Failed to generate barcode PDF");
  }
};

export const getAllDonationService = async () => {
  const donations = await Donation.find()
    .populate({ path: "userId", select: "fullName email" })
    .populate({ path: "itemType", select: "name description" });

  return donations || "";
};

export const updateDonationStatusService = async (
  donationId: string,
  status: "Accepted" | "Rejected"
) => {
  const donation = await Donation.findById(donationId)
    .populate({ path: "userId", select: "fullName email" })
    .populate({ path: "itemType", select: "name description" });

  if (!donation) {
    throw new Error("Donation not found");
  }

  if (donation.status !== "Pending") {
    throw new Error(`Donation is already ${donation.status}`);
  }

  donation.status = status;
  await donation.save();

  return donation;
};

export const processItemReturn = async (itemId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the queue for the returned item
    const queue = await Queue.findOne({ itemId })
      .populate("queueMembers.userId")
      .session(session);

    if (!queue || queue.queueMembers.length === 0) {
      // No queue for this item
      await session.commitTransaction();
      session.endSession();
      return { message: "No queue found for this item" };
    }

    // Check if already processing
    if (queue.isProcessing) {
      await session.commitTransaction();
      session.endSession();
      return { message: "Queue is already being processed" };
    }

    // Find next eligible user (waiting status, lowest position)
    const nextUser = queue.queueMembers
      .filter((member) => member.status === "waiting")
      .sort((a, b) => a.position - b.position)[0];

    if (!nextUser) {
      await session.commitTransaction();
      session.endSession();
      return { message: "No waiting users in queue" };
    }

    // Mark queue as processing
    queue.isProcessing = true;
    queue.currentNotifiedUser = nextUser.userId._id;

    // Update user status and set notification expiry (24 hours)
    nextUser.status = "notified";
    nextUser.notifiedAt = new Date();
    nextUser.notificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await queue.save({ session });

    // Send notification to user
    await sendItemAvailableNotification(nextUser.userId, itemId);

    await session.commitTransaction();
    session.endSession();

    return {
      message: "Notification sent to next user in queue",
      userId: nextUser.userId._id,
      expiresAt: nextUser.notificationExpires,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const calculateDueDate = (defaultReturnPeriod?: number) => {
  const defaultPeriod = defaultReturnPeriod || 14;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + defaultPeriod);
  return dueDate;
};

export const handleUserResponse = async (
  userId: string,
  itemId: string,
  accept: boolean
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const queue = await Queue.findOne({ itemId }).session(session);
    if (!queue) {
      throw new Error("Queue not found");
    }

    const userMember = queue.queueMembers.find(
      (member) =>
        member.userId.toString() === userId && member.status === "notified"
    );

    if (!userMember) {
      throw new Error("User not found in queue or not notified");
    }

    if (accept) {
      // User accepts - issue the item
      const item = await InventoryItem.findById(itemId).session(session);
      if (!item || item.availableCopies <= 0) {
        throw new Error("Item no longer available");
      }

      // Issue item
      const dueDate = calculateDueDate(item.defaultReturnPeriod);
      const issuedItem = new IssuedItem({
        itemId,
        userId,
        issuedDate: new Date(),
        dueDate,
        issuedBy: userId,
        status: "Issued",
      });

      await issuedItem.save({ session });

      // Update item
      item.availableCopies -= 1;
      if (item.availableCopies === 0) {
        item.status = "Issued";
      }
      await item.save({ session });

      // Update queue member status
      userMember.status = "issued";

      // Send confirmation
      await sendIssueNotification(userId, item.title, dueDate, "queued");
    } else {
      // User declines - mark as skipped
      userMember.status = "skipped";
    }

    // Remove user from queue and recalculate positions
    queue.queueMembers = queue.queueMembers.filter(
      (member) =>
        member.userId.toString() !== userId || member.status === "issued"
    );

    // Recalculate positions
    queue.queueMembers.forEach((member, index) => {
      member.position = index + 1;
    });

    // Reset processing state
    queue.isProcessing = false;
    queue.currentNotifiedUser = null;

    await queue.save({ session });

    // If user declined or item was issued, process next user
    if (!accept || accept) {
      await processItemReturn(itemId);
    }

    await session.commitTransaction();
    session.endSession();

    return {
      message: accept
        ? "Item issued successfully"
        : "Item declined, moving to next user",
      issued: accept,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const checkExpiredNotifications = async () => {
  const now = new Date();

  const queues = await Queue.find({
    "queueMembers.notificationExpires": { $lt: now },
    "queueMembers.status": "notified",
  }).populate("queueMembers.userId");

  for (const queue of queues) {
    const expiredMembers = queue.queueMembers.filter(
      (member) =>
        member.status === "notified" &&
        member.notificationExpires &&
        member.notificationExpires < now
    );

    for (const member of expiredMembers) {
      console.log(
        `Notification expired for user ${member.userId._id} in queue ${queue._id}`
      );

      // Mark as skipped
      member.status = "skipped";

      // Send skipped notification
      await sendSkippedNotification(member.userId, queue.itemId.toString());
    }

    // Remove skipped users and recalculate positions
    queue.queueMembers = queue.queueMembers.filter(
      (member) => member.status !== "skipped"
    );
    queue.queueMembers.forEach((member, index) => {
      member.position = index + 1;
    });

    // Reset processing state and process next user
    queue.isProcessing = false;
    queue.currentNotifiedUser = null;
    await queue.save();

    // Process next user
    await processItemReturn(queue.itemId.toString());
  }
};

const sendItemAvailableNotification = async (user: any, itemId: string) => {
  const item = await InventoryItem.findById(itemId);
  if (!item) return;

  const message = `The item "${item.title}" is now available! You have 24 hours to accept this item. Please respond to this message.`;
  const acceptLink = `${process.env.FRONTEND_URL}/queue/respond?itemId=${itemId}&accept=true`;
  const declineLink = `${process.env.FRONTEND_URL}/queue/respond?itemId=${itemId}&accept=false`;

  if (user.notificationPreference?.email) {
    const emailHtml = `
      <h2>Item Available!</h2>
      <p>${message}</p>
      <p><a href="${acceptLink}">Borrow Now</a> | <a href="${declineLink}">Skip</a></p>
      <p><small>This offer expires in 24 hours.</small></p>
    `;
    await sendEmail(user.email, "Item Available for Borrowing", emailHtml);
  }

  if (user.notificationPreference?.whatsApp && user.phoneNumber) {
    const whatsappMessage = `${message}\n\nAccept: ${acceptLink}\nDecline: ${declineLink}`;
    await sendWhatsAppMessage(user.phoneNumber, whatsappMessage);
  }
};

const sendSkippedNotification = async (user: any, itemId: string) => {
  const item = await InventoryItem.findById(itemId);
  if (!item) return;

  const message = `Your notification period for "${item.title}" has expired. You have been moved to the end of the queue.`;

  if (user.notificationPreference?.email) {
    await sendEmail(user.email, "Queue Notification Expired", message);
  }

  if (user.notificationPreference?.whatsApp && user.phoneNumber) {
    await sendWhatsAppMessage(user.phoneNumber, message);
  }
};

const sendIssueNotification = async (
  userId: string,
  itemTitle: string,
  dueDate: Date,
  type: string
) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const message =
      type === "immediate"
        ? `Your item "${itemTitle}" has been issued successfully. Due date: ${dueDate.toDateString()}.`
        : `The item "${itemTitle}" you requested is now available! Please confirm within 24 hours.`;

    if (user.notificationPreference?.email) {
      await sendEmail(user.email, "Item Issued", message);
    }

    if (user.notificationPreference?.whatsApp && user.phoneNumber) {
      await sendWhatsAppMessage(user.phoneNumber, message);
    }
  } catch (error) {
    console.error("Error sending issue notification:", error);
  }
};

export const viewQueueService = async (itemId: string) => {
  const queue = await Queue.findOne({ itemId })
    .populate("itemId", "title status")
    .populate("queueMembers.userId", "fullName email phoneNumber")
    .populate("currentNotifiedUser", "fullName email");

  return queue ? [queue] : [];
};

export const issueItemFromQueueService = async (
  queueId: string,
  userId: string,
  adminId: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const queue = await Queue.findById(queueId).session(session);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    const memberToIssue = queue.queueMembers.find(
      (member) => member.userId.toString() === userId
    );

    if (!memberToIssue) {
      throw new Error("User is not a member of this queue.");
    }

    const item = await InventoryItem.findById(queue.itemId).session(session);
    if (!item) {
      throw new Error("Item not found.");
    }

    if (item.availableCopies <= 0) {
      throw new Error("Item is not available to be issued.");
    }

    // Update item
    item.availableCopies -= 1;
    if (item.availableCopies === 0) {
      item.status = "Issued";
    }
    await item.save({ session });

    // Calculate due date
    const issueDate = new Date();
    const dueDate = new Date(
      issueDate.setDate(issueDate.getDate() + (item.defaultReturnPeriod || 14))
    );

    // Create issued item record
    const issuedItem = new IssuedItem({
      itemId: queue.itemId,
      userId: userId,
      issuedDate: new Date(),
      dueDate: dueDate,
      issuedBy: adminId,
      status: "Issued",
    });
    await issuedItem.save({ session });

    // Remove user from queue and update positions
    const remainingMembers = queue.queueMembers.filter(
      (member) => member.userId.toString() !== userId
    );

    const updatedMembers = remainingMembers.map((member, index) => ({
      ...member,
      position: index + 1,
    }));

    queue.queueMembers = updatedMembers;
    await queue.save({ session });

    // Send notification
    const user = await User.findById(userId);
    if (user && item) {
      const message = `Your item "${
        item.title
      }" has been issued by admin. Due date: ${dueDate.toDateString()}.`;

      if (user.notificationPreference?.email) {
        await sendEmail(user.email, "Item Issued by Admin", message);
      }

      if (user.notificationPreference?.whatsApp && user.phoneNumber) {
        await sendWhatsAppMessage(user.phoneNumber, message);
      }
    }

    await session.commitTransaction();
    session.endSession();

    return issuedItem;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const removeUserFromQueueService = async (
  queueId: string,
  userId: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const queue = await Queue.findById(queueId).session(session);
    if (!queue) {
      throw new Error("Queue not found.");
    }

    if (!queue.queueMembers || queue.queueMembers.length === 0) {
      throw new Error("User is not in the queue.");
    }

    const memberIndex = queue.queueMembers.findIndex((member) =>
      member.userId.equals(new mongoose.Types.ObjectId(userId))
    );

    if (memberIndex === -1) {
      throw new Error("User is not in the queue.");
    }

    queue.queueMembers.splice(memberIndex, 1);
    queue.queueMembers.forEach((member, index) => {
      member.position = index + 1;
    });

    await queue.save({ session });
    await session.commitTransaction();
    session.endSession();

    return { message: "User removed from queue successfully." };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const fetchAllPermissionsService = async () => {
  const permissions = await Permission.find({}).lean();
  if (!permissions.length) {
    const err: any = new Error("No permissions found.");
    err.statusCode = 404;
    throw err;
  }
  return permissions;
};

export const getDefaulterReport = async (filters: DefaulterFilters): Promise<DefaulterItem[]> => {
  try {
    const today = new Date();
    
    // Build base query for overdue items
    let query: any = {
      status: "Issued",
      dueDate: { $lt: today }
    };

    // Apply overdue since filter
    if (filters.overdueSince) {
      const overdueSinceDate = new Date(filters.overdueSince);
      query.dueDate.$lt = overdueSinceDate;
    }

    console.log("Query:", query); // Debug log

    const issuedItems = await IssuedItem.find(query)
      .populate('userId', 'fullName email employeeId phoneNumber roles')
      .populate('itemId', 'title barcode categoryId')
      .populate('issuedBy', 'fullName')
      .sort({ dueDate: 1 });

    console.log("Found issued items:", issuedItems.length); // Debug log

    // Get additional user and category data
    const defaultersPromises = issuedItems.map(async (item) => {
      try {
        const user = item.userId as any;
        const inventoryItem = item.itemId as any;
        
        if (!user || !inventoryItem) {
          console.log("Missing user or inventory item");
          return null;
        }

        // Get user roles
        const userRoles = await Role.find({ _id: { $in: user.roles } });
        const roleNames = userRoles.map(role => role.roleName).join(', ');
        
        // Get category - fix field name from 'name' to 'categoryName'
        const category = await Category.findById(inventoryItem.categoryId);
        
        // Apply category filter
        if (filters.categoryId && category?._id.toString() !== filters.categoryId) {
          return null;
        }
        
        // Apply role filter
        if (filters.roleId) {
          const hasRole = user.roles.some((roleId: any) => roleId.toString() === filters.roleId);
          if (!hasRole) {
            return null;
          }
        }

        // Calculate days overdue
        const dueDate = new Date(item.dueDate);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
          issuedItemId: (item._id as Types.ObjectId).toString(),
          userName: user.fullName,
          userEmail: user.email,
          employeeId: user.employeeId,
          phoneNumber: user.phoneNumber,
          roleName: roleNames,
          itemTitle: inventoryItem.title,
          barcode: inventoryItem.barcode,
          issuedDate: item.issuedDate.toISOString().split('T')[0],
          dueDate: item.dueDate.toISOString().split('T')[0],
          daysOverdue,
          categoryName: category?.name || 'Unknown', // Using 'name' from your interface
          userId: user._id.toString(), // Add this for reminders
          itemId: inventoryItem._id.toString(), // Add this for reminders
        };
      } catch (error) {
        console.error("Error processing issued item:", error);
        return null;
      }
    });

    const defaulters = await Promise.all(defaultersPromises);

    // Filter out null values and return
    const result = defaulters.filter(item => item !== null) as DefaulterItem[];
    console.log("Final defaulters count:", result.length); // Debug log
    return result;
  } catch (error: any) {
    console.error("Error in getDefaulterReport:", error);
    throw new Error(`Failed to fetch defaulter report: ${error.message}`);
  }
};

export const sendReminderService = async (
  issuedItemId: string,
  userId: string,
  itemId: string
) => {
  try {
    const user = await User.findById(userId);
    const item = await InventoryItem.findById(itemId);
    const issuedItem = await IssuedItem.findById(issuedItemId);

    if (!user || !item || !issuedItem) {
      throw new Error("User, item, or issued item not found");
    }

    const dueDate = new Date(issuedItem.dueDate);
    const today = new Date();
    const daysOverdue = Math.floor(
      (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Email reminder
    if (user.notificationPreference?.email) {
      const emailSubject = `Overdue Item Reminder: ${item.title}`;
      const emailBody = `
        <h2>Overdue Item Reminder</h2>
        <p>Dear ${user.fullName},</p>
        <p>This is a reminder that the following item is overdue:</p>
        <ul>
          <li><strong>Item:</strong> ${item.title}</li>
          <li><strong>Due Date:</strong> ${dueDate.toDateString()}</li>
          <li><strong>Days Overdue:</strong> ${daysOverdue}</li>
          <li><strong>Barcode:</strong> ${item.barcode}</li>
        </ul>
        <p>Please return the item as soon as possible to avoid additional penalties.</p>
        <p>Thank you,<br>Library Management System</p>
      `;

      await sendEmail(user.email, emailSubject, emailBody);
    }

    // WhatsApp reminder
    if (user.notificationPreference?.whatsApp && user.phoneNumber) {
      const whatsappMessage = `
          Overdue Item Reminder

          Dear ${user.fullName},

          This item is overdue:
          📚 ${item.title}
          📅 Due: ${dueDate.toDateString()} 
          ⏰ Overdue: ${daysOverdue} days
          📋 Barcode: ${item.barcode}

          Please return it ASAP to avoid penalties.

          Library Management System
      `;

      await sendWhatsAppMessage(user.phoneNumber, whatsappMessage);
    }

    return {
      emailSent: user.notificationPreference?.email || false,
      whatsappSent:
        (user.notificationPreference?.whatsApp && user.phoneNumber) || false,
    };
  } catch (error: any) {
    throw new Error(`Failed to send reminder: ${error.message}`);
  }
};

export const exportDefaulterReport = async (filters: DefaulterFilters) => {
  try {
    const defaulters = await getDefaulterReport(filters);

    // CSV headers
    const headers = [
      "User Name",
      "Employee ID",
      "Email",
      "Phone Number",
      "Role",
      "Item Title",
      "Barcode",
      "Issued Date",
      "Due Date",
      "Days Overdue",
      "Category",
    ];

    // Convert data to CSV rows
    const csvRows = defaulters.map((defaulter) => [
      `"${defaulter.userName}"`,
      `"${defaulter.employeeId || "-"}"`,
      `"${defaulter.userEmail}"`,
      `"${
        defaulter.phoneNumber
          ? defaulter.phoneNumber.slice(-4).padStart(10, "*")
          : "-"
      }"`,
      `"${defaulter.roleName}"`,
      `"${defaulter.itemTitle}"`,
      `"${defaulter.barcode}"`,
      `"${defaulter.issuedDate}"`,
      `"${defaulter.dueDate}"`,
      `"${defaulter.daysOverdue}"`,
      `"${defaulter.categoryName}"`,
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");

    return csvContent;
  } catch (error: any) {
    throw new Error(`Failed to export defaulter report: ${error.message}`);
  }
};
