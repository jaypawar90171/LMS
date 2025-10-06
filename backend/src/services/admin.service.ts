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

  // If there are no items at all in the collection → throw 404
  if (totalItems === 0) {
    const err: any = new Error("No inventory items found");
    err.statusCode = 404;
    throw err;
  }

  const items = await InventoryItem.find()
    .populate("categoryId", "name")
    .sort({ createdAt: -1 }) // ensure stable ordering
    .limit(limit)
    .skip(skip);

  // For later pages beyond available results → just return empty array
  return { items, totalItems };
};

export const createInventoryItemsService = async (data: any) => {
  const newItem = new InventoryItem(data);

  if (!newItem) {
    const err: any = new Error("No inventory items found");
    err.statusCode = 11000;
    throw err;
  }

  return await newItem.save();
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
      .populate('parentCategoryId', 'name description')
      .sort({ name: 1 });
    
    return buildCategoryTree(allCategories);
  }
  
  return await Category.find({})
    .populate('parentCategoryId', 'name description')
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

export const getIssuedReportService = async () => {
  const records = await IssuedIetm.find()
    .populate("userId", "fullName")
    .populate("itemId", "title")
    .lean();

  return records.map((record: any) => ({
    user: record.userId?.fullName || "Unknown",
    item: record.itemId?.title || "-",
    issueDate: record.issueDate
      ? new Date(record.issueDate).toISOString().split("T")[0]
      : "-",
    returnDate: record.returnDate
      ? new Date(record.returnDate).toISOString().split("T")[0]
      : "-",
    status: record.status || "Issued",
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

export const viewQueueService = async (itemId: string) => {
  const queue = await Queue.find({ itemId: itemId })
    .populate("itemId", "title status")
    .populate("queueMembers.userId", "fullName email");

  return queue || [];
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

    item.availableCopies -= 1;
    await item.save({ session });

    const issueDate = new Date();
    const defaultReturnPeriod = 15;
    const dueDate = new Date(
      issueDate.setDate(issueDate.getDate() + defaultReturnPeriod)
    );

    const issuedItem = new IssuedItem({
      itemId: queue.itemId,
      userId: userId,
      issueDate: new Date(),
      dueDate: dueDate,
      issuedBy: adminId,
      status: "Issued",
    });
    await issuedItem.save({ session });

    const remainingMembers = queue.queueMembers.filter(
      (member) => member.userId.toString() !== userId
    );

    const updatedMembers = remainingMembers.map((member, index) => ({
      ...member,
      position: index + 1,
    }));

    queue.queueMembers = updatedMembers;
    await queue.save({ session });

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
  // Start a new session for the database transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Find the queue by its ID within the transaction session
    const queue = await Queue.findById(queueId).session(session);

    // If the queue does not exist, throw an error
    if (!queue) {
      throw new Error("Queue not found.");
    }

    // 2. Add a defensive check to ensure queueMembers is an array and not empty
    if (!queue.queueMembers || queue.queueMembers.length === 0) {
      throw new Error("User is not in the queue.");
    }

    // 3. Find the index of the member to be removed using Mongoose's ObjectId.equals() method
    const memberIndex = queue.queueMembers.findIndex((member) =>
      member.userId.equals(new mongoose.Types.ObjectId(userId))
    );

    // If the user is not found in the queue, throw an error
    if (memberIndex === -1) {
      throw new Error("User is not in the queue.");
    }

    // 4. Remove the member from the array using splice
    queue.queueMembers.splice(memberIndex, 1);

    // 5. Re-assign positions to the remaining members to maintain order
    queue.queueMembers.forEach((member, index) => {
      member.position = index + 1;
    });

    // 6. Save the updated queue document within the transaction
    await queue.save({ session });

    // 7. Commit the transaction
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
