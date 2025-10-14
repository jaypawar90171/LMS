import User from "../models/user.model";
import Role from "../models/role.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import InventoryItem from "../models/item.model";
import IssuedItem from "../models/issuedItem.model";
import Queue from "../models/queue.model";
import Category from "../models/category.model";
import ItemRequest from "../models/itemRequest.model";
import Setting from "../models/setting.model";
import { boolean } from "zod";
import Fine from "../models/fine.model";
import mongoose, { Types } from "mongoose";
import { IIssuedItem } from "../interfaces/issuedItems.interface";
import { IFine } from "../interfaces/fine.interface";
import Donation from "../models/donation.model";
import nodemailer from "nodemailer";
import IssueRequest from "../models/itemRequest.model";
import { sendEmail } from "../config/emailService";
import { sendWhatsAppMessage } from "../config/whatsapp";
import { NotificationService } from "../utility/notificationService";
import { logActivity } from "./activity.service";

interface RegisterDTO {
  fullName: string;
  email: string;
  userName: string;
  password: string;
  role: "employee" | "familyMember";
  emp_id?: string;
  ass_emp_id?: string;
}

interface loginDTO {
  email: string;
  password: string;
}

export const registerUserService = async (data: RegisterDTO) => {
  const { fullName, email, userName, password, role, emp_id, ass_emp_id } =
    data;

  // Check if email/username already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username: userName }],
  });

  if (existingUser) {
    const err: any = new Error(
      "A user with this email or username already exists."
    );
    err.statusCode = 409;
    throw err;
  }

  // Get role from Roles collection
  const userRole = await Role.findOne({ roleName: role });
  if (!userRole) {
    const err: any = new Error(`Role '${role}' not found.`);
    err.statusCode = 404;
    throw err;
  }

  const newUser = new User({
    fullName,
    email,
    username: userName,
    password,
    roles: [userRole._id],
    employeeId: role === "employee" ? emp_id : undefined,
    associatedEmployeeId: role === "familyMember" ? ass_emp_id : undefined,
  });

  await newUser.save();

  await NotificationService.createNotification({
    recipientId: newUser.id,
    title: "New User Registration",
    message: `New user ${fullName} (${email}) has registered.`,
    level: "Info",
    type: "user_registered",
    metadata: { userId: newUser.id.toString() },
  });

  await logActivity(
    { userId: newUser.id, name: newUser.fullName, role: role },
    "USER_CREATED",
    { userId: newUser.id, name: newUser.fullName, role: role },
    `${fullName} logged in successfully`
  );
  return newUser;
};

export const loginUserService = async (data: loginDTO) => {
  const { email, password } = data;

  if (!email || !password) {
    const err: any = new Error(`email and password required`);
    err.statusCode = 404;
    throw err;
  }

  const user = await User.findOne({ email: email })
    .populate("roles")
    .select("+password")
    .exec();

  if (!user) {
    const err: any = new Error(`email '${email}' not found.`);
    err.statusCode = 404;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err: any = new Error(`password not match.`);
    err.statusCode = 404;
    throw err;
  }

  if (user.status !== "Active") {
    const err: any = new Error(
      "Your account is not active. Please contact the administrator."
    );
    err.statusCode = 403;
    throw err;
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false }); // Skip validation to avoid hashing password again

  const payload = {
    id: user._id,
    email: user.email,
    username: user.username,
  };

  const token = jwt.sign(payload, process.env.SECRET_KEY!, {
    expiresIn: "10d",
  });

  const roleNames = user.roles.map((role: any) => role.roleName).join(", ");
  await logActivity(
    { userId: user.id, name: user.fullName, role: roleNames },
    "LOGIN",
    { userId: user.id, name: user.fullName, role: roleNames },
    `${user.fullName} logged in successfully`
  );

  return {
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      roles: user.roles,
      fullName: user.fullName,
      status: user.status,
      lastLogin: new Date(),
    },
    token: token,
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
        <a href="http://localhost:3000/api/user/auth/reset-password/${
          oldUser._id
        }/${token}" 
           style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #007BFF; text-decoration: none; border-radius: 5px;">
           Reset Password
        </a>
        <p style="margin-top: 20px;">If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
        <p><a href="http://localhost:3000/api/user/auth/reset-password/${
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

  const link = `http://localhost:3000/api/user/auth/reset-password/${oldUser._id}/${token}`;
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
  const secret = process.env.SECRET_KEY + oldUser.password;
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
    const oldUser = await User.findOne({ _id: id })
      .select("+password")
      .populate("roles")
      .exec();
    if (!oldUser) {
      const err: any = new Error("User does not exists");
      err.statusCode = 403;
      throw err;
    }
    const secret = process.env.SECRET_KEY + oldUser.password;
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
    ).populate("roles");

    const roleNames = oldUser.roles
      .map((role: any) => role.roleName)
      .join(", ");

    await logActivity(
      { userId: oldUser.id, name: oldUser.fullName, role: roleNames },
      "PASSWORD_RESET",
      { userId: oldUser.id, name: oldUser.fullName, role: roleNames },
      `Password for ${oldUser.fullName} has been reset sucessfully`
    );
    return verify;
  } catch (error) {}
};

