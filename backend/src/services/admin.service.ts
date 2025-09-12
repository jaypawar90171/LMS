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

  return {
    user: {
      id: user._id,
      email: user.email,
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
    user: activity.actor.name,
    action: activity.actionType,
    item: activity.target.name,
    date: activity.createdAt!.toISOString().split("T")[0],
  }));

  const recentOrders = (
    recentOrdersData as unknown as Array<{
      userId: { fullName: string };
      itemId: { title: string };
      status: string;
      issuedDate: Date;
    }>
  ).map((order) => ({
    // Access the properties through the populated objects
    user: order.userId.fullName,
    item: order.itemId.title,
    status: order.status,
    issuedDate: order.issuedDate!.toISOString().split("T")[0],
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

export const getAllUsersService = async () => {
  const users = await User.find().select("-password");
  return users;
};

export const createUserService = async ({
  fullName,
  email,
  userName,
  password,
  role,
  emp_id,
  ass_emp_id,
}: any) => {
  const existingUser = await User.findOne({
    $or: [{ email }, { username: userName }],
  });
  if (existingUser) {
    const err: any = new Error(
      "User with this email or username already exists."
    );
    err.statusCode = 409;
    throw err;
  }

  const userRole = await Role.findOne({ roleName: role });
  if (!userRole) {
    const err: any = new Error(`Role '${role}' not found.`);
    err.statusCode = 400;
    throw err;
  }
  const newUser = new User({
    fullName: fullName,
    email: email,
    username: userName,
    password: password,
    roles: [userRole._id],
    employeeId: emp_id,
    associatedEmployeeId: ass_emp_id,
    status: "Inactive",
  });

  await newUser.save();
  return newUser;
};

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
  const foundPermissions = await Permission.find({
    permissionKey: { $in: permissions },
  }).select("_id");

  if (!foundPermissions.length) {
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

  newRole.save();
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

export const fetchInventoryIetmsService = async () => {
  const items = await InventoryItem.find().populate("categoryId", "name");

  if (items.length === 0) {
    const err: any = new Error("No inventory items found");
    err.statusCode = 404;
    throw err;
  }
  return items;
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
      .select('name description')
      .lean();
    
    if (category) {
      (item as any).category = category;
      // Optionally remove the categoryId if you don't need it
      // delete item.categoryId;
    }
  }

  return item;
};

export const updateItemService = async ({ itemId, data }: any) => {
  const existingItem = await InventoryItem.findById(itemId);

  if (!existingItem) {
    const err: any = new Error("No such item exits");
    err.statusCode = 404;
    throw err;
  }

  const updatedData = await InventoryItem.findByIdAndUpdate(itemId, data, {
    new: true,
    runValidators: true,
  });

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

export const getCategoriesService = async () => {
  const categories = await Category.find({}, "name description").lean();

  if (!categories || categories.length === 0) {
    const err: any = new Error("No categories found");
    err.statusCode = 404;
    throw err;
  }

  return categories;
};

export const createCategoryService = async (data: any) => {
  const { name, description, defaultReturnPeriod } = data;

  const isExisting = await Category.findOne({ name });
  if (isExisting) {
    const err: any = new Error("Category already exists");
    err.statusCode = 404;
    throw err;
  }

  const category = new Category({
    name,
    description: description || "",
    defaultReturnPeriod: defaultReturnPeriod ?? null,
  });

  await category.save();
  return category;
};

export const updateCategoryService = async ({ categoryId, data }: any) => {
  const isCategoryExists = await Category.findById(categoryId);
  if (!isCategoryExists) {
    const err: any = new Error("No such category exits");
    err.statusCode = 404;
    throw err;
  }

  const updatedCatgory = await Category.findByIdAndUpdate(
    categoryId,
    { $set: data },
    { new: true, runValidators: true }
  );

  return updatedCatgory;
};

export const deleteCategoryService = async (categoryId: string) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    const err: any = new Error("No such category exists");
    err.statusCode = 404;
    throw err;
  }

  await Category.findByIdAndDelete(categoryId);

  return { message: "Category deleted successfully" };
};

export const getAllFinesService = async () => {
  const fines = await Fine.find();

  if (!fines || fines.length === 0) {
    const err: any = new Error("No fines found");
    err.statusCode = 404;
    throw err;
  }

  return fines;
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

export const generateInventoryReportPDF = async (res: Response) => {
  // Fetch inventory items with populated category
  const items = await InventoryItem.find()
  .populate<{ categoryId: Icategory }>('categoryId')
  .lean()
  .exec() as unknown as Array<{
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
  if (!donations || donations.length === 0) {
    const err: any = new Error("donations not available");
    err.statusCode = 404;
    throw err;
  }
  return donations;
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
    // If an error occurs, abort the transaction
    await session.abortTransaction();
    session.endSession();

    // Re-throw the error to be handled by the controller
    throw error;
  }
};
