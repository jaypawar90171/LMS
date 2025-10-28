"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotificationService = exports.markAsReadService = exports.getUserNotificationService = exports.withdrawDonationService = exports.getMyDonationsService = exports.expressDonationInterestService = exports.updatePasswordService = exports.updateNotificationPreferenceService = exports.updateProfileService = exports.getProfileDetailsService = exports.getAllFinesService = exports.getMyIssueRequestsService = exports.createIssueRequestService = exports.getHistoryService = exports.getNewArrivalsService = exports.deleteRequestedItemService = exports.getNewSpecificRequestedItemService = exports.getNewRequestedItemService = exports.requestNewItemService = exports.returnItemRequestService = exports.extendIssuedItemService = exports.withdrawFromQueueService = exports.getQueueItemByIdService = exports.getQueuedItemsService = exports.requestItemService = exports.getRequestedItemsSerice = exports.getItemService = exports.getCategoryItemsService = exports.getCategoriesService = exports.getIssueddItemsSerive = exports.dashboardSummaryService = exports.resetPasswordService = exports.verifyResetPasswordService = exports.forgotPasswordService = exports.loginUserService = exports.registerUserService = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const role_model_1 = __importDefault(require("../models/role.model"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv/config");
const item_model_1 = __importDefault(require("../models/item.model"));
const issuedItem_model_1 = __importDefault(require("../models/issuedItem.model"));
const queue_model_1 = __importDefault(require("../models/queue.model"));
const category_model_1 = __importDefault(require("../models/category.model"));
const itemRequest_model_1 = __importDefault(require("../models/itemRequest.model"));
const setting_model_1 = __importDefault(require("../models/setting.model"));
const fine_model_1 = __importDefault(require("../models/fine.model"));
const mongoose_1 = __importStar(require("mongoose"));
const donation_model_1 = __importDefault(require("../models/donation.model"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const itemRequest_model_2 = __importDefault(require("../models/itemRequest.model"));
const emailService_1 = require("../config/emailService");
const whatsapp_1 = require("../config/whatsapp");
const notificationService_1 = require("../utility/notificationService");
const activity_service_1 = require("./activity.service");
const requestedItem_model_1 = __importDefault(require("../models/requestedItem.model"));
const notofication_modal_1 = __importDefault(require("../models/notofication.modal"));
const registerUserService = async (data) => {
    const { fullName, email, userName, password, role, emp_id, ass_emp_id } = data;
    const existingUser = await user_model_1.default.findOne({
        $or: [{ email }, { username: userName }],
    });
    if (existingUser) {
        const err = new Error("A user with this email or username already exists.");
        err.statusCode = 409;
        throw err;
    }
    const userRole = await role_model_1.default.findOne({ roleName: role });
    if (!userRole) {
        const err = new Error(`Role '${role}' not found.`);
        err.statusCode = 404;
        throw err;
    }
    const newUser = new user_model_1.default({
        fullName,
        email,
        username: userName,
        password,
        roles: [userRole._id],
        employeeId: role === "employee" ? emp_id : undefined,
        associatedEmployeeId: role === "familyMember" ? ass_emp_id : undefined,
    });
    await newUser.save();
    await notificationService_1.NotificationService.createNotification({
        recipientId: newUser.id,
        title: "New User Registration",
        message: `New user ${fullName} (${email}) has registered.`,
        level: "Info",
        type: "user_registered",
        metadata: { userId: newUser.id.toString() },
    });
    await (0, activity_service_1.logActivity)({ userId: newUser.id, name: newUser.fullName, role: role }, "USER_CREATED", { userId: newUser.id, name: newUser.fullName, role: role }, `${fullName} logged in successfully`);
    return newUser;
};
exports.registerUserService = registerUserService;
const loginUserService = async (data) => {
    const { email, password } = data;
    if (!email || !password) {
        const err = new Error(`email and password required`);
        err.statusCode = 404;
        throw err;
    }
    const user = await user_model_1.default.findOne({ email: email })
        .populate("roles")
        .select("+password")
        .exec();
    if (!user) {
        const err = new Error(`email '${email}' not found.`);
        err.statusCode = 404;
        throw err;
    }
    const isMatch = await bcrypt_1.default.compare(password, user.password);
    if (!isMatch) {
        const err = new Error(`password not match.`);
        err.statusCode = 404;
        throw err;
    }
    if (user.status !== "Active") {
        const err = new Error("Your account is not active. Please contact the administrator.");
        err.statusCode = 403;
        throw err;
    }
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false }); // Skip validation to avoid hashing password again
    const userResponse = {
        id: user._id,
        email: user.email,
        username: user.username,
        roles: user.roles,
        fullName: user.fullName,
        status: user.status,
        lastLogin: user.lastLogin,
    };
    if (user.passwordResetRequired) {
        const tempToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.SECRET_KEY, {
            expiresIn: "30m",
        });
        return {
            passwordChangeRequired: true,
            message: "Login successful, but you must change your password.",
            token: tempToken,
            user: userResponse,
        };
    }
    const payload = {
        id: user._id,
        email: user.email,
        username: user.username,
    };
    const token = jsonwebtoken_1.default.sign(payload, process.env.SECRET_KEY, {
        expiresIn: "10d",
    });
    const roleNames = user.roles.map((role) => role.roleName).join(", ");
    await (0, activity_service_1.logActivity)({ userId: user.id, name: user.fullName, role: roleNames }, "LOGIN", { userId: user.id, name: user.fullName, role: roleNames }, `${user.fullName} logged in successfully`);
    return {
        passwordChangeRequired: false,
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
exports.loginUserService = loginUserService;
const forgotPasswordService = async (email) => {
    console.log(email);
    if (!email) {
        const err = new Error("Email is required");
        err.statusCode = 403;
        throw err;
    }
    const oldUser = await user_model_1.default.findOne({ email: email })
        .select("+password")
        .exec();
    if (!oldUser) {
        const err = new Error("Email does not exist");
        err.statusCode = 403;
        throw err;
    }
    const secret = process.env.SECRET_KEY + oldUser.password;
    const payload = {
        id: oldUser._id,
        email: oldUser.email,
        username: oldUser.username,
    };
    const token = jsonwebtoken_1.default.sign(payload, secret, { expiresIn: "1h" });
    let transporter = nodemailer_1.default.createTransport({
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
        <a href="https://lms-backend1-q5ah.onrender.com/api/user/auth/reset-password/${oldUser._id}/${token}" 
           style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #007BFF; text-decoration: none; border-radius: 5px;">
           Reset Password
        </a>
        <p style="margin-top: 20px;">If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
        <p><a href="https://lms-backend1-q5ah.onrender.com/api/user/auth/reset-password/${oldUser._id}/${token}">https://lms-backend1-q5ah.onrender.com/api/admin/auth/reset-password/${oldUser._id}/${token}</a></p>
        <p style="color: #888;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;">
        <p style="font-size: 12px; color: #888;">Sincerely,<br>The [Your Company/App Name] Team</p>
      </div>
    `,
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
    }
    catch (error) {
        console.error("Error sending email:", error);
        const err = new Error("Failed to send password reset email");
        err.statusCode = 500;
        throw err;
    }
    const link = `https://lms-backend1-q5ah.onrender.com/api/user/auth/reset-password/${oldUser._id}/${token}`;
    return link;
};
exports.forgotPasswordService = forgotPasswordService;
const verifyResetPasswordService = async (data) => {
    const { id, token } = data;
    const oldUser = await user_model_1.default.findOne({ _id: id }).select("+password").exec();
    if (!oldUser) {
        const err = new Error("User does not exists");
        err.statusCode = 403;
        throw err;
    }
    const secret = process.env.SECRET_KEY + oldUser.password;
    try {
        const verify = jsonwebtoken_1.default.verify(token, secret);
        if (typeof verify === "object" && "email" in verify) {
            console.log("email:", verify.email);
        }
        else {
            throw new Error("Invalid token payload or missing email.");
        }
        return verify;
    }
    catch (error) {
        return "not verified";
    }
};
exports.verifyResetPasswordService = verifyResetPasswordService;
const resetPasswordService = async (data) => {
    const { id, token, newPassword, confirmPassword } = data;
    try {
        const oldUser = await user_model_1.default.findOne({ _id: id })
            .select("+password")
            .populate("roles")
            .exec();
        if (!oldUser) {
            const err = new Error("User does not exists");
            err.statusCode = 403;
            throw err;
        }
        const secret = process.env.SECRET_KEY + oldUser.password;
        const verify = jsonwebtoken_1.default.verify(token, secret);
        const salt = await bcrypt_1.default.genSalt(10);
        const encryptedPassword = await bcrypt_1.default.hash(newPassword, salt);
        await user_model_1.default.updateOne({
            _id: id,
        }, {
            $set: { password: encryptedPassword },
        }).populate("roles");
        const roleNames = oldUser.roles
            .map((role) => role.roleName)
            .join(", ");
        await (0, activity_service_1.logActivity)({ userId: oldUser.id, name: oldUser.fullName, role: roleNames }, "PASSWORD_RESET", { userId: oldUser.id, name: oldUser.fullName, role: roleNames }, `Password for ${oldUser.fullName} has been reset sucessfully`);
        return verify;
    }
    catch (error) { }
};
exports.resetPasswordService = resetPasswordService;
const dashboardSummaryService = async (userId) => {
    const user = await user_model_1.default.findById(userId).select("fullName roles");
    const issuedItems = await issuedItem_model_1.default.find({
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
    const currentIssuedItems = enhancedIssuedItems.filter((item) => !item.isOverdue);
    // Get queued items with position and estimated wait
    const userQueues = await queue_model_1.default.find({
        "queueMembers.userId": userId,
        "queueMembers.status": "waiting",
    })
        .populate({
        path: "itemId",
        select: "title authorOrCreator mediaUrl categoryId",
    })
        .lean();
    const enhancedQueuedItems = userQueues.map((queue) => {
        const userMember = queue.queueMembers.find((member) => member.userId.toString() === userId);
        if (!userMember) {
            console.log("no userMember found");
            return;
        }
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
    const newArrivals = await item_model_1.default.find({ status: "Available" })
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
exports.dashboardSummaryService = dashboardSummaryService;
const getIssueddItemsSerive = async (userId) => {
    const isExistingUser = await user_model_1.default.findById(userId);
    if (!isExistingUser) {
        const err = new Error("No user found");
        err.statusCode = 404;
        throw err;
    }
    const issuedItems = await issuedItem_model_1.default.find({ userId })
        .populate({ path: "userId", select: "fullName email" })
        .populate({ path: "itemId", select: "title description" });
    return issuedItems || [];
};
exports.getIssueddItemsSerive = getIssueddItemsSerive;
const getCategoriesService = async () => {
    const categories = await category_model_1.default.find({})
        .populate("parentCategoryId", "name")
        .select("name description parentCategoryId defaultReturnPeriod createdAt updatedAt")
        .lean();
    if (!categories || categories.length === 0) {
        const err = new Error("No categories found");
        err.statusCode = 404;
        throw err;
    }
    const categoriesWithType = categories.map((category) => ({
        ...category,
        categoryType: category.parentCategoryId ? "subcategory" : "parent",
        parentCategoryName: category.parentCategoryId
            ? category.parentCategoryId.name
            : null,
    }));
    return categoriesWithType;
};
exports.getCategoriesService = getCategoriesService;
const getCategoryItemsService = async (categoryId) => {
    const isCategoryExits = await category_model_1.default.findById(categoryId);
    if (!isCategoryExits) {
        const err = new Error("No categories found");
        err.statusCode = 404;
        throw err;
    }
    const items = await item_model_1.default.find({ categoryId: categoryId })
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
        const err = new Error("No items found for this category");
        err.statusCode = 404;
        throw err;
    }
    return items;
};
exports.getCategoryItemsService = getCategoryItemsService;
const getItemService = async (itemId) => {
    const items = await item_model_1.default.findById(itemId)
        .populate("categoryId", "name description")
        .populate("subcategoryId", "name description");
    if (!items) {
        const err = new Error("No items found for this category");
        err.statusCode = 404;
        throw err;
    }
    return items;
};
exports.getItemService = getItemService;
const getRequestedItemsSerice = async (userId) => {
    const isExistingUser = await user_model_1.default.findById(userId);
    if (!isExistingUser) {
        const err = new Error("No user found");
        err.statusCode = 404;
        throw err;
    }
    const requestedItems = await itemRequest_model_1.default.find({ userId: userId })
        .populate("userId", "fullName email")
        .populate("categoryId", "name description")
        .populate("subcategoryId", "name description");
    return requestedItems || [];
};
exports.getRequestedItemsSerice = getRequestedItemsSerice;
const requestItemService = async (userId, validatedData) => {
    const { title, authorOrCreator, itemType, reasonForRequest } = validatedData;
    const user = await user_model_1.default.findById(userId).populate("roles");
    if (!user) {
        const err = new Error("User not found.");
        err.statusCode = 404;
        throw err;
    }
    const existingRequest = await itemRequest_model_1.default.findOne({
        userId,
        title: title,
        status: "Pending",
    });
    if (existingRequest) {
        const err = new Error("You have already requested this item and it's still pending");
        err.statusCode = 400;
        throw err;
    }
    const newRequest = new itemRequest_model_1.default({
        userId,
        title: title,
        authorOrCreator: authorOrCreator,
        itemType: itemType,
        reasonForRequest: reasonForRequest,
        status: "Pending",
    });
    await newRequest.save();
    const roleNames = user.roles.map((role) => role.roleName).join(", ");
    await (0, activity_service_1.logActivity)({ userId: user.id, name: user.fullName, role: roleNames }, "ITEM_REQUESTED", { userId: user.id, name: user.fullName, role: roleNames }, `Password for ${user.fullName} has been reset sucessfully`);
    return newRequest;
};
exports.requestItemService = requestItemService;
const getQueuedItemsService = async (userId) => {
    const user = await user_model_1.default.findById(userId).populate("roles");
    if (!user) {
        const err = new Error("No user found");
        err.statusCode = 404;
        throw err;
    }
    const queueItems = await queue_model_1.default.find({ "queueMembers.userId": userId })
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
exports.getQueuedItemsService = getQueuedItemsService;
const getQueueItemByIdService = async (queueId) => {
    try {
        const queueItem = await queue_model_1.default.findById(queueId)
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
    }
    catch (error) {
        throw error;
    }
};
exports.getQueueItemByIdService = getQueueItemByIdService;
const withdrawFromQueueService = async (queueId, userId) => {
    try {
        const queue = await queue_model_1.default.findById(queueId);
        if (!queue) {
            throw new Error("Queue item not found");
        }
        const memberIndex = queue.queueMembers.findIndex((member) => member.userId.toString() === userId);
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
    }
    catch (error) {
        throw error;
    }
};
exports.withdrawFromQueueService = withdrawFromQueueService;
const extendIssuedItemService = async (itemId, userId) => {
    const issuedItem = await issuedItem_model_1.default.findOne({
        itemId,
        userId,
        status: "Issued",
    });
    const user = await user_model_1.default.findById(userId).populate("roles");
    if (!user) {
        const err = new Error("User not found.");
        err.statusCode = 404;
        throw err;
    }
    if (!issuedItem) {
        const err = new Error("No active issued item found for this user");
        err.statusCode = 404;
        throw err;
    }
    const settings = await setting_model_1.default.findOne();
    if (!settings || !settings.borrowingLimits) {
        const err = new Error("System borrowing limits not configured");
        err.statusCode = 500;
        throw err;
    }
    const { maxPeriodExtensions, extensionPeriodDays } = settings.borrowingLimits;
    if (issuedItem.extensionCount >= maxPeriodExtensions) {
        const err = new Error("Maximum extension limit reached");
        err.statusCode = 400;
        throw err;
    }
    const newDueDate = new Date(issuedItem.dueDate);
    newDueDate.setDate(newDueDate.getDate() + extensionPeriodDays);
    issuedItem.dueDate = newDueDate;
    issuedItem.extensionCount += 1;
    await issuedItem.save();
    const roleNames = user.roles.map((role) => role.roleName).join(", ");
    await (0, activity_service_1.logActivity)({ userId: user.id, name: user.fullName, role: roleNames }, "EXTEND_PERIOD", { userId: user.id, name: user.fullName, role: roleNames }, `${user.fullName} requested for extend period for the item ${itemId}`);
    return issuedItem;
};
exports.extendIssuedItemService = extendIssuedItemService;
const returnItemRequestService = async (itemId, userId, status) => {
    const issuedItem = await issuedItem_model_1.default.findOne({
        itemId,
        userId: userId,
        status: "Issued",
    });
    if (!issuedItem) {
        const err = new Error("No active issued item found for this user");
        err.statusCode = 404;
        throw err;
    }
    const user = await user_model_1.default.findById(userId).populate("roles");
    if (!user) {
        const err = new Error("User not found.");
        err.statusCode = 404;
        throw err;
    }
    const setting = await setting_model_1.default.findOne({});
    if (!setting) {
        const err = new Error("System settings not configured");
        err.statusCode = 500;
        throw err;
    }
    const { overdueFineRatePerDay, lostItemBaseFine, damagedItemBaseFine, fineGracePeriodDays, } = setting.fineRates;
    const now = new Date();
    let fineAmount = 0;
    let fineReason = null;
    if (status === "Returned") {
        if (issuedItem.dueDate && now > issuedItem.dueDate) {
            const diffDays = Math.ceil((now.getTime() - issuedItem.dueDate.getTime()) / (1000 * 60 * 60 * 24));
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
    const inventoryItem = await item_model_1.default.findById(issuedItem.itemId);
    if (!inventoryItem) {
        const err = new Error("Inventory item not found");
        err.statusCode = 404;
        throw err;
    }
    if (status === "Returned") {
        inventoryItem.availableCopies += 1;
        inventoryItem.status = "Available";
    }
    else if (status === "Damaged") {
        inventoryItem.status = "Damaged";
    }
    else if (status === "Lost") {
        inventoryItem.status = "Lost";
    }
    await inventoryItem.save();
    let fineRecord = null;
    if (fineAmount > 0 && fineReason) {
        fineRecord = await fine_model_1.default.create({
            userId: issuedItem.userId,
            itemId: issuedItem.itemId,
            reason: fineReason,
            amountIncurred: fineAmount,
            amountPaid: 0,
            outstandingAmount: fineAmount,
            status: "Outstanding",
            dateIncurred: now,
        });
        issuedItem.fineId = fineRecord._id;
        await issuedItem.save();
    }
    const roleNames = user.roles.map((role) => role.roleName).join(", ");
    await (0, activity_service_1.logActivity)({ userId: user.id, name: user.fullName, role: roleNames }, "ITEM_RETURN_REQUEST", { userId: user.id, name: user.fullName, role: roleNames }, `${user.fullName} requested for item return for the item ${itemId}`);
    return {
        issuedItem,
        fine: fineRecord,
    };
};
exports.returnItemRequestService = returnItemRequestService;
const requestNewItemService = async (userId, validatedData) => {
    const { name, description, category, subCategory, reason, quantity } = validatedData;
    const user = await user_model_1.default.findById(userId).populate("roles");
    if (!user) {
        const err = new Error("User not found.");
        err.statusCode = 404;
        throw err;
    }
    const newItemRequest = new requestedItem_model_1.default({
        userId: new mongoose_1.Types.ObjectId(userId),
        name,
        description,
        category,
        subCategory,
        reason,
        quantity,
    });
    await newItemRequest.save();
    const roleNames = user.roles.map((role) => role.roleName).join(", ");
    await (0, activity_service_1.logActivity)({ userId: user.id, name: user.fullName, role: roleNames }, "REQUEST_NEW_ITEM", { userId: user.id, name: user.fullName, role: roleNames }, `${user.fullName} requested a new item: ${name} (Qty: ${quantity})`);
    return newItemRequest;
};
exports.requestNewItemService = requestNewItemService;
const getNewRequestedItemService = async (userId) => {
    const items = await requestedItem_model_1.default.find({ userId: userId }).populate("userId", "fullName email username");
    return items || [];
};
exports.getNewRequestedItemService = getNewRequestedItemService;
const getNewSpecificRequestedItemService = async (itemId) => {
    const request = await requestedItem_model_1.default.findById(itemId).populate("userId", "fullName email username");
    return request || "";
};
exports.getNewSpecificRequestedItemService = getNewSpecificRequestedItemService;
const deleteRequestedItemService = async (itemId, userId) => {
    try {
        const requestedItem = await requestedItem_model_1.default.findById(itemId);
        if (!requestedItem) {
            throw new Error("Requested item not found");
        }
        if (requestedItem.userId.toString() !== userId) {
            throw new Error("Not authorized to delete this requested item");
        }
        if (requestedItem.status !== "pending") {
            throw new Error("Only pending requests can be deleted");
        }
        await requestedItem_model_1.default.findByIdAndDelete(itemId);
        return { message: "Requested item deleted successfully" };
    }
    catch (error) {
        throw error;
    }
};
exports.deleteRequestedItemService = deleteRequestedItemService;
const getNewArrivalsService = async () => {
    const newArrivals = await item_model_1.default.find({ status: "Available" })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
        .exec();
    return newArrivals || [];
};
exports.getNewArrivalsService = getNewArrivalsService;
const getHistoryService = async (userId) => {
    const issuedItems = await issuedItem_model_1.default.find({ userId })
        .populate("itemId", "title authorOrCreator type")
        .populate("fineId", "reason amountIncurred outstandingAmount status")
        .sort({ createdAt: -1 })
        .lean();
    const currentlyBorrowed = issuedItems.filter((i) => i.status === "Issued");
    const returnedItems = issuedItems.filter((i) => i.status === "Returned");
    const fines = await fine_model_1.default.find({ userId }).sort({ createdAt: -1 }).lean();
    return {
        recentlyBorrowed: currentlyBorrowed.map((i) => ({
            id: i._id,
            title: i.itemId?.title,
            author: i.itemId?.authorOrCreator,
            issueDate: i.issuedDate,
            dueDate: i.dueDate,
            status: i.status,
            fine: i.fineId || null,
        })),
        returnedItems: returnedItems.map((i) => ({
            id: i._id,
            title: i.itemId?.title,
            author: i.itemId?.authorOrCreator,
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
exports.getHistoryService = getHistoryService;
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
const checkUserEligibility = async (userId) => {
    // Check if user has any overdue items
    const overdueItems = await issuedItem_model_1.default.find({
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
    const currentIssuedItems = await issuedItem_model_1.default.countDocuments({
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
const calculateDueDate = (defaultReturnPeriod) => {
    const defaultPeriod = defaultReturnPeriod || 14;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + defaultPeriod);
    return dueDate;
};
const issueItemImmediately = async (userId, itemId, session) => {
    const item = await item_model_1.default.findById(itemId).session(session);
    if (!item)
        throw new Error("Item not found");
    const user = await user_model_1.default.findById(userId).populate("roles");
    if (!user) {
        const err = new Error("User not found.");
        err.statusCode = 404;
        throw err;
    }
    const dueDate = calculateDueDate(item.defaultReturnPeriod);
    const issuedItem = new issuedItem_model_1.default({
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
    const roleNames = user.roles.map((role) => role.roleName).join(", ");
    await (0, activity_service_1.logActivity)({ userId: user.id, name: user.fullName, role: roleNames }, "ITEM_ISSUED", { userId: user.id, name: user.fullName, role: roleNames }, `${user.fullName} has issued an item ${issuedItem.itemId}`);
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
const addUserToQueue = async (userId, itemId, session) => {
    // Find or create queue for the item
    let queue = await queue_model_1.default.findOne({ itemId }).session(session);
    if (!queue) {
        queue = new queue_model_1.default({
            itemId,
            queueMembers: [],
            isProcessing: false,
        });
    }
    const user = await user_model_1.default.findById(userId).populate("roles");
    if (!user) {
        const err = new Error("User not found.");
        err.statusCode = 404;
        throw err;
    }
    // Check if user is already in queue
    const existingMember = queue.queueMembers.find((member) => member.userId.toString() === userId);
    if (existingMember) {
        const err = new Error("You are already in the queue for this item");
        err.statusCode = 400;
        throw err;
    }
    // Add user to queue
    const position = queue.queueMembers.length + 1;
    queue.queueMembers.push({
        userId: new mongoose_1.default.Types.ObjectId(userId),
        position,
        dateJoined: new Date(),
        status: "waiting",
    });
    await queue.save({ session });
    // Send queue position notification
    await sendQueuePositionNotification(userId, itemId, position);
    await session.commitTransaction();
    session.endSession();
    const roleNames = user.roles.map((role) => role.roleName).join(", ");
    await (0, activity_service_1.logActivity)({ userId: user.id, name: user.fullName, role: roleNames }, "USER_ADDED_TO_QUEUE", { userId: user.id, name: user.fullName, role: roleNames }, `${user.fullName} has been added to queue for an item ${itemId}`);
    return {
        message: `Item is currently unavailable. You have been added to the queue at position ${position}.`,
        queuePosition: position,
        type: "queued",
    };
};
const sendIssueNotification = async (userId, itemTitle, dueDate, type) => {
    try {
        const user = await user_model_1.default.findById(userId).populate("roles");
        if (!user)
            return;
        const message = type === "immediate"
            ? `Your item "${itemTitle}" has been issued successfully. Due date: ${dueDate.toDateString()}.`
            : `The item "${itemTitle}" you requested is now available! Please confirm within 24 hours.`;
        if (user.notificationPreference?.email) {
            await (0, emailService_1.sendEmail)(user.email, "Item Issued", message);
        }
        if (user.notificationPreference?.whatsApp && user.phoneNumber) {
            await (0, whatsapp_1.sendWhatsAppMessage)(user.phoneNumber, message);
        }
        const roleNames = user.roles.map((role) => role.roleName).join(", ");
        await (0, activity_service_1.logActivity)({ userId: user.id, name: user.fullName, role: roleNames }, "NOTIFICATION", { userId: user.id, name: user.fullName, role: roleNames }, `Item Issued notification is send to the ${user.fullName}`);
    }
    catch (error) {
        console.error("Error sending issue notification:", error);
    }
};
const sendQueuePositionNotification = async (userId, itemId, position) => {
    try {
        const user = await user_model_1.default.findById(userId).populate("roles");
        if (!user) {
            const err = new Error("User not found.");
            err.statusCode = 404;
            throw err;
        }
        const item = await item_model_1.default.findById(itemId);
        if (!user || !item)
            return;
        const message = `You have been added to the queue for "${item.title}". Your position: ${position}. You will be notified when the item becomes available.`;
        if (user.notificationPreference?.email) {
            await (0, emailService_1.sendEmail)(user.email, "Added to Queue", message);
        }
        if (user.notificationPreference?.whatsApp && user.phoneNumber) {
            await (0, whatsapp_1.sendWhatsAppMessage)(user.phoneNumber, message);
        }
        const roleNames = user.roles.map((role) => role.roleName).join(", ");
        await (0, activity_service_1.logActivity)({ userId: user.id, name: user.fullName, role: roleNames }, "NOTIFICATION", { userId: user.id, name: user.fullName, role: roleNames }, `Queue notification is send to the ${user.fullName}`);
    }
    catch (error) {
        console.error("Error sending queue notification:", error);
    }
};
const createIssueRequestService = async (userId, itemId) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const item = await item_model_1.default.findById(itemId).session(session);
        if (!item) {
            const err = new Error("Item not found");
            err.statusCode = 404;
            throw err;
        }
        const eligibility = await checkUserEligibility(new mongoose_1.default.Types.ObjectId(userId));
        if (!eligibility.eligible) {
            const err = new Error(eligibility.reason);
            err.statusCode = 400;
            throw err;
        }
        if (item.availableCopies > 0 && item.status === "Available") {
            return await issueItemImmediately(userId, itemId, session);
        }
        else {
            return await addUserToQueue(userId, itemId, session);
        }
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};
exports.createIssueRequestService = createIssueRequestService;
const getMyIssueRequestsService = async (userId) => {
    const requests = await itemRequest_model_2.default.find({ userId })
        .populate("itemId", "title authorOrCreator categoryId availableCopies")
        .sort({ requestedAt: -1 });
    return requests;
};
exports.getMyIssueRequestsService = getMyIssueRequestsService;
const getAllFinesService = async (userId) => {
    const fines = await fine_model_1.default.find({ userId }).sort({ createdAt: -1 }).lean();
    return {
        fines: fines.map((f) => ({
            id: f._id,
            reason: f.reason,
            amount: f.amountIncurred,
            outstanding: f.outstandingAmount,
            status: f.status,
            dateIncurred: f.dateIncurred,
        })) || [],
    };
};
exports.getAllFinesService = getAllFinesService;
const getProfileDetailsService = async (userId) => {
    const user = await user_model_1.default.findById(userId)
        .select("-passwordResetToken -passwordResetExpires -__v")
        .populate("roles", "roleName description")
        .lean();
    if (!user) {
        const err = new Error("User not found");
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
exports.getProfileDetailsService = getProfileDetailsService;
const updateProfileService = async (userId, profileData) => {
    const allowedUpdates = [
        "fullName",
        "phoneNumber",
        "dateOfBirth",
        "address",
        "username",
    ];
    const updates = {};
    for (const key of allowedUpdates) {
        if (profileData[key] !== undefined) {
            updates[key] = profileData[key];
        }
    }
    const user = await user_model_1.default.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true }).populate("roles");
    if (!user) {
        const err = new Error("User not found");
        err.statusCode = 404;
        throw err;
    }
    const roleNames = user.roles.map((role) => role.roleName).join(", ");
    await (0, activity_service_1.logActivity)({ userId: user.id, name: user.fullName, role: roleNames }, "USER_UPDATED", { userId: user.id, name: user.fullName, role: roleNames }, `Profile updated for the user ${user.fullName}`);
    return user;
};
exports.updateProfileService = updateProfileService;
const updateNotificationPreferenceService = async (userId, preferences) => {
    const user = await user_model_1.default.findByIdAndUpdate(userId, { $set: { notificationPreference: preferences } }, { new: true, runValidators: true }).populate("roles");
    if (!user) {
        const err = new Error("User not found");
        err.statusCode = 404;
        throw err;
    }
    const roleNames = user.roles.map((role) => role.roleName).join(", ");
    await (0, activity_service_1.logActivity)({ userId: user.id, name: user.fullName, role: roleNames }, "USER_UPDATED", { userId: user.id, name: user.fullName, role: roleNames }, `Notification settings updated for the user ${user.fullName}`);
    return user;
};
exports.updateNotificationPreferenceService = updateNotificationPreferenceService;
const updatePasswordService = async (userId, currentPassword, newPassword) => {
    const user = await user_model_1.default.findById(userId)
        .select("+password")
        .populate("roles");
    if (!user) {
        const err = new Error("User not found");
        err.statusCode = 404;
        throw err;
    }
    const isMatch = await bcrypt_1.default.compare(currentPassword, user.password);
    if (!isMatch) {
        const err = new Error("Current password is incorrect");
        err.statusCode = 401;
        throw err;
    }
    user.password = newPassword;
    user.passwordResetRequired = false;
    await user.save();
    const roleNames = user.roles.map((role) => role.roleName).join(", ");
    await (0, activity_service_1.logActivity)({ userId: user.id, name: user.fullName, role: roleNames }, "PASSWORD_CHANGED", { userId: user.id, name: user.fullName, role: roleNames }, `Password changed for the user ${user.fullName}`);
    return true;
};
exports.updatePasswordService = updatePasswordService;
const expressDonationInterestService = async (userId, data) => {
    const { itemType, title, description, photos, duration = 0, preferredContactMethod = "whatsApp", } = data;
    console.log("ItemType" + itemType);
    const user = await user_model_1.default.findById(userId).populate("roles");
    if (!user) {
        const err = new Error("User not found.");
        err.statusCode = 404;
        throw err;
    }
    if (!title.trim()) {
        const err = new Error("Title is required");
        err.statusCode = 400;
        throw err;
    }
    if (!itemType) {
        const err = new Error("Item type/category is required");
        err.statusCode = 400;
        throw err;
    }
    if (duration < 0) {
        const err = new Error("Duration cannot be negative");
        err.statusCode = 400;
        throw err;
    }
    let category;
    if (mongoose_1.Types.ObjectId.isValid(itemType)) {
        category = await category_model_1.default.findById(itemType);
    }
    else {
        category = await category_model_1.default.findOne({
            $or: [{ name: itemType }, { categoryName: itemType }],
        });
    }
    if (!category) {
        const err = new Error("Invalid category/item type");
        err.statusCode = 400;
        throw err;
    }
    const donationType = duration === 0 ? "giveaway" : "duration";
    const donation = new donation_model_1.default({
        userId: new mongoose_1.Types.ObjectId(userId),
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
    const roles = await role_model_1.default.find({ roleName: { $in: roleNames } });
    const roleIds = roles.map((role) => role._id);
    const adminUsers = await user_model_1.default.find({
        roles: { $in: roleIds },
    });
    const adminNotificationPromises = adminUsers.map((admin) => notificationService_1.NotificationService.createNotification({
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
    }));
    const userNotificationPromise = notificationService_1.NotificationService.createNotification({
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
    const roleName = user.roles.map((role) => role.roleName).join(", ");
    await (0, activity_service_1.logActivity)({ userId: user.id, name: user.fullName, role: roleName }, "ITEM_DONATION", { userId: user.id, name: user.fullName, role: roleName }, `${user.fullName} has request for the new item ${title}`);
    return donation;
};
exports.expressDonationInterestService = expressDonationInterestService;
const getMyDonationsService = async (userId) => {
    try {
        const donations = await donation_model_1.default.find({ userId })
            .populate("userId", "fullName email username")
            .sort({ createdAt: -1 })
            .exec();
        return {
            success: true,
            data: donations,
            count: donations.length,
        };
    }
    catch (error) {
        console.error("Error in getMyDonationsService:", error);
        throw {
            success: false,
            statusCode: 500,
            message: "Failed to fetch donations",
            error: error.message,
        };
    }
};
exports.getMyDonationsService = getMyDonationsService;
const withdrawDonationService = async (donationId, userId) => {
    try {
        const donation = await donation_model_1.default.findById(donationId);
        if (!donation) {
            return { success: false, message: "Donation not found" };
        }
        if (donation.userId.toString() !== userId) {
            return { success: false, message: "You can only withdraw your own donation requests" };
        }
        if (donation.status !== "Pending") {
            return {
                success: false,
                message: `Cannot withdraw donation with status: ${donation.status}. Only pending donations can be withdrawn.`
            };
        }
        const withdrawnDonation = await donation_model_1.default.findByIdAndDelete(donationId);
        return {
            success: true,
            message: "Donation request withdrawn successfully",
            withdrawnDonation
        };
    }
    catch (error) {
        console.error("Error withdrawing donation:", error);
        return { success: false, message: "Internal server error" };
    }
};
exports.withdrawDonationService = withdrawDonationService;
const getUserNotificationService = async (userId) => {
    const notifications = await notofication_modal_1.default.find({ recipientId: userId }).sort({
        createdAt: -1,
    });
    return notifications || [];
};
exports.getUserNotificationService = getUserNotificationService;
const markAsReadService = async (userId, notificationId, markAll) => {
    if (markAll) {
        await notofication_modal_1.default.updateMany({ recipientId: userId, read: false }, { $set: { read: true } });
        return "All notifications marked as read";
    }
    if (notificationId) {
        await notofication_modal_1.default.findByIdAndUpdate(notificationId, { read: true });
        return "Notification marked as read";
    }
};
exports.markAsReadService = markAsReadService;
const deleteNotificationService = async (userId, notificationId, deleteAll) => {
    if (deleteAll) {
        await notofication_modal_1.default.deleteMany({ recipientId: userId });
        return "All notifications deleted";
    }
    if (notificationId) {
        await notofication_modal_1.default.findByIdAndDelete(notificationId);
        return "Notification deleted";
    }
};
exports.deleteNotificationService = deleteNotificationService;