export const dashboardSummaryService = async (userId: string) => {
  // Get user info for personalization
  const user = await User.findById(userId).select("fullName roles");

  // Get issued items with full item details and calculate overdue status
  const issuedItems = await IssuedItem.find({
    userId,
    status: "Issued",
  })
    .populate({
      path: "itemId",
      select: "title authorOrCreator mediaUrl categoryId",
    })
    .lean();

  // Calculate overdue status and days remaining
  const enhancedIssuedItems = issuedItems.map((item) => {
    const dueDate = new Date(item.dueDate);
    const today = new Date();
    const isOverdue = dueDate < today;
    const timeDiff = dueDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const daysOverdue = isOverdue ? Math.abs(daysRemaining) : 0;

    return {
      ...item,
      isOverdue,
      daysRemaining: isOverdue ? 0 : daysRemaining,
      daysOverdue,
    };
  });

  // Separate overdue items
  const overdueItems = enhancedIssuedItems.filter((item) => item.isOverdue);
  const currentIssuedItems = enhancedIssuedItems.filter(
    (item) => !item.isOverdue
  );

  // Get queued items with position and estimated wait
  const userQueues = await Queue.find({
    "queueMembers.userId": userId,
    "queueMembers.status": "waiting",
  })
    .populate({
      path: "itemId",
      select: "title authorOrCreator mediaUrl categoryId",
    })
    .lean();

  const enhancedQueuedItems = userQueues.map((queue) => {
    const userMember = queue.queueMembers.find(
      (member) => member.userId.toString() === userId
    );

    if (!userMember) {
      console.log("no userMember found");
      return;
    }

    // Calculate estimated wait time (simplified)
    const estimatedWait = userMember?.position * 7;

    return {
      _id: queue._id,
      itemId: queue.itemId,
      position: userMember?.position,
      dateJoined: userMember?.dateJoined,
      estimatedWaitTime: `wait ${estimatedWait} days`,
      totalQueueLength: queue.queueMembers.length,
    };
  });

  // Get new arrivals (existing logic)
  const newArrivals = await InventoryItem.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("categoryId", "name")
    .exec();

  return {
    user: {
      fullName: user?.fullName || "User",
      roles: user?.roles || [],
    },
    issuedItems: {
      current: currentIssuedItems,
      overdue: overdueItems,
    },
    queuedItems: enhancedQueuedItems,
    newArrivals: newArrivals || [],
  };
};

export const getIssueddItemsSerive = async (userId: string) => {
  const isExistingUser = await User.findById(userId);
  if (!isExistingUser) {
    const err: any = new Error("No user found");
    err.statusCode = 404;
    throw err;
  }

  const issuedItems = await IssuedItem.find({ userId })
    .populate({ path: "userId", select: "fullName email" })
    .populate({ path: "itemId", select: "title description" });

  return issuedItems || [];
};

export const getCategoriesService = async () => {
  const categories = await Category.find({})
    .populate("parentCategoryId", "name")
    .select(
      "name description parentCategoryId defaultReturnPeriod createdAt updatedAt"
    )
    .lean();

  if (!categories || categories.length === 0) {
    const err: any = new Error("No categories found");
    err.statusCode = 404;
    throw err;
  }

  const categoriesWithType = categories.map((category) => ({
    ...category,
    categoryType: category.parentCategoryId ? "subcategory" : "parent",
    parentCategoryName: category.parentCategoryId
      ? (category.parentCategoryId as any).name
      : null,
  }));
  return categoriesWithType;
};

