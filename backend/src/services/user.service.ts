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
import { Types } from "mongoose";
import { IIssuedItem } from "../interfaces/issuedItems.interface";
import { IFine } from "../interfaces/fine.interface";
import Donation from "../models/donation.model";
import nodemailer from "nodemailer";

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
  return newUser;
};

export const loginUserService = async (data: loginDTO) => {
  const { email, password } = data;

  if (!email || !password) {
    const err: any = new Error(`email and password required`);
    err.statusCode = 404;
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

  const payload = {
    id: user._id,
    email: user.email,
    username: user.username,
  };

  const token = jwt.sign(payload, process.env.SECRET_KEY!, {
    expiresIn: "10d",
  });
  return {
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      roles: user.roles,
      fullName: user.fullName,
      status: user.status,
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
    const oldUser = await User.findOne({ _id: id }).select("+password").exec();
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
    );
    return verify;
  } catch (error) {}
};

export const dashboardSummaryService = async (userId: string) => {
  const issuedItems = await IssuedItem.find({ userId })
    .populate({ path: "itemId", select: "name category" })
    .populate({ path: "issuedBy", select: "fullName" });

  const queuedItems = await Queue.find({ userId }).populate({
    path: "itemId",
    select: "name category",
  });

  const newArrivals = await InventoryItem.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .exec();

  return {
    issuedItems: issuedItems || [],
    queuedItems: queuedItems || [],
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
  const categories = await Category.find({}, "name description").lean();

  if (!categories || categories.length === 0) {
    const err: any = new Error("No categories found");
    err.statusCode = 404;
    throw err;
  }

  return categories;
};

export const getCategoryItemsService = async (categoryId: string) => {
  const isCategoryExits = await Category.findById(categoryId);
  if (!isCategoryExits) {
    const err: any = new Error("No categories found");
    err.statusCode = 404;
    throw err;
  }

  const items = await InventoryItem.find({ categoryId: categoryId });
  if (!items || items.length === 0) {
    const err: any = new Error("No items found for this category");
    err.statusCode = 404;
    throw err;
  }

  return items;
};

export const getItemService = async (itemId: string) => {
  const items = await InventoryItem.findById(itemId).populate({
    path: "categoryId",
    select: "name description",
  });
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

  const requestedItems = ItemRequest.find({ userId: userId }).populate(
    "userId",
    "fullName email"
  );
  return requestedItems || [];
};

export const requestItemService = async (
  userId: string,
  validatedData: any
) => {
  const { title, authorOrCreator, itemType, reasonForRequest } = validatedData;

  const existingRequest = await ItemRequest.findOne({
    userId,
    title: title,
    status: "Pending",
  });

  if (existingRequest) {
    const err: any = new Error(
      "You have already requested this item and it’s still pending"
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

  return newRequest;
};

export const getQueuedItemsService = async (userId: any) => {
  const isExistingUser = await User.findById(userId);

  if (!isExistingUser) {
    const err: any = new Error("No user found");
    err.statusCode = 404;
    throw err;
  }

  const queueItems = await Queue.find({ "queueMembers.userId": userId })
    .populate("itemId", "title description")
    .populate("queueMembers.userId", "fullName email");
  return queueItems || [];
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

  if (
    issuedItem.extensionCount >= maxPeriodExtensions ||
    issuedItem.extensionCount + 1 > issuedItem.maxExtensionAllowed
  ) {
    const err: any = new Error("Maximum extension limit reached");
    err.statusCode = 400;
    throw err;
  }

  const newDueDate = new Date(issuedItem.dueDate);
  newDueDate.setDate(newDueDate.getDate() + extensionPeriodDays);

  issuedItem.dueDate = newDueDate;
  issuedItem.extensionCount += 1;

  await issuedItem.save();

  return issuedItem;
};

export const returnItemRequestService = async (
  itemId: string,
  userId: string,
  status: "Returned" | "Damaged" | "Lost"
) => {
  const issuedItem = await IssuedItem.findOne({
    _id: itemId,
    userId: userId,
    status: "Issued",
  });

  if (!issuedItem) {
    const err: any = new Error("No active issued item found for this user");
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

  return item;
};

export const getNewArrivalsService = async () => {
  const newArrivals = await InventoryItem.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .exec();

  return newArrivals || [];
};

export const issueOrQueueService = async (userId: string, itemId: string) => {
  const item = await InventoryItem.findById(itemId);
  if (!item) {
    const err: any = new Error("Item not found");
    err.statusCode = 404;
    throw err;
  }

  // CASE: 1
  if (item.status === "Available" && item.availableCopies > 0) {
    const issueRequest = await IssuedItem.create({
      itemId: item._id,
      userId: new Types.ObjectId(userId),
      issueDate: null,
      dueDate: null,
    });

    return {
      message: "Issue request created successfully. Pending admin approval.",
      data: issueRequest,
    };
  }

  // CASE: 2
  if (item.status === "Issued" || item.availableCopies === 0) {
    let queue = await Queue.findOne({ itemId: item._id });

    if (!queue) {
      queue = new Queue({
        itemId: item._id,
        queueMembers: [],
      });
    }

    const alreadyInQueue = queue.queueMembers.some(
      (m: any) => m.userId.toString() === userId
    );
    if (alreadyInQueue) {
      const err: any = new Error("User already in queue for this item");
      err.statusCode = 400;
      throw err;
    }

    queue.queueMembers.push({
      userId: new Types.ObjectId(userId),
      position: queue.queueMembers.length + 1,
      dateJoined: new Date(),
    });

    await queue.save();

    return {
      message: "User added to queue for this item",
      data: queue,
    };
  }

  const err: any = new Error("Unsupported item status");
  err.statusCode = 400;
  throw err;
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
  );

  if (!user) {
    const err: any = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

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
  );

  if (!user) {
    const err: any = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  return user;
};

export const updatePasswordService = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await User.findById(userId).select("+password");
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

  return true;
};

export const expressDonationInterestService = async (
  userId: string,
  data: any
) => {
  const { itemType, title, description, photos, preferredContactMethod } = data;

  const category = await Category.findOne({ name: itemType });
  if (!category) {
    const err: any = new Error("Invalid category");
    err.statusCode = 400;
    throw err;
  }

  const donation = new Donation({
    userId: new Types.ObjectId(userId),
    itemType: category._id,
    title,
    description,
    photos,
    preferredContactMethod,
    status: "Pending",
  });

  await donation.save();

  return donation;
};