export const getCategoryItemsService = async (categoryId: string) => {
  const isCategoryExits = await Category.findById(categoryId);

  if (!isCategoryExits) {
    const err: any = new Error("No categories found");
    err.statusCode = 404;
    throw err;
  }

  const items = await InventoryItem.find({ categoryId: categoryId })
    .populate({
      path: "categoryId",
      select: "name description parentCategoryId",
      populate: {
        path: "parentCategoryId",
        select: "name description",
      },
    })
    .sort({ createdAt: -1 })
    .lean();

  if (!items || items.length === 0) {
    const err: any = new Error("No items found for this category");
    err.statusCode = 404;
    throw err;
  }

  return items;
};

export const getItemService = async (itemId: string) => {
  const items = await InventoryItem.findById(itemId)
    .populate("categoryId", "name description")
    .populate("subcategoryId", "name description");

  if (!items) {
    const err: any = new Error("No items found for this category");
    err.statusCode = 404;
    throw err;
  }

  return items;
};

export const getRequestedItemsSerice = async (userId: string) => {
  const isExistingUser = await User.findById(userId);
  if (!isExistingUser) {
    const err: any = new Error("No user found");
    err.statusCode = 404;
    throw err;
  }

  const requestedItems = await ItemRequest.find({ userId: userId })
    .populate("userId", "fullName email")
    .populate("categoryId", "name description")
    .populate("subcategoryId", "name description");

  return requestedItems || [];
};

export const requestItemService = async (
  userId: string,
  validatedData: any
) => {
  const { title, authorOrCreator, itemType, reasonForRequest } = validatedData;

  const user = await User.findById(userId).populate("roles");
  if (!user) {
    const err: any = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  const existingRequest = await ItemRequest.findOne({
    userId,
    title: title,
    status: "Pending",
  });

  if (existingRequest) {
    const err: any = new Error(
      "You have already requested this item and it's still pending"
    );
    err.statusCode = 400;
    throw err;
  }

  const newRequest = new ItemRequest({
    userId,
    title: title,
    authorOrCreator: authorOrCreator,
    itemType: itemType,
    reasonForRequest: reasonForRequest,
    status: "Pending",
  });

  await newRequest.save();

  const roleNames = user.roles.map((role: any) => role.roleName).join(", ");

  await logActivity(
    { userId: user.id, name: user.fullName, role: roleNames },
    "ITEM_REQUESTED",
    { userId: user.id, name: user.fullName, role: roleNames },
    `Password for ${user.fullName} has been reset sucessfully`
  );

  return newRequest;
};

export const getQueuedItemsService = async (userId: any) => {
  const user = await User.findById(userId).populate("roles");

  if (!user) {
    const err: any = new Error("No user found");
    err.statusCode = 404;
    throw err;
  }

  const queueItems = await Queue.find({ "queueMembers.userId": userId })
    .populate({
      path: "itemId",
      select: "title description authorOrCreator mediaUrl categoryId",
      populate: {
        path: "categoryId",
        select: "name description parentCategoryId",
        populate: {
          path: "parentCategoryId",
          select: "name description",
        },
      },
    })
    .populate("queueMembers.userId", "fullName email");

  return queueItems || [];
};

export const getQueueItemByIdService = async (queueId: string) => {
  try {
    const queueItem = await Queue.findById(queueId)
      .populate({
        path: "itemId",
        select: "title description authorOrCreator mediaUrl categoryId",
        populate: {
          path: "categoryId",
          select: "name description parentCategoryId",
          populate: {
            path: "parentCategoryId",
            select: "name description",
          },
        },
      })
      .populate("queueMembers.userId", "fullName email")
      .exec();

    if (!queueItem) {
      throw new Error("Queue item not found");
    }

    return queueItem;
  } catch (error) {
    throw error;
  }
};

export const withdrawFromQueueService = async (
  queueId: string,
  userId: string
) => {
  try {
    const queue = await Queue.findById(queueId);

    if (!queue) {
      throw new Error("Queue item not found");
    }

    const memberIndex = queue.queueMembers.findIndex(
      (member) => member.userId.toString() === userId
    );

    if (memberIndex === -1) {
      throw new Error("Not authorized or user not found in this queue");
    }

    queue.queueMembers.splice(memberIndex, 1);

    queue.queueMembers.sort((a, b) => a.position - b.position);

    queue.queueMembers.forEach((member, index) => {
      member.position = index + 1;
    });

    await queue.save();

    return { message: "Successfully withdrawn from queue" };
  } catch (error) {
    throw error;
  }
};

export const extendIssuedItemService = async (
  itemId: string,
  userId: string
) => {
  const issuedItem = await IssuedItem.findOne({
    itemId,
    userId,
    status: "Issued",
  });

  const user = await User.findById(userId).populate("roles");
  if (!user) {
    const err: any = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  if (!issuedItem) {
    const err: any = new Error("No active issued item found for this user");
    err.statusCode = 404;
    throw err;
  }

  const settings = await Setting.findOne();
  if (!settings || !settings.borrowingLimits) {
    const err: any = new Error("System borrowing limits not configured");
    err.statusCode = 500;
    throw err;
  }

  const { maxPeriodExtensions, extensionPeriodDays } = settings.borrowingLimits;

  if (issuedItem.extensionCount >= maxPeriodExtensions) {
    const err: any = new Error("Maximum extension limit reached");
    err.statusCode = 400;
    throw err;
  }

  const newDueDate = new Date(issuedItem.dueDate);
  newDueDate.setDate(newDueDate.getDate() + extensionPeriodDays);

  issuedItem.dueDate = newDueDate;
  issuedItem.extensionCount += 1;

  await issuedItem.save();

  const roleNames = user.roles.map((role: any) => role.roleName).join(", ");
  await logActivity(
    { userId: user.id, name: user.fullName, role: roleNames },
    "EXTEND_PERIOD",
    { userId: user.id, name: user.fullName, role: roleNames },
    `${user.fullName} requested for extend period for the item ${itemId}`
  );

  return issuedItem;
};

export const returnItemRequestService = async (
  itemId: string,
  userId: string,
  status: "Returned" | "Damaged" | "Lost"
) => {
  const issuedItem = await IssuedItem.findOne({
    itemId,
    userId: userId,
    status: "Issued",
  });

  if (!issuedItem) {
    const err: any = new Error("No active issued item found for this user");
    err.statusCode = 404;
    throw err;
  }

  const user = await User.findById(userId).populate("roles");

  if (!user) {
    const err: any = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  const setting = await Setting.findOne({});
  if (!setting) {
    const err: any = new Error("System settings not configured");
    err.statusCode = 500;
    throw err;
  }

  const {
    overdueFineRatePerDay,
    lostItemBaseFine,
    damagedItemBaseFine,
    fineGracePeriodDays,
  } = setting.fineRates;

  const now = new Date();
  let fineAmount = 0;
  let fineReason: string | null = null;

  if (status === "Returned") {
    if (issuedItem.dueDate && now > issuedItem.dueDate) {
      const diffDays = Math.ceil(
        (now.getTime() - issuedItem.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays > fineGracePeriodDays) {
        fineAmount = (diffDays - fineGracePeriodDays) * overdueFineRatePerDay;
        fineReason = "Overdue";
      }
    }
  }

  if (status === "Damaged") {
    fineAmount = damagedItemBaseFine;
    fineReason = "Damaged";
  }

  if (status === "Lost") {
    fineAmount = lostItemBaseFine;
    fineReason = "Lost";
  }

  issuedItem.returnDate = now;
  issuedItem.status = "Returned";
  await issuedItem.save();

  const inventoryItem = await InventoryItem.findById(issuedItem.itemId);
  if (!inventoryItem) {
    const err: any = new Error("Inventory item not found");
    err.statusCode = 404;
    throw err;
  }

  if (status === "Returned") {
    inventoryItem.availableCopies += 1;
    inventoryItem.status = "Available";
  } else if (status === "Damaged") {
    inventoryItem.status = "Damaged";
  } else if (status === "Lost") {
    inventoryItem.status = "Lost";
  }
  await inventoryItem.save();

  let fineRecord = null;
  if (fineAmount > 0 && fineReason) {
    fineRecord = await Fine.create({
      userId: issuedItem.userId,
      itemId: issuedItem.itemId,
      reason: fineReason,
      amountIncurred: fineAmount,
      amountPaid: 0,
      outstandingAmount: fineAmount,
      status: "Outstanding",
      dateIncurred: now,
    });

    issuedItem.fineId = fineRecord._id as Types.ObjectId;
    await issuedItem.save();
  }

  const roleNames = user.roles.map((role: any) => role.roleName).join(", ");
  await logActivity(
    { userId: user.id, name: user.fullName, role: roleNames },
    "ITEM_RETURN_REQUEST",
    { userId: user.id, name: user.fullName, role: roleNames },
    `${user.fullName} requested for item return for the item ${itemId}`
  );

  return {
    issuedItem,
    fine: fineRecord,
  };
};

export const requestNewItemService = async (
  userId: string,
  validatedData: any
) => {
  const { title, authorOrCreator, itemType, reasonForRequest } = validatedData;

  const user = await User.findById(userId).populate("roles");

  if (!user) {
    const err: any = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  const category = await Category.findOne({ name: itemType });

  if (!category) {
    const err: any = new Error(`Category '${itemType}' not found`);
    err.statusCode = 404;
    throw err;
  }

  const item = new ItemRequest({
    userId: new Types.ObjectId(userId),
    title: title,
    authorOrCreator: authorOrCreator,
    itemType: category._id,
    reasonForRequest: reasonForRequest,
  });

  await item.save();

  const roleNames = user.roles.map((role: any) => role.roleName).join(", ");
  await logActivity(
    { userId: user.id, name: user.fullName, role: roleNames },
    "REQUEST_NEW_ITEM",
    { userId: user.id, name: user.fullName, role: roleNames },
    `${user.fullName} requested for new item ${title}`
  );

  return item;
};

export const getNewArrivalsService = async () => {
  const newArrivals = await InventoryItem.find({ status: "Available" })
    .sort({ createdAt: -1 })
    .limit(10)
    .exec();

  return newArrivals || [];
};

export const getHistoryService = async (userId: string) => {
  const issuedItems = await IssuedItem.find({ userId })
    .populate("itemId", "title authorOrCreator type")
    .populate("fineId", "reason amountIncurred outstandingAmount status")
    .sort({ createdAt: -1 })
    .lean();

  const currentlyBorrowed = issuedItems.filter((i) => i.status === "Issued");
  const returnedItems = issuedItems.filter((i) => i.status === "Returned");

  const fines = await Fine.find({ userId }).sort({ createdAt: -1 }).lean();

  return {
    recentlyBorrowed: currentlyBorrowed.map((i) => ({
      id: i._id,
      title: (i.itemId as any)?.title,
      author: (i.itemId as any)?.authorOrCreator,
      issueDate: i.issuedDate,
      dueDate: i.dueDate,
      status: i.status,
      fine: i.fineId || null,
    })),
    returnedItems: returnedItems.map((i) => ({
      id: i._id,
      title: (i.itemId as any)?.title,
      author: (i.itemId as any)?.authorOrCreator,
      issueDate: i.issuedDate,
      returnDate: i.returnDate,
      status: i.status,
      fine: i.fineId || null,
    })),
    fines: fines.map((f) => ({
      id: f._id,
      reason: f.reason,
      amount: f.amountIncurred,
      outstanding: f.outstandingAmount,
      status: f.status,
      dateIncurred: f.dateIncurred,
    })),
  };
};

// export const createIssueRequestService = async (userId: string, itemId: string) => {
//   // Check if item exists and is available
//   const item = await InventoryItem.findById(itemId);
//   if (!item) {
//     const err: any = new Error("Item not found");
//     err.statusCode = 404;
//     throw err;
//   }

//   if (item.availableCopies <= 0) {
//     const err: any = new Error("Item not available");
//     err.statusCode = 400;
//     throw err;
//   }

//   if (item.status !== "Available") {
//     const err: any = new Error(`Item is ${item.status}`);
//     err.statusCode = 400;
//     throw err;
//   }

//   // Check if user already has a pending request for this item
//   const existingRequest = await IssueRequest.findOne({
//     userId,
//     itemId,
//     status: "pending"
//   });

//   if (existingRequest) {
//     const err: any = new Error("You already have a pending request for this item");
//     err.statusCode = 400;
//     throw err;
//   }

//   // Check user eligibility (no overdue items, max limit, etc.)
//   const overdueItems = await IssuedItem.find({
//     userId,
//     dueDate: { $lt: new Date() },
//     status: "Issued"
//   });

//   if (overdueItems.length > 0) {
//     const err: any = new Error(`You have ${overdueItems.length} overdue item(s)`);
//     err.statusCode = 400;
//     throw err;
//   }

//   // Check max issue limit
//   const currentIssuedItems = await IssuedItem.countDocuments({
//     userId,
//     status: "Issued"
//   });

//   const maxIssuedItems = 5; // Configurable
//   if (currentIssuedItems >= maxIssuedItems) {
//     const err: any = new Error(`You have reached maximum issue limit of ${maxIssuedItems} items`);
//     err.statusCode = 400;
//     throw err;
//   }

//   // Create issue request
//   const issueRequest = new IssueRequest({
//     userId,
//     itemId,
//     status: "pending"
//   });

//   await issueRequest.save();

//   // Populate the response
//   await issueRequest.populate("itemId", "title authorOrCreator categoryId");

//   return {
//     message: "Issue request submitted successfully. Waiting for admin approval.",
//     request: issueRequest
//   };
// };

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
  const defaultPeriod = defaultReturnPeriod || 14;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + defaultPeriod);
  return dueDate;
};

const issueItemImmediately = async (
  userId: string,
  itemId: string,
  session: mongoose.ClientSession
) => {
  const item = await InventoryItem.findById(itemId).session(session);
  if (!item) throw new Error("Item not found");

  const user = await User.findById(userId).populate("roles");

  if (!user) {
    const err: any = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

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

  // Update item available copies
  item.availableCopies -= 1;
  if (item.availableCopies === 0) {
    item.status = "Issued";
  }
  await item.save({ session });

  // Send notification
  await sendIssueNotification(userId, item.title, dueDate, "immediate");

  await session.commitTransaction();
  session.endSession();

  const roleNames = user.roles.map((role: any) => role.roleName).join(", ");
  await logActivity(
    { userId: user.id, name: user.fullName, role: roleNames },
    "ITEM_ISSUED",
    { userId: user.id, name: user.fullName, role: roleNames },
    `${user.fullName} has issued an item ${issuedItem.itemId}`
  );

  return {
    message: "Item issued successfully",
    issuedItem: {
      _id: issuedItem._id,
      itemTitle: item.title,
      dueDate: issuedItem.dueDate,
    },
    type: "immediate",
  };
};

const addUserToQueue = async (
  userId: string,
  itemId: string,
  session: mongoose.ClientSession
) => {
  // Find or create queue for the item
  let queue = await Queue.findOne({ itemId }).session(session);

  if (!queue) {
    queue = new Queue({
      itemId,
      queueMembers: [],
      isProcessing: false,
    });
  }

  const user = await User.findById(userId).populate("roles");

  if (!user) {
    const err: any = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  // Check if user is already in queue
  const existingMember = queue.queueMembers.find(
    (member) => member.userId.toString() === userId
  );

  if (existingMember) {
    const err: any = new Error("You are already in the queue for this item");
    err.statusCode = 400;
    throw err;
  }

  // Add user to queue
  const position = queue.queueMembers.length + 1;
  queue.queueMembers.push({
    userId: new mongoose.Types.ObjectId(userId),
    position,
    dateJoined: new Date(),
    status: "waiting",
  });

  await queue.save({ session });

  // Send queue position notification
  await sendQueuePositionNotification(userId, itemId, position);

  await session.commitTransaction();
  session.endSession();

  const roleNames = user.roles.map((role: any) => role.roleName).join(", ");
  await logActivity(
    { userId: user.id, name: user.fullName, role: roleNames },
    "USER_ADDED_TO_QUEUE",
    { userId: user.id, name: user.fullName, role: roleNames },
    `${user.fullName} has been added to queue for an item ${itemId}`
  );

  return {
    message: `Item is currently unavailable. You have been added to the queue at position ${position}.`,
    queuePosition: position,
    type: "queued",
  };
};

const sendIssueNotification = async (
  userId: string,
  itemTitle: string,
  dueDate: Date,
  type: string
) => {
  try {
    const user = await User.findById(userId).populate("roles");
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

    const roleNames = user.roles.map((role: any) => role.roleName).join(", ");
    await logActivity(
      { userId: user.id, name: user.fullName, role: roleNames },
      "NOTIFICATION",
      { userId: user.id, name: user.fullName, role: roleNames },
      `Item Issued notification is send to the ${user.fullName}`
    );
  } catch (error) {
    console.error("Error sending issue notification:", error);
  }
};

const sendQueuePositionNotification = async (
  userId: string,
  itemId: string,
  position: number
) => {
  try {
    const user = await User.findById(userId).populate("roles");
    if (!user) {
      const err: any = new Error("User not found.");
      err.statusCode = 404;
      throw err;
    }
    const item = await InventoryItem.findById(itemId);

    if (!user || !item) return;

    const message = `You have been added to the queue for "${item.title}". Your position: ${position}. You will be notified when the item becomes available.`;

    if (user.notificationPreference?.email) {
      await sendEmail(user.email, "Added to Queue", message);
    }

    if (user.notificationPreference?.whatsApp && user.phoneNumber) {
      await sendWhatsAppMessage(user.phoneNumber, message);
    }

    const roleNames = user.roles.map((role: any) => role.roleName).join(", ");
    await logActivity(
      { userId: user.id, name: user.fullName, role: roleNames },
      "NOTIFICATION",
      { userId: user.id, name: user.fullName, role: roleNames },
      `Queue notification is send to the ${user.fullName}`
    );
  } catch (error) {
    console.error("Error sending queue notification:", error);
  }
};

export const createIssueRequestService = async (
  userId: string,
  itemId: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if item exists
    const item = await InventoryItem.findById(itemId).session(session);
    if (!item) {
      const err: any = new Error("Item not found");
      err.statusCode = 404;
      throw err;
    }

    // Check user eligibility
    const eligibility = await checkUserEligibility(
      new mongoose.Types.ObjectId(userId)
    );
    if (!eligibility.eligible) {
      const err: any = new Error(eligibility.reason);
      err.statusCode = 400;
      throw err;
    }

    // Check if item is available
    if (item.availableCopies > 0 && item.status === "Available") {
      // Item is available - issue immediately
      return await issueItemImmediately(userId, itemId, session);
    } else {
      // Item not available - add to queue
      return await addUserToQueue(userId, itemId, session);
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const getMyIssueRequestsService = async (userId: string) => {
  const requests = await IssueRequest.find({ userId })
    .populate("itemId", "title authorOrCreator categoryId availableCopies")
    .sort({ requestedAt: -1 });

  return requests;
};

export const getAllFinesService = async (userId: string) => {
  const fines = await Fine.find({ userId }).sort({ createdAt: -1 }).lean();

  return {
    fines:
      fines.map((f) => ({
        id: f._id,
        reason: f.reason,
        amount: f.amountIncurred,
        outstanding: f.outstandingAmount,
        status: f.status,
        dateIncurred: f.dateIncurred,
      })) || [],
  };
};

export const getProfileDetailsService = async (userId: string) => {
  const user = await User.findById(userId)
    .select("-passwordResetToken -passwordResetExpires -__v")
    .populate("roles", "roleName description")
    .lean();

  if (!user) {
    const err: any = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    username: user.username,
    phoneNumber: user.phoneNumber,
    dateOfBirth: user.dateOfBirth,
    address: user.address,
    profile: user.profile,
    status: user.status,
    roles: user.roles,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export const updateProfileService = async (
  userId: string,
  profileData: any
) => {
  const allowedUpdates = [
    "fullName",
    "phoneNumber",
    "dateOfBirth",
    "address",
    "username",
  ];

  const updates: any = {};
  for (const key of allowedUpdates) {
    if (profileData[key] !== undefined) {
      updates[key] = profileData[key];
    }
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate("roles");

  if (!user) {
    const err: any = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const roleNames = user.roles.map((role: any) => role.roleName).join(", ");
  await logActivity(
    { userId: user.id, name: user.fullName, role: roleNames },
    "USER_UPDATED",
    { userId: user.id, name: user.fullName, role: roleNames },
    `Profile updated for the user ${user.fullName}`
  );

  return user;
};

export const updateNotificationPreferenceService = async (
  userId: string,
  preferences: any
) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { notificationPreference: preferences } },
    { new: true, runValidators: true }
  ).populate("roles");

  if (!user) {
    const err: any = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const roleNames = user.roles.map((role: any) => role.roleName).join(", ");
  await logActivity(
    { userId: user.id, name: user.fullName, role: roleNames },
    "USER_UPDATED",
    { userId: user.id, name: user.fullName, role: roleNames },
    `Notification settings updated for the user ${user.fullName}`
  );

  return user;
};

export const updatePasswordService = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await User.findById(userId)
    .select("+password")
    .populate("roles");
  if (!user) {
    const err: any = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    const err: any = new Error("Current password is incorrect");
    err.statusCode = 401;
    throw err;
  }

  user.password = newPassword;
  await user.save();

  const roleNames = user.roles.map((role: any) => role.roleName).join(", ");
  await logActivity(
    { userId: user.id, name: user.fullName, role: roleNames },
    "PASSWORD_CHANGED",
    { userId: user.id, name: user.fullName, role: roleNames },
    `Password changed for the user ${user.fullName}`
  );

  return true;
};

export const expressDonationInterestService = async (
  userId: string,
  data: {
    itemType: string;
    title: string;
    description?: string;
    photos?: string[];
    duration?: number;
    preferredContactMethod?: "Email" | "whatsApp";
  }
) => {
  const {
    itemType,
    title,
    description,
    photos,
    duration = 0,
    preferredContactMethod = "whatsApp",
  } = data;

  const user = await User.findById(userId).populate("roles");

  if (!user) {
    const err: any = new Error("User not found.");
    err.statusCode = 404;
    throw err;
  }

  if (!title.trim()) {
    const err: any = new Error("Title is required");
    err.statusCode = 400;
    throw err;
  }

  if (!itemType) {
    const err: any = new Error("Item type/category is required");
    err.statusCode = 400;
    throw err;
  }

  // Validate duration
  if (duration < 0) {
    const err: any = new Error("Duration cannot be negative");
    err.statusCode = 400;
    throw err;
  }

  let category;
  if (Types.ObjectId.isValid(itemType)) {
    category = await Category.findById(itemType);
  } else {
    category = await Category.findOne({
      $or: [{ name: itemType }, { categoryName: itemType }],
    });
  }

  if (!category) {
    const err: any = new Error("Invalid category/item type");
    err.statusCode = 400;
    throw err;
  }

  const donationType = duration === 0 ? "giveaway" : "duration";

  const donation = new Donation({
    userId: new Types.ObjectId(userId),
    itemType: category._id,
    title: title.trim(),
    description: description?.trim(),
    photos,
    duration,
    donationType,
    preferredContactMethod,
    status: "Pending",
  });

  console.log("Donation" + donation);
  await donation.save();

  const roleNames = ["Admin", "librarian", "superAdmin"];
  const roles = await Role.find({ roleName: { $in: roleNames } });
  const roleIds = roles.map((role) => role._id);

  const adminUsers = await User.find({
    roles: { $in: roleIds },
  });

  const adminNotificationPromises = adminUsers.map((admin) =>
    NotificationService.createNotification({
      recipientId: admin._id.toString(),
      title: "New Donation Submission",
      message: `User ${userId} submitted a ${donationType} donation: "${donation.title}".`,
      level: "Success",
      type: "donation_submitted",
      metadata: {
        userId: userId.toString(),
        donationId: donation.id.toString(),
        donationType: donationType,
      },
    })
  );

  const userNotificationPromise = NotificationService.createNotification({
    recipientId: userId,
    title: "Donation Submitted Successfully",
    message: `Your ${donationType} donation "${donation.title}" has been submitted successfully and is under review.`,
    level: "Success",
    type: "donation_submitted",
    metadata: { donationId: donation.id.toString() },
  });

  await Promise.all([...adminNotificationPromises, userNotificationPromise]);

  await donation.populate("itemType", "name description");
  await donation.populate("userId", "fullName email");

  const roleName = user.roles.map((role: any) => role.roleName).join(", ");
  await logActivity(
    { userId: user.id, name: user.fullName, role: roleName },
    "ITEM_DONATION",
    { userId: user.id, name: user.fullName, role: roleName },
    `${user.fullName} has request for the new item ${title}`
  );

  return donation;
};
