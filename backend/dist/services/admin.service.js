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
exports.addTemplateService = exports.getNotificationTemplatesService = exports.updateSystemRestrictionsService = exports.deleteRequestedItemService = exports.rejectRequestedItemService = exports.approveRequestedItemService = exports.getAllRequestedItemsService = exports.returnItemService = exports.extendPeriodService = exports.getSystemRestrictionsService = exports.exportIssuedItemsReport = exports.exportQueueAnalytics = exports.getQueueAnalytics = exports.getIssuedReportService = exports.getFinesReportService = exports.getInventoryReportService = exports.generateIssuedItemsReportPDF = exports.generateFinesReportPDF = exports.generateInventoryReportPDF = exports.waiveFineService = exports.recordPaymentService = exports.deleteFineService = exports.updateFineService = exports.createFineService = exports.fetchUserFinesService = exports.getAllFinesService = exports.getCategoryByIdService = exports.deleteCategoryService = exports.updateCategoryService = exports.createCategoryService = exports.getCategoriesService = exports.deleteItemService = exports.updateItemService = exports.fetchSpecificItemServive = exports.createInventoryItemsService = exports.fetchInventoryItemsService = exports.deleteRoleService = exports.updateRoleService = exports.createRoleService = exports.fetchRolesService = exports.deleteUserService = exports.forcePasswordResetService = exports.getUserDetailsService = exports.getAllUsersService = exports.getDashboardSummaryService = exports.updateUserStatusService = exports.resetPasswordService = exports.verifyResetPasswordService = exports.forgotPasswordService = exports.loginService = void 0;
exports.exportAllUsersReport = exports.getAllUsersReport = exports.exportDefaulterReport = exports.sendReminderService = exports.getDefaulterReport = exports.fetchAllPermissionsService = exports.removeUserFromQueueService = exports.issueItemFromQueueService = exports.viewQueueService = exports.checkExpiredNotifications = exports.handleUserResponse = exports.processItemReturn = exports.updateDonationStatusService = exports.getAllDonationService = exports.generateBarcodePDF = exports.generateBarcodeString = exports.updateAdminPasswordServive = exports.resetPasswordAdminService = exports.getAdminProfileService = exports.updateNotificationTemplateService = exports.updateTemplateService = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv/config");
const fine_model_1 = __importDefault(require("../models/fine.model"));
const mongoose_1 = __importStar(require("mongoose"));
const item_model_1 = __importDefault(require("../models/item.model"));
const issuedItem_model_1 = __importDefault(require("../models/issuedItem.model"));
const category_model_1 = __importDefault(require("../models/category.model"));
const activity_model_1 = __importDefault(require("../models/activity.model"));
const role_model_1 = __importDefault(require("../models/role.model"));
const permission_model_1 = require("../models/permission.model");
const pdfkit_1 = __importDefault(require("pdfkit"));
const setting_model_1 = __importDefault(require("../models/setting.model"));
const uuid_1 = require("uuid");
const bwip_js_1 = __importDefault(require("bwip-js"));
const donation_model_1 = __importDefault(require("../models/donation.model"));
const queue_model_1 = __importDefault(require("../models/queue.model"));
const issuedItem_model_2 = __importDefault(require("../models/issuedItem.model"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const whatsapp_1 = require("../config/whatsapp");
const emailService_1 = require("../config/emailService");
const getNotificationTemplate_1 = require("../utility/getNotificationTemplate");
const requestedItem_model_1 = __importDefault(require("../models/requestedItem.model"));
const notificationService_1 = require("../utility/notificationService");
const loginService = async (data) => {
    const { email, password, rememberMe } = data;
    if (!email || !password) {
        const err = new Error("Email and Password required");
        throw err;
    }
    const user = await user_model_1.default.findOne({
        email: email,
    })
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
    const accessTokenPayload = { id: user._id, email: user.email };
    const refreshTokenPayload = { id: user._id };
    const accessToken = jsonwebtoken_1.default.sign(accessTokenPayload, process.env.SECRET_KEY, {
        expiresIn: "1d",
    });
    const refreshToken = jsonwebtoken_1.default.sign(refreshTokenPayload, process.env.SECRET_KEY, {
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
exports.loginService = loginService;
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
        <a href="https://lms-backend1-q5ah.onrender.com/api/admin/auth/reset-password/${oldUser._id}/${token}" 
           style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #007BFF; text-decoration: none; border-radius: 5px;">
           Reset Password
        </a>
        <p style="margin-top: 20px;">If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
        <p><a href="https://lms-backend1-q5ah.onrender.com/api/admin/auth/reset-password/${oldUser._id}/${token}">https://lms-backend1-q5ah.onrender.com/api/admin/auth/reset-password/${oldUser._id}/${token}</a></p>
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
    const link = `https://lms-backend1-q5ah.onrender.com/api/admin/auth/reset-password/${oldUser._id}/${token}`;
    if (oldUser.phoneNumber) {
        const message = `Hi ${oldUser.fullName}, you requested a password reset. Use this link (valid for 1 hour): ${link}`;
        (0, whatsapp_1.sendWhatsAppMessage)(oldUser.phoneNumber, message);
    }
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
        const oldUser = await user_model_1.default.findOne({ _id: id }).select("+password").exec();
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
        });
        return verify;
    }
    catch (error) {
        return "not verified";
    }
};
exports.resetPasswordService = resetPasswordService;
const updateUserStatusService = async (userId, status) => {
    if (status !== "Active" && status != "Inactive") {
        const err = new Error("Invalid status value provided.");
        err.statusCode = 400;
        throw err;
    }
    if (!mongoose_1.Types.ObjectId.isValid(userId)) {
        const err = new Error("Invalid user ID format.");
        err.statusCode = 400;
        throw err;
    }
    const targetUser = await user_model_1.default.findById(userId);
    if (!targetUser) {
        const err = new Error("User not found.");
        err.statusCode = 404;
        throw err;
    }
    if (status === "Inactive") {
        const issuedItems = await issuedItem_model_2.default.findOne({
            userId: targetUser._id,
            status: "Issued",
        });
        if (issuedItems) {
            const err = new Error("User cannot be deactivated: issued items are not yet returned.");
            err.statusCode = 400;
            throw err;
        }
        const unpaidFine = await fine_model_1.default.findOne({
            userId: targetUser._id,
            status: "Outstanding",
        });
        if (unpaidFine) {
            const err = new Error("User cannot be deactivated: outstanding unpaid fines exist.");
            err.statusCode = 400;
            throw err;
        }
    }
    const updatedUser = await user_model_1.default.findOneAndUpdate({
        _id: userId,
    }, {
        $set: { status: status },
    }, { new: true });
    if (!updatedUser) {
        const err = new Error("User not found.");
        err.statusCode = 404;
        throw err;
    }
    let notificationData;
    if (status === "Active") {
        notificationData = {
            recipientId: userId,
            title: "Account Activated",
            message: `Hi ${updatedUser.fullName}, your account has been activated successfully!`,
            level: "Success",
            type: "user_activated",
            metadata: { userId: userId.toString() },
        };
    }
    else if (status === "Inactive") {
        notificationData = {
            recipientId: userId,
            title: "Account Deactivated",
            message: `Hi ${updatedUser.fullName}, your account has been deactivated. Please contact support for more details.`,
            level: "Warning",
            type: "user_deactivated",
            metadata: { userId: userId.toString() },
        };
    }
    const userNotificationPromise = notificationService_1.NotificationService.createNotification(notificationData);
    await userNotificationPromise;
    // notifications
    if (status === "Active") {
        const { subject, body, whatsapp } = await (0, getNotificationTemplate_1.getNotificationTemplate)("userActivated", { user: updatedUser.fullName }, {
            subject: "Account Activated",
            body: `Hi ${updatedUser.fullName}, your account has been activated! You can now log in.`,
            whatsapp: `Hi ${updatedUser.fullName}, your account has been activated!`,
        });
        if (updatedUser.email && updatedUser.notificationPreference?.email) {
            await (0, emailService_1.sendEmail)(updatedUser.email, subject, body);
        }
        if (updatedUser.phoneNumber &&
            updatedUser.notificationPreference?.whatsApp) {
            await (0, whatsapp_1.sendWhatsAppMessage)(updatedUser.phoneNumber, whatsapp);
        }
    }
    return updatedUser;
};
exports.updateUserStatusService = updateUserStatusService;
const getDashboardSummaryService = async () => {
    const [totalItems, activeUsers, overdueItems, categories, recentActivityData, recentOrdersData,] = await Promise.all([
        item_model_1.default.countDocuments(),
        user_model_1.default.countDocuments({ status: "Active" }),
        issuedItem_model_2.default.countDocuments({
            status: "Issued",
            dueDate: { $lt: new Date() },
        }),
        category_model_1.default.countDocuments(),
        activity_model_1.default.find({}).sort({ createdAt: -1 }).limit(10).exec(),
        issuedItem_model_2.default.find({})
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
    const recentOrders = recentOrdersData.map((order) => ({
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
exports.getDashboardSummaryService = getDashboardSummaryService;
const getAllUsersService = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const totalUsers = await user_model_1.default.countDocuments({});
    const users = await user_model_1.default.find({})
        .select("-password")
        .populate("roles", "roleName")
        .populate("permissions", "permissionKey")
        .limit(limit)
        .skip(skip);
    return { users, totalUsers };
};
exports.getAllUsersService = getAllUsersService;
const getUserDetailsService = async (userId) => {
    const user = await user_model_1.default.findOne({ _id: userId });
    return user;
};
exports.getUserDetailsService = getUserDetailsService;
const forcePasswordResetService = async (userId) => {
    const user = await user_model_1.default.findOneAndUpdate({ _id: userId }, { $set: { passwordResetRequired: true } }, { new: true });
    if (!user) {
        const err = new Error("User not found.");
        err.statusCode = 404;
        throw err;
    }
    const userNotificationPromise = notificationService_1.NotificationService.createNotification({
        recipientId: userId,
        title: "Password Reset Required",
        message: `Hi ${user.fullName}, an administrator has requested that you reset your password before your next login.`,
        level: "Info",
        type: "force_password_reset",
        metadata: { userId: userId.toString() },
    });
    const { subject, body } = await (0, getNotificationTemplate_1.getNotificationTemplate)("forcePasswordReset", { user: user.fullName }, {
        subject: "Password Reset Required",
        body: `Hi ${user.fullName},\n\nYour account requires a password reset before your next login. Please visit the login page and use the 'Forgot Password' option to set a new password.\n\nIf you didn’t request this, please contact support immediately.`,
    });
    const emailPromise = user.email && user.notificationPreference?.email
        ? (0, emailService_1.sendEmail)(user.email, subject, body)
        : Promise.resolve();
    await Promise.all([userNotificationPromise, emailPromise]);
    return user;
};
exports.forcePasswordResetService = forcePasswordResetService;
const deleteUserService = async (userId) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        const err = new Error("Invalid user ID format.");
        err.statusCode = 400;
        throw err;
    }
    const user = await user_model_1.default.findById(userId);
    if (!user) {
        const err = new Error("User not found.");
        err.statusCode = 404;
        throw err;
    }
    const issuedItems = await item_model_1.default.findOne({
        userId: userId,
        status: "Issued",
    });
    if (issuedItems) {
        const err = new Error("User cannot be deactivated: issued items are not yet returned.");
        err.statusCode = 400;
        throw err;
    }
    const unpaidFine = await fine_model_1.default.findOne({
        userId: userId,
        status: "Outstanding",
    });
    if (unpaidFine) {
        const err = new Error("User cannot be deactivated: outstanding unpaid fines exist.");
        err.statusCode = 400;
        throw err;
    }
    await user_model_1.default.findByIdAndDelete(userId);
    const { subject, body } = await (0, getNotificationTemplate_1.getNotificationTemplate)("userDeleted", { user: user.fullName }, {
        subject: "Account Deletion Notice",
        body: `Hi ${user.fullName},\n\nYour account has been deleted from our system. If you believe this was a mistake, please contact support immediately.\n\nThank you.`,
    });
    const emailPromise = user.email && user.notificationPreference?.email
        ? (0, emailService_1.sendEmail)(user.email, subject, body)
        : Promise.resolve();
    await emailPromise;
    return { message: "User deleted successfully." };
};
exports.deleteUserService = deleteUserService;
const fetchRolesService = async () => {
    const rolesWithPermissions = await role_model_1.default.aggregate([
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
exports.fetchRolesService = fetchRolesService;
const createRoleService = async ({ roleName, description, permissions, }) => {
    const existingRole = await role_model_1.default.findOne({ roleName });
    if (existingRole) {
        const err = new Error(`Role with name '${roleName}' already exists.`);
        err.statusCode = 409;
        throw err;
    }
    const foundPermissions = await permission_model_1.Permission.find({
        permissionKey: { $in: permissions },
    }).select("_id");
    if (foundPermissions.length !== permissions.length) {
        const err = new Error("One or more permissions not found.");
        err.statusCode = 400;
        throw err;
    }
    const permissionIds = foundPermissions.map((p) => p._id);
    const newRole = new role_model_1.default({
        roleName,
        description,
        permissions: permissionIds,
    });
    await newRole.save();
    return newRole;
};
exports.createRoleService = createRoleService;
const updateRoleService = async ({ roleId, roleName, description, permissions, }) => {
    const updateData = {};
    if (roleName) {
        updateData.roleName = roleName;
    }
    if (description) {
        updateData.description = description;
    }
    if (permissions && permissions.length > 0) {
        const foundPermissions = await permission_model_1.Permission.find({
            permissionKey: { $in: permissions },
        }).select("_id");
        if (foundPermissions.length !== permissions.length) {
            const err = new Error("One or more permissions not found.");
            err.statusCode = 400;
            throw err;
        }
        updateData.permissions = foundPermissions.map((p) => p._id);
    }
    if (Object.keys(updateData).length === 0) {
        const err = new Error("No valid fields provided for update.");
        err.statusCode = 400;
        throw err;
    }
    const updatedRole = await role_model_1.default.findByIdAndUpdate(roleId, updateData, {
        new: true,
        runValidators: true,
    }).populate("permissions", "permissionKey description _id");
    return updatedRole;
};
exports.updateRoleService = updateRoleService;
const deleteRoleService = async (roleId) => {
    const assignedUserCount = await user_model_1.default.countDocuments({ roles: roleId });
    if (assignedUserCount > 0) {
        const err = new Error(`Cannot delete this role. It is currently assigned to ${assignedUserCount} user(s).`);
        err.statusCode = 400;
        throw err;
    }
    const deletedRole = await role_model_1.default.findByIdAndDelete(roleId);
    if (!deletedRole) {
        const err = new Error("Role not found.");
        err.statusCode = 404;
        throw err;
    }
    return {
        message: "Role deleted successfully",
        data: deletedRole,
    };
};
exports.deleteRoleService = deleteRoleService;
const fetchInventoryItemsService = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const totalItems = await item_model_1.default.countDocuments({});
    if (totalItems === 0) {
        return { items: [], totalItems: 0 };
    }
    const items = await item_model_1.default.find()
        .populate("categoryId", "name")
        .populate("subcategoryId", "name")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
    return { items, totalItems };
};
exports.fetchInventoryItemsService = fetchInventoryItemsService;
const createInventoryItemsService = async (data) => {
    if (!data.isbnOrIdentifier && data.categoryId) {
        const category = await category_model_1.default.findById(data.categoryId);
        if (category && category.name.toLowerCase() === "books") {
            const err = new Error("ISBN is required for book items");
            err.statusCode = 400;
            throw err;
        }
        else {
            const timestamp = Date.now().toString();
            const random = Math.random().toString(36).substring(2, 8);
            data.isbnOrIdentifier = `ITEM-${timestamp}-${random}`;
        }
    }
    if (Array.isArray(data.features) && data.features.length === 0) {
        delete data.features;
    }
    const newItem = new item_model_1.default(data);
    try {
        return await newItem.save();
    }
    catch (error) {
        if (error.code === 11000) {
            const err = new Error("Duplicate ISBN/Barcode. Item already exists.");
            err.statusCode = 409;
            throw err;
        }
        throw error;
    }
};
exports.createInventoryItemsService = createInventoryItemsService;
const fetchSpecificItemServive = async (itemId) => {
    const item = await item_model_1.default.findById(itemId)
        .populate("categoryId", "name")
        .populate("subcategoryId", "name")
        .lean();
    if (!item) {
        const err = new Error("No inventory items found");
        err.statusCode = 404;
        throw err;
    }
    // Manually populate the category
    if (item.categoryId) {
        const category = await category_model_1.default.findById(item.categoryId)
            .select("name description")
            .lean();
        if (category) {
            item.category = category;
            // Optionally remove the categoryId if you don't need it
            // delete item.categoryId;
        }
    }
    return item;
};
exports.fetchSpecificItemServive = fetchSpecificItemServive;
const updateItemService = async ({ itemId, validatedData }) => {
    const existingItem = await item_model_1.default.findById(itemId);
    if (!existingItem) {
        const err = new Error("No such item exists");
        err.statusCode = 404;
        throw err;
    }
    const cleanData = Object.fromEntries(Object.entries(validatedData).filter(([_, value]) => value !== undefined && value !== null));
    if (cleanData.price !== undefined && cleanData.price !== null) {
        cleanData.price = new mongoose_1.default.Types.Decimal128(cleanData.price.toString());
    }
    try {
        const updatedData = await item_model_1.default.findByIdAndUpdate(itemId, cleanData, {
            new: true,
            runValidators: true,
        })
            .populate("categoryId", "name")
            .populate("subcategoryId", "name");
        return updatedData;
    }
    catch (error) {
        console.error("Error in updateItemService:", error);
        if (error.name === "CastError") {
            const err = new Error(`Invalid data format: ${error.message}`);
            err.statusCode = 400;
            throw err;
        }
        throw error;
    }
};
exports.updateItemService = updateItemService;
const deleteItemService = async (itemId) => {
    const existingItem = await item_model_1.default.findById(itemId);
    if (!existingItem) {
        const err = new Error("No such item exists");
        throw err;
    }
    if (existingItem.status === "Issued") {
        const err = new Error("Cannot delete item that is currently borrowed/checked out");
        throw err;
    }
    const hasUnpaidFines = await fine_model_1.default.findOne({
        itemId: itemId,
        status: "Outstanding",
    });
    if (hasUnpaidFines) {
        const err = new Error("This item cannot be deleted because there are unpaid fines associated with it.");
        err.statusCode = 400;
        throw err;
    }
    const deletedItem = await item_model_1.default.findByIdAndDelete(itemId);
    if (!deletedItem) {
        const err = new Error("Failed to delete item. Please try again.");
        err.statusCode = 500;
        throw err;
    }
    return deletedItem;
};
exports.deleteItemService = deleteItemService;
const buildCategoryTree = (categories) => {
    const categoryMap = new Map();
    const rootCategories = [];
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
        if (category.parentCategoryId &&
            categoryMap.has(category.parentCategoryId._id?.toString())) {
            const parent = categoryMap.get(category.parentCategoryId._id.toString());
            parent.children.push(node);
        }
        else {
            rootCategories.push(node);
        }
    });
    return rootCategories;
};
const getCategoriesService = async (includeTree = false) => {
    const allCategories = await category_model_1.default.find({})
        .populate("parentCategoryId", "name description")
        .sort({ name: 1 });
    if (includeTree) {
        return buildCategoryTree(allCategories);
    }
    const categoriesWithType = allCategories.map((category) => ({
        ...category.toObject(),
        isParent: !category.parentCategoryId,
        isChild: !!category.parentCategoryId,
    }));
    return categoriesWithType;
};
exports.getCategoriesService = getCategoriesService;
const createCategoryService = async (data) => {
    const { name, description, parentCategoryId, defaultReturnPeriod } = data;
    const existingCategory = await category_model_1.default.findOne({
        name,
        parentCategoryId: parentCategoryId || null,
    });
    if (existingCategory) {
        const err = new Error("Category with this name already exists at this level");
        err.statusCode = 409;
        throw err;
    }
    if (parentCategoryId) {
        const parentCategory = await category_model_1.default.findById(parentCategoryId);
        if (!parentCategory) {
            const err = new Error("Parent category not found");
            err.statusCode = 404;
            throw err;
        }
        // Prevent circular reference (category cannot be its own parent)
        if (parentCategoryId === data._id) {
            const err = new Error("Category cannot be its own parent");
            err.statusCode = 400;
            throw err;
        }
        // Check if parent category has a parent (max 2 levels deep)
        if (parentCategory.parentCategoryId) {
            const err = new Error("Cannot add subcategory to a subcategory. Maximum hierarchy depth is 2 levels.");
            err.statusCode = 400;
            throw err;
        }
    }
    const category = new category_model_1.default({
        name,
        description: description || "",
        parentCategoryId: parentCategoryId || null,
        defaultReturnPeriod: defaultReturnPeriod || 20,
    });
    await category.save();
    const populatedCategory = await category_model_1.default.findById(category._id).populate("parentCategoryId", "name description");
    return populatedCategory;
};
exports.createCategoryService = createCategoryService;
const updateCategoryService = async (categoryId, data) => {
    const { name, description, defaultReturnPeriod } = data;
    const category = await category_model_1.default.findById(categoryId);
    if (!category) {
        const err = new Error("Category not found");
        err.statusCode = 404;
        throw err;
    }
    // Check if name is being changed and if it conflicts with existing category at same level
    if (name && name !== category.name) {
        const existingCategory = await category_model_1.default.findOne({
            name,
            parentCategoryId: category.parentCategoryId,
            _id: { $ne: categoryId }, // Exclude current category
        });
        if (existingCategory) {
            const err = new Error("Category with this name already exists at this level");
            err.statusCode = 409;
            throw err;
        }
    }
    // Update category fields
    if (name)
        category.name = name;
    if (description !== undefined)
        category.description = description;
    if (defaultReturnPeriod !== undefined)
        category.defaultReturnPeriod = defaultReturnPeriod;
    await category.save();
    return await category_model_1.default.findById(categoryId).populate("parentCategoryId", "name description");
};
exports.updateCategoryService = updateCategoryService;
const deleteCategoryService = async (categoryId) => {
    const category = await category_model_1.default.findById(categoryId);
    if (!category) {
        const err = new Error("Category not found");
        err.statusCode = 404;
        throw err;
    }
    // Check if category has children
    const childCategories = await category_model_1.default.find({ parentCategoryId: categoryId });
    if (childCategories.length > 0) {
        const err = new Error("Cannot delete category that has child categories");
        err.statusCode = 400;
        throw err;
    }
    //Check if category has inventory items
    const itemsCount = await item_model_1.default.countDocuments({ categoryId });
    if (itemsCount > 0) {
        const err = new Error("Cannot delete category that has inventory items");
        err.statusCode = 400;
        throw err;
    }
    await category_model_1.default.findByIdAndDelete(categoryId);
    return { message: "Category deleted successfully" };
};
exports.deleteCategoryService = deleteCategoryService;
const getCategoryByIdService = async (categoryId) => {
    const category = await category_model_1.default.findById(categoryId).populate("parentCategoryId", "name description");
    if (!category) {
        const err = new Error("Category not found");
        err.statusCode = 404;
        throw err;
    }
    // Get child categories
    const children = await category_model_1.default.find({ parentCategoryId: categoryId }).sort({
        name: 1,
    });
    return {
        ...category.toObject(),
        children,
    };
};
exports.getCategoryByIdService = getCategoryByIdService;
const getAllFinesService = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const totalItems = await fine_model_1.default.countDocuments({});
    if (totalItems === 0) {
        return { items: [], totalItems: 0 };
    }
    const fines = await fine_model_1.default.find()
        .populate("userId", "username email")
        .populate("itemId", "title")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
    return { fines, totalItems };
};
exports.getAllFinesService = getAllFinesService;
const fetchUserFinesService = async (userId) => {
    const isUserExists = await user_model_1.default.findById(userId);
    if (!isUserExists) {
        const err = new Error("No user found");
        err.statusCode = 404;
        throw err;
    }
    const fines = await fine_model_1.default.find({ userId: userId });
    if (fines.length === 0) {
        const err = new Error("No Fines found");
        err.statusCode = 404;
        throw err;
    }
    return fines;
};
exports.fetchUserFinesService = fetchUserFinesService;
const createFineService = async (data) => {
    const { userId, itemId, reason, amountIncurred, amountPaid = 0, paymentDetails, managedByAdminId, } = data;
    const outstandingAmount = amountIncurred - amountPaid;
    const fine = await fine_model_1.default.create({
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
    try {
        const user = await user_model_1.default.findById(data.userId).lean();
        if (!user) {
            const err = new Error("User not found for fine creation.");
            err.statusCode = 404;
            throw err;
        }
        const fineStatusMsg = outstandingAmount > 0
            ? `A fine of ₹${amountIncurred} for "${reason}" has been issued. Outstanding amount: ₹${outstandingAmount}.`
            : `A fine of ₹${amountIncurred} for "${reason}" has been fully paid.`;
        const emailSubject = "New Fine Added to Your Account";
        const emailBody = `
        Hi ${user.fullName},
        
        ${fineStatusMsg}
        
        Please log in to your account for more details.
        
        Regards,
        Library Management Team
      `;
        const userNotificationPromise = notificationService_1.NotificationService.createNotification({
            recipientId: userId,
            title: "New Fine Issued",
            message: fineStatusMsg,
            level: outstandingAmount > 0 ? "Warning" : "Info",
            type: "fine_created",
            metadata: { fineId: fine.id.toString(), itemId },
        });
        const emailPromise = user.email && user.notificationPreference?.email
            ? (0, emailService_1.sendEmail)(user.email, emailSubject, emailBody)
            : Promise.resolve();
        const whatsappPromise = user.phoneNumber && user.notificationPreference?.whatsApp
            ? (0, whatsapp_1.sendWhatsAppMessage)(user.phoneNumber, `Hi ${user.fullName}, a new fine of ₹${amountIncurred} for "${reason}" has been added to your account.`)
            : Promise.resolve();
        await Promise.all([userNotificationPromise, emailPromise, whatsappPromise]);
    }
    catch (notificationError) {
        console.error("Failed to send notification:", notificationError.message);
    }
    return fine;
};
exports.createFineService = createFineService;
const updateFineService = async ({ fineId, data }) => {
    const isFineExists = await fine_model_1.default.findById(fineId);
    if (!isFineExists) {
        const err = new Error("No such fine exists");
        err.statusCode = 404;
        throw err;
    }
    if (data.amountIncurred !== undefined || data.amountPaid !== undefined) {
        const newAmountIncurred = data.amountIncurred ?? isFineExists.amountIncurred;
        const newAmountPaid = data.amountPaid ?? isFineExists.amountPaid;
        const newOutstanding = newAmountIncurred - newAmountPaid;
        data.outstandingAmount = newOutstanding;
        data.status = newOutstanding > 0 ? "Outstanding" : "Paid";
        data.dateSettled = newOutstanding === 0 ? new Date() : null;
    }
    const updatedFine = await fine_model_1.default.findByIdAndUpdate(fineId, { $set: data }, { new: true, runValidators: true });
    const user = await user_model_1.default.findById(updatedFine?.userId).lean();
    if (!user) {
        const err = new Error("User not found for this fine.");
        err.statusCode = 404;
        throw err;
    }
    let messageBody = "";
    if (data.amountPaid !== undefined) {
        if (updatedFine?.status === "Paid") {
            messageBody = `Hi ${user.fullName}, your fine of ₹${updatedFine.amountIncurred} for "${updatedFine.reason}" has been fully paid. Thank you!`;
        }
        else {
            messageBody = `Hi ${user.fullName}, your payment of ₹${data.amountPaid} has been received for fine "${updatedFine?.reason}". Outstanding balance: ₹${updatedFine?.outstandingAmount}.`;
        }
    }
    else if (data.amountIncurred !== undefined) {
        messageBody = `Hi ${user.fullName}, your fine amount for "${updatedFine?.reason}" has been updated to ₹${updatedFine?.amountIncurred}.`;
    }
    else {
        messageBody = `Hi ${user.fullName}, your fine record for "${updatedFine?.reason}" has been updated.`;
    }
    const notificationPromise = notificationService_1.NotificationService.createNotification({
        recipientId: user._id,
        title: "Fine Updated",
        message: messageBody,
        level: updatedFine?.status === "Paid" ? "Success" : "Info",
        type: "fine_updated",
        metadata: { fineId: updatedFine?.id.toString() },
    });
    const { subject, body } = await (0, getNotificationTemplate_1.getNotificationTemplate)("fineUpdated", { user: user.fullName }, {
        subject: "Fine Update Notification",
        body: `${messageBody}\n\nPlease log in to your account for more details.\n\nRegards,\nLibrary Management Team`,
    });
    const emailPromise = user.email && user.notificationPreference?.email
        ? (0, emailService_1.sendEmail)(user.email, subject, body)
        : Promise.resolve();
    await Promise.all([notificationPromise, emailPromise]);
    return updatedFine;
};
exports.updateFineService = updateFineService;
const deleteFineService = async (fineId) => {
    const fine = await fine_model_1.default.findById(fineId);
    if (!fine) {
        const err = new Error("No such Fine Exits");
        err.statusCode = 404;
        throw err;
    }
    if (fine.status === "Outstanding" || fine.outstandingAmount > 0) {
        const err = new Error("This fine cannot be deleted as it still has outstanding dues.");
        err.statusCode = 400;
        throw err;
    }
    const deletedFine = await fine_model_1.default.findByIdAndDelete(fineId);
    if (!deletedFine) {
        const err = new Error("Failed to delete fine. Please try again.");
        err.statusCode = 500;
        throw err;
    }
    const user = await user_model_1.default.findById(fine.userId).lean();
    if (user) {
        const message = `Hi ${user.fullName}, your fine for "${fine.reason}" (₹${fine.amountIncurred}) has been removed from your account.`;
        const notificationPromise = notificationService_1.NotificationService.createNotification({
            recipientId: user._id,
            title: "Fine Removed",
            message,
            level: "Info",
            type: "fine_deleted",
            metadata: { fineId: fine.id.toString() },
        });
        const { subject, body } = await (0, getNotificationTemplate_1.getNotificationTemplate)("fineDeleted", { user: user.fullName }, {
            subject: "Fine Removed Successfully",
            body: `${message}\n\nYou can log in to your account for updated records.\n\nRegards,\nLibrary Management Team`,
        });
        const emailPromise = user.email && user.notificationPreference?.email
            ? (0, emailService_1.sendEmail)(user.email, subject, body)
            : Promise.resolve();
        const whatsappPromise = user.phoneNumber && user.notificationPreference?.whatsApp
            ? (0, whatsapp_1.sendWhatsAppMessage)(user.phoneNumber, message)
            : Promise.resolve();
        await Promise.all([notificationPromise, emailPromise, whatsappPromise]);
    }
    return { message: "Fine deleted successfully" };
};
exports.deleteFineService = deleteFineService;
const recordPaymentService = async (data) => {
    const { fineId, amountPaid, paymentMethod, referenceId, notes, managedByAdminId, } = data;
    console.log("amount paid", amountPaid);
    const fine = await fine_model_1.default.findById(fineId);
    if (!fine) {
        const err = new Error("Fine not found");
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
    const user = await user_model_1.default.findById(fine.userId).lean();
    if (!user) {
        const err = new Error("User not found for this fine.");
        err.statusCode = 404;
        throw err;
    }
    const paymentMsg = fine.status === "Paid"
        ? `Hi ${user.fullName}, your fine of ₹${fine.amountIncurred} for "${fine.reason}" has been fully paid. Thank you!`
        : `Hi ${user.fullName}, a payment of ₹${amountPaid} has been recorded for your fine "${fine.reason}". Your remaining balance is ₹${fine.outstandingAmount.toFixed(2)}.`;
    const notificationPromise = notificationService_1.NotificationService.createNotification({
        recipientId: user._id,
        title: "Fine Payment Recorded",
        message: paymentMsg,
        level: fine.status === "Paid" ? "Success" : "Info",
        type: "fine_payment_recorded",
        metadata: {
            fineId: fine.id.toString(),
            amountPaid,
            paymentMethod,
            transactionId: referenceId,
        },
    });
    const { subject, body } = await (0, getNotificationTemplate_1.getNotificationTemplate)("finePayment", { user: user.fullName }, {
        subject: "Fine Payment Recorded",
        body: `${paymentMsg}\n\nYou can view the payment details in your account.\n\nRegards,\nLibrary Management Team`,
    });
    const emailPromise = user.email && user.notificationPreference?.email
        ? (0, emailService_1.sendEmail)(user.email, subject, body)
        : Promise.resolve();
    const whatsappPromise = user.phoneNumber && user.notificationPreference?.whatsApp
        ? (0, whatsapp_1.sendWhatsAppMessage)(user.phoneNumber, paymentMsg)
        : Promise.resolve();
    await Promise.all([notificationPromise, emailPromise, whatsappPromise]);
    return updatedFine;
};
exports.recordPaymentService = recordPaymentService;
const waiveFineService = async (data) => {
    const { fineId, waiverReason, managedByAdminId } = data;
    const fine = await fine_model_1.default.findById(fineId);
    if (!fine) {
        const err = new Error("Fine not found");
        err.statusCode = 404;
        throw err;
    }
    const updatedFine = await fine_model_1.default.findByIdAndUpdate(fineId, {
        $set: {
            status: "Waived",
            outstandingAmount: 0,
            dateSettled: new Date(),
            waiverReason,
            managedByAdminId,
        },
    }, { new: true, runValidators: true });
    const user = await user_model_1.default.findById(fine.userId).lean();
    if (!user) {
        const err = new Error("User not found for this fine.");
        err.statusCode = 404;
        throw err;
    }
    const messageText = `Hi ${user.fullName}, your fine of ₹${fine.amountIncurred} for "${fine.reason}" has been waived. Reason: ${waiverReason}`;
    const notificationPromise = notificationService_1.NotificationService.createNotification({
        recipientId: user._id,
        title: "Fine Waived",
        message: messageText,
        level: "Success",
        type: "fine_waived",
        metadata: {
            fineId: fine.id.toString(),
            waiverReason,
            managedByAdminId,
        },
    });
    let subject = "Fine Waived Successfully";
    let body = `${messageText}\n\nYou can log in to your account to view the updated fine status.\n\nRegards,\nLibrary Management Team`;
    try {
        const template = await (0, getNotificationTemplate_1.getNotificationTemplate)("fineWaived", { user: user.fullName }, {
            subject: `${subject}`,
            body: `${body}`,
            whatsapp: `${subject}`,
        });
        if (template?.subject && template?.body) {
            subject = template.subject;
            body = template.body;
        }
    }
    catch (templateError) {
        console.warn("No fineWaived email template found — using default fallback.");
    }
    const emailPromise = user.email && user.notificationPreference?.email
        ? (0, emailService_1.sendEmail)(user.email, subject, body)
        : Promise.resolve();
    const whatsappPromise = user.phoneNumber && user.notificationPreference?.whatsApp
        ? (0, whatsapp_1.sendWhatsAppMessage)(user.phoneNumber, messageText)
        : Promise.resolve();
    await Promise.all([notificationPromise, emailPromise, whatsappPromise]);
    return updatedFine;
};
exports.waiveFineService = waiveFineService;
const generateInventoryReportPDF = async (res) => {
    const items = (await item_model_1.default.find()
        .populate("categoryId")
        .lean()
        .exec());
    const doc = new pdfkit_1.default({ margin: 30, size: "A4" });
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
        doc.text(item._id.toString(), 30, y, { width: 80 });
        doc.text(item.title || "-", 120, y, { width: 120 });
        doc.text(item.categoryId?.name || "-", 250, y, { width: 90 });
        doc.text(item.publisherOrManufacturer || "-", 350, y, { width: 90 });
        doc.text(item.status || "-", 450, y, { width: 60 });
        doc.text(item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-", 520, y, { width: 80 });
        y += itemSpacing;
    });
    doc.end();
};
exports.generateInventoryReportPDF = generateInventoryReportPDF;
const generateFinesReportPDF = async (res) => {
    const fines = await fine_model_1.default.find().lean();
    const doc = new pdfkit_1.default({ margin: 30, size: "A4" });
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
        doc.text(fine.reason || "-", 250, y, { width: 90 });
        doc.text(fine.amountIncurred.toString() || "-", 350, y, { width: 90 });
        doc.text(fine.amountPaid.toString() || "-", 450, y, { width: 60 });
        doc.text(fine.outstandingAmount.toString() || "-", 520, y, { width: 80 });
        y += itemSpacing;
    });
    doc.end();
};
exports.generateFinesReportPDF = generateFinesReportPDF;
const generateIssuedItemsReportPDF = async (res) => {
    const items = await issuedItem_model_1.default.find().lean();
    const doc = new pdfkit_1.default({ margin: 30, size: "A4" });
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
        doc.text(item.userId, 30, y, { width: 80 });
        doc.text(item.itemId?.toString() || "-", 120, y, { width: 120 });
        doc.text(item.issuedDate || "-", 250, y, { width: 90 });
        doc.text(item.dueDate || "-", 350, y, { width: 90 });
        doc.text(item.status.toString() || "-", 450, y, { width: 60 });
        doc.text(item.fineId || "-", 520, y, { width: 80 });
        y += itemSpacing;
    });
    doc.end();
};
exports.generateIssuedItemsReportPDF = generateIssuedItemsReportPDF;
const getInventoryReportService = async () => {
    const items = await item_model_1.default.find()
        .populate("categoryId", "name")
        .lean();
    return items.map((item) => ({
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
exports.getInventoryReportService = getInventoryReportService;
const getFinesReportService = async () => {
    const fines = await fine_model_1.default.find()
        .populate("userId", "fullName")
        .populate("itemId", "title")
        .lean();
    let total = 0, paid = 0, outstanding = 0;
    const fineDetails = fines.map((fine) => {
        // Use amountIncurred instead of amount
        const fineAmount = fine.amountIncurred || 0;
        total += fineAmount;
        if (fine.status === "Paid") {
            paid += fineAmount;
        }
        else if (fine.status === "Waived") {
            // Waived fines might be considered as paid/cleared
            paid += fineAmount;
        }
        else {
            outstanding += fineAmount;
        }
        return {
            user: fine.userId?.fullName || "Unknown",
            item: fine.itemId?.title || "-",
            fineAmount: `$${fineAmount}`,
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
exports.getFinesReportService = getFinesReportService;
const getIssuedReportService = async () => {
    const records = await issuedItem_model_2.default.find()
        .populate("userId", "fullName email roles")
        .populate("itemId", "title authorOrCreator description price quantity availableCopies categoryId subcategoryId")
        .populate("issuedBy", "fullName email roles")
        .populate("returnedTo", "fullName email roles")
        .populate("fineId", "userId itemId reason amountIncurred amountPaid outstandingAmount")
        .lean();
    return records.map((record) => ({
        id: record._id,
        status: record.status || "Issued",
        user: {
            id: record.userId?._id || null,
            fullName: record.userId?.fullName || "Unknown",
            email: record.userId?.email || "-",
            roles: record.userId?.roles || [],
        },
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
        issuedDate: record.issuedDate
            ? new Date(record.issuedDate).toISOString().split("T")[0]
            : "-",
        dueDate: record.dueDate
            ? new Date(record.dueDate).toISOString().split("T")[0]
            : "-",
        returnDate: record.returnDate
            ? new Date(record.returnDate).toISOString().split("T")[0]
            : "-",
        extensionCount: record.extensionCount ?? 0,
        maxExtensionAllowed: record.maxExtensionAllowed ?? 2,
        fine: record.fineId
            ? {
                id: record.fineId._id,
                reason: record.fineId.reason || "-",
                amountIncurred: record.fineId.amountIncurred ?? 0,
                amountPaid: record.fineId.amountPaid ?? 0,
                outstandingAmount: record.fineId.outstandingAmount ?? 0,
            }
            : null,
        createdAt: record.createdAt
            ? new Date(record.createdAt).toISOString().split("T")[0]
            : "-",
        updatedAt: record.updatedAt
            ? new Date(record.updatedAt).toISOString().split("T")[0]
            : "-",
    }));
};
exports.getIssuedReportService = getIssuedReportService;
const getQueueAnalytics = async (startDate, endDate) => {
    const dateFilter = {};
    if (startDate && endDate) {
        dateFilter.createdAt = {
            $gte: startDate,
            $lte: endDate,
        };
    }
    const queues = await queue_model_1.default.find(dateFilter)
        .populate("itemId", "title categoryId")
        .populate("queueMembers.userId")
        .lean();
    const totalQueues = queues.length;
    const activeQueues = queues.filter((q) => q.queueMembers.length > 0).length;
    const totalUsersWaiting = queues.reduce((sum, queue) => sum + queue.queueMembers.length, 0);
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
exports.getQueueAnalytics = getQueueAnalytics;
const calculateQueueLengthDistribution = (queues) => {
    const distribution = {
        "1-5": 0,
        "6-10": 0,
        "11-20": 0,
        "21-50": 0,
        "50+": 0,
    };
    queues.forEach((queue) => {
        const length = queue.queueMembers.length;
        if (length <= 5)
            distribution["1-5"]++;
        else if (length <= 10)
            distribution["6-10"]++;
        else if (length <= 20)
            distribution["11-20"]++;
        else if (length <= 50)
            distribution["21-50"]++;
        else
            distribution["50+"]++;
    });
    return Object.entries(distribution).map(([length, count]) => ({
        length,
        count,
    }));
};
const getPopularItems = async (queues) => {
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
        }
        else {
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
const calculateAverageWaitTime = async () => {
    const result = await queue_model_1.default.aggregate([
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
const calculateNotificationResponseRate = async () => {
    return 75; // 75% response rate
};
const getWaitTimeAnalysis = async () => {
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
const getCategoryAnalysis = async (queues) => {
    const categoryMap = new Map();
    queues.forEach((queue) => {
        const category = queue.itemId?.categoryId?.name || "Uncategorized";
        if (categoryMap.has(category)) {
            const current = categoryMap.get(category);
            categoryMap.set(category, {
                queueCount: current.queueCount + 1,
                totalWaitTime: current.totalWaitTime + queue.queueMembers.length * 5, // Simplified
            });
        }
        else {
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
const exportQueueAnalytics = async () => {
    const analytics = await (0, exports.getQueueAnalytics)();
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
exports.exportQueueAnalytics = exportQueueAnalytics;
const exportIssuedItemsReport = async (startDate, endDate) => {
    try {
        const query = {};
        if (startDate || endDate) {
            query.issuedDate = {};
            if (startDate)
                query.issuedDate.$gte = new Date(startDate);
            if (endDate)
                query.issuedDate.$lte = new Date(endDate);
        }
        const report = await issuedItem_model_2.default.find(query)
            .populate("userId", "fullName email")
            .populate("itemId", "title authorOrCreator")
            .populate("issuedBy", "fullName email")
            .populate("returnedTo", "fullName email")
            .sort({ issuedDate: -1 });
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
        const csvRows = report.map((item) => {
            // Safely access populated fields
            const userName = item.userId?.fullName || "-";
            const userEmail = item.userId?.email || "-";
            const itemTitle = item.itemId?.title || "-";
            const itemAuthor = item.itemId?.authorOrCreator || "-";
            const issuedByName = item.issuedBy?.fullName || "-";
            const returnedToName = item.returnedTo?.fullName || "-";
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
    }
    catch (error) {
        throw new Error(`Failed to export issued items: ${error.message}`);
    }
};
exports.exportIssuedItemsReport = exportIssuedItemsReport;
const getSystemRestrictionsService = async () => {
    const settings = await setting_model_1.default.findOne().lean();
    if (!settings) {
        const error = new Error("System settings not found");
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
exports.getSystemRestrictionsService = getSystemRestrictionsService;
const extendPeriodService = async (issuedItemId, extensionDays) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const issuedItem = await issuedItem_model_2.default.findById(issuedItemId)
            .populate("userId", "fullName email roles")
            .populate("itemId", "title authorOrCreator description price quantity availableCopies categoryId subcategoryId")
            .session(session);
        if (!issuedItem) {
            await session.abortTransaction();
            session.endSession();
            return { success: false, message: "Issued item not found" };
        }
        if (issuedItem.status === "Returned") {
            await session.abortTransaction();
            session.endSession();
            return {
                success: false,
                message: "Cannot extend period for returned item",
            };
        }
        if (issuedItem.extensionCount >= issuedItem.maxExtensionAllowed) {
            await session.abortTransaction();
            session.endSession();
            return {
                success: false,
                message: `Maximum extensions (${issuedItem.maxExtensionAllowed}) already reached`,
            };
        }
        if (!issuedItem.dueDate) {
            await session.abortTransaction();
            session.endSession();
            return {
                success: false,
                message: "Cannot extend - due date not set for this item",
            };
        }
        const currentDueDate = new Date(issuedItem.dueDate);
        const newDueDate = new Date(currentDueDate);
        newDueDate.setDate(newDueDate.getDate() + extensionDays);
        const updatedItem = await issuedItem_model_2.default.findByIdAndUpdate(issuedItemId, {
            $set: {
                dueDate: newDueDate,
                extensionCount: issuedItem.extensionCount + 1,
            },
        }, { new: true, session })
            .populate("userId", "fullName email roles")
            .populate("itemId", "title authorOrCreator description price quantity availableCopies categoryId subcategoryId")
            .populate("issuedBy", "fullName email roles")
            .populate("returnedTo", "fullName email roles")
            .populate("fineId", "userId itemId reason amountIncurred amountPaid outstandingAmount");
        if (!updatedItem) {
            await session.abortTransaction();
            session.endSession();
            return { success: false, message: "Failed to update issued item" };
        }
        await session.commitTransaction();
        session.endSession();
        return {
            success: true,
            updatedItem: updatedItem.toObject(),
        };
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error extending period:", error);
        return { success: false, message: "Internal server error" };
    }
};
exports.extendPeriodService = extendPeriodService;
const returnItemService = async (itemId, userId, condition) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const issuedItem = await issuedItem_model_2.default.findOne({
            itemId,
            status: "Issued",
        }).session(session);
        if (!issuedItem) {
            throw new Error("No active issued record found for this user and item.");
        }
        const item = await item_model_1.default.findById(itemId).session(session);
        if (!item) {
            throw new Error("Item not found in inventory.");
        }
        issuedItem.status = "Returned";
        issuedItem.returnDate = new Date();
        issuedItem.returnedTo = userId;
        if (condition === "Good") {
            item.availableCopies += 1;
            item.status = "Available";
        }
        else if (condition === "Damaged") {
            item.status = "Available";
        }
        else if (condition === "Lost") {
            item.status = "Available";
        }
        await issuedItem.save({ session });
        await item.save({ session });
        await session.commitTransaction();
        session.endSession();
        return {
            message: condition === "Good"
                ? "Item successfully returned and stock updated."
                : `Item marked as ${condition}. Quantity unchanged.`,
            condition,
        };
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};
exports.returnItemService = returnItemService;
const getAllRequestedItemsService = async ({ page, limit, status, category, sortBy = "requestedAt", sortOrder = "desc", }) => {
    try {
        const filter = {};
        if (status) {
            filter.status = status;
        }
        if (category) {
            filter.category = { $regex: category, $options: "i" };
        }
        const skip = (page - 1) * limit;
        const sort = {};
        sort[sortBy] = sortOrder === "asc" ? 1 : -1;
        const [requests, totalCount] = await Promise.all([
            requestedItem_model_1.default.find(filter)
                .populate("userId", "name email department")
                .populate("processedBy", "name email")
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            requestedItem_model_1.default.countDocuments(filter),
        ]);
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        return {
            success: true,
            message: "Item requests fetched successfully",
            data: {
                requests,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    hasNextPage,
                    hasPrevPage,
                    limit,
                },
                filters: {
                    status: status || "all",
                    category: category || "all",
                },
            },
        };
    }
    catch (error) {
        console.error("Error in getAllRequestedItemsService:", error);
        return {
            success: false,
            message: "Error fetching item requests",
        };
    }
};
exports.getAllRequestedItemsService = getAllRequestedItemsService;
const approveRequestedItemService = async (requestId, adminId) => {
    try {
        if (!mongoose_1.default.Types.ObjectId.isValid(requestId)) {
            return {
                success: false,
                message: "Invalid request ID format",
            };
        }
        const itemRequest = await requestedItem_model_1.default.findById(requestId);
        if (!itemRequest) {
            return {
                success: false,
                message: "Item request not found",
            };
        }
        if (itemRequest.status !== "pending") {
            return {
                success: false,
                message: `Item request is already ${itemRequest.status}`,
            };
        }
        const updatedRequest = await requestedItem_model_1.default.findByIdAndUpdate(requestId, {
            status: "approved",
            processedAt: new Date(),
            processedBy: adminId,
        }, { new: true })
            .populate("userId", "name email")
            .populate("processedBy", "name email");
        if (itemRequest.userId &&
            itemRequest.userId.notificationPreference?.email) {
            const userEmail = itemRequest.userId.email;
            const userName = itemRequest.userId.name || "User";
            const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
                .content { background: #f9f9f9; padding: 20px; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                .button { display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
                .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Item Request Approved!</h1>
                </div>
                <div class="content">
                    <p>Dear ${userName},</p>
                    <p>Great news! Your item request has been approved by the administrator.</p>
                    
                    <div class="details">
                        <h3>Request Details:</h3>
                        <p><strong>Item Name:</strong> ${itemRequest.name}</p>
                        <p><strong>Category:</strong> ${itemRequest.category}</p>
                        <p><strong>Quantity:</strong> ${itemRequest.quantity}</p>
                        <p><strong>Approved On:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>

                    <p>You can now proceed to collect your item from the designated location.</p>
                    
                    <p>If you have any questions, please contact the administration.</p>
                    
                    <p>Best regards,<br>Your App Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
      `;
            await (0, emailService_1.sendEmail)(userEmail, `Item Request Approved: ${itemRequest.name}`, emailHtml);
        }
        return {
            success: true,
            message: "Item request approved successfully",
            data: updatedRequest,
        };
    }
    catch (error) {
        console.error("Error in approveRequestedItemService:", error);
        return {
            success: false,
            message: "Error approving item request",
        };
    }
};
exports.approveRequestedItemService = approveRequestedItemService;
const rejectRequestedItemService = async (requestId, adminId) => {
    try {
        if (!mongoose_1.default.Types.ObjectId.isValid(requestId)) {
            return {
                success: false,
                message: "Invalid request ID format",
            };
        }
        const itemRequest = await requestedItem_model_1.default.findById(requestId);
        if (!itemRequest) {
            return {
                success: false,
                message: "Item request not found",
            };
        }
        if (itemRequest.status !== "pending") {
            return {
                success: false,
                message: `Item request is already ${itemRequest.status}`,
            };
        }
        const updatedRequest = await requestedItem_model_1.default.findByIdAndUpdate(requestId, {
            status: "rejected",
            processedAt: new Date(),
            processedBy: adminId,
        }, { new: true })
            .populate("userId", "name email")
            .populate("processedBy", "name email");
        if (itemRequest.userId &&
            itemRequest.userId.notificationPreference?.email) {
            const userEmail = itemRequest.userId.email;
            const userName = itemRequest.userId.name || "User";
            const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #f44336; color: white; padding: 20px; text-align: center; }
                .content { background: #f9f9f9; padding: 20px; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .contact-info { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>❌ Item Request Not Approved</h1>
                </div>
                <div class="content">
                    <p>Dear ${userName},</p>
                    <p>We regret to inform you that your item request could not be approved at this time.</p>
                    
                    <div class="details">
                        <h3>Request Details:</h3>
                        <p><strong>Item Name:</strong> ${itemRequest.name}</p>
                        <p><strong>Category:</strong> ${itemRequest.category}</p>
                        <p><strong>Quantity:</strong> ${itemRequest.quantity}</p>
                        <p><strong>Status Updated:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>

                    <div class="contact-info">
                        <p><strong>Need more information?</strong></p>
                        <p>If you would like to know more about why your request was not approved or would like to discuss alternative options, please contact the administration team.</p>
                    </div>

                    <p>You can submit a new request with different specifications if needed.</p>
                    
                    <p>Best regards,<br>Your App Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
      `;
            await (0, emailService_1.sendEmail)(userEmail, `Item Request Update: ${itemRequest.name}`, emailHtml);
        }
        return {
            success: true,
            message: "Item request rejected successfully",
            data: updatedRequest,
        };
    }
    catch (error) {
        console.error("Error in rejectRequestedItemService:", error);
        return {
            success: false,
            message: "Error rejecting item request",
        };
    }
};
exports.rejectRequestedItemService = rejectRequestedItemService;
const deleteRequestedItemService = async (requestId) => {
    try {
        if (!mongoose_1.default.Types.ObjectId.isValid(requestId)) {
            return {
                success: false,
                message: "Invalid request ID format",
            };
        }
        const itemRequest = await requestedItem_model_1.default.findById(requestId).populate("userId", "name email notificationPreference");
        if (!itemRequest) {
            return {
                success: false,
                message: "Item request not found",
            };
        }
        if (itemRequest.status !== "pending") {
            return {
                success: false,
                message: `Cannot delete ${itemRequest.status} item requests`,
            };
        }
        if (itemRequest.userId &&
            itemRequest.userId.notificationPreference?.email) {
            const userEmail = itemRequest.userId.email;
            const userName = itemRequest.userId.name || "User";
            const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #ff9800; color: white; padding: 20px; text-align: center; }
                .content { background: #f9f9f9; padding: 20px; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .action { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🗑️ Item Request Cancelled</h1>
                </div>
                <div class="content">
                    <p>Dear ${userName},</p>
                    <p>Your pending item request has been removed from the system.</p>
                    
                    <div class="details">
                        <h3>Cancelled Request Details:</h3>
                        <p><strong>Item Name:</strong> ${itemRequest.name}</p>
                        <p><strong>Category:</strong> ${itemRequest.category}</p>
                        <p><strong>Quantity:</strong> ${itemRequest.quantity}</p>
                        <p><strong>Request Date:</strong> ${itemRequest.requestedAt.toLocaleDateString()}</p>
                    </div>

                    <div class="action">
                        <p><strong>Want to submit a new request?</strong></p>
                        <p>If you believe this was done in error or would like to submit a new request, please visit the application and create a new item request.</p>
                    </div>

                    <p>If you have any questions about this cancellation, please contact the administration team.</p>
                    
                    <p>Best regards,<br>Your App Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
      `;
            await (0, emailService_1.sendEmail)(userEmail, `Item Request Cancelled: ${itemRequest.name}`, emailHtml);
        }
        await requestedItem_model_1.default.findByIdAndDelete(requestId);
        return {
            success: true,
            message: "Item request deleted successfully",
            data: { id: requestId },
        };
    }
    catch (error) {
        console.error("Error in deleteRequestedItemService:", error);
        return {
            success: false,
            message: "Error deleting item request",
        };
    }
};
exports.deleteRequestedItemService = deleteRequestedItemService;
const updateSystemRestrictionsService = async (updateData) => {
    try {
        const updatedSettings = await setting_model_1.default.findOneAndUpdate({}, { $set: updateData }, { new: true, runValidators: false, upsert: true }).lean();
        return updatedSettings;
    }
    catch (error) {
        throw new Error(error.message || "Failed to update system settings");
    }
};
exports.updateSystemRestrictionsService = updateSystemRestrictionsService;
const getNotificationTemplatesService = async () => {
    const templates = await setting_model_1.default.findOne().select("notificationTemplates -_id");
    return templates;
};
exports.getNotificationTemplatesService = getNotificationTemplatesService;
const addTemplateService = async (key, template) => {
    const settings = await setting_model_1.default.findOneAndUpdate({}, { $set: { [`notificationTemplates.${key}`]: template } }, { upsert: true, new: true });
    return settings.notificationTemplates;
};
exports.addTemplateService = addTemplateService;
const updateTemplateService = async (key, template) => {
    const settings = await setting_model_1.default.findOneAndUpdate({}, { $set: { [`notificationTemplates.${key}`]: template } }, { new: true });
    return settings?.notificationTemplates || "";
};
exports.updateTemplateService = updateTemplateService;
const updateNotificationTemplateService = async ({ templateKey, data, }) => {
    const setting = await setting_model_1.default.findOne();
    if (!setting) {
        throw new Error("System settings not found");
    }
    const updateFields = {};
    if (data.emailSubject !== undefined)
        updateFields[`notificationTemplates.${templateKey}.emailSubject`] =
            data.emailSubject;
    if (data.emailBody !== undefined)
        updateFields[`notificationTemplates.${templateKey}.emailBody`] =
            data.emailBody;
    if (data.whatsappMessage !== undefined)
        updateFields[`notificationTemplates.${templateKey}.whatsappMessage`] =
            data.whatsappMessage;
    const updatedSetting = await setting_model_1.default.findOneAndUpdate({}, { $set: updateFields }, { new: true, lean: true });
    return updatedSetting?.notificationTemplates?.[templateKey];
};
exports.updateNotificationTemplateService = updateNotificationTemplateService;
const getAdminProfileService = async (userId) => {
    const admin = await user_model_1.default.findById(userId).lean();
    if (!admin) {
        const err = new Error("Admin profile not found");
        err.statusCode = 404;
        throw err;
    }
    return admin;
};
exports.getAdminProfileService = getAdminProfileService;
const resetPasswordAdminService = async (userId) => {
    const isExistingAdmin = await user_model_1.default.findById(userId);
    if (!isExistingAdmin) {
        const err = new Error("no admin found with this amdinId");
        err.statusCode = 404;
        throw err;
    }
    const user = await user_model_1.default.findByIdAndUpdate(userId, { $set: { passwordResetRequired: true } }, { new: true, runValidators: false });
    return user;
};
exports.resetPasswordAdminService = resetPasswordAdminService;
const updateAdminPasswordServive = async (data) => {
    const { userId, password } = data;
    const isExistingAdmin = await user_model_1.default.findById(userId);
    if (!isExistingAdmin) {
        const err = new Error("no admin found with this amdinId");
        err.statusCode = 404;
        throw err;
    }
    const salt = await bcrypt_1.default.genSalt(10);
    const hashPassword = await bcrypt_1.default.hash(password, salt);
    const user = await user_model_1.default.findByIdAndUpdate(userId, { $set: { password: hashPassword } }, { new: true, runValidators: false }).select("+password");
    return user;
};
exports.updateAdminPasswordServive = updateAdminPasswordServive;
const generateBarcodeString = async () => {
    return `ITEM-${(0, uuid_1.v4)()}`;
};
exports.generateBarcodeString = generateBarcodeString;
const generateBarcodePDF = async (itemId, res) => {
    try {
        const isItemExisting = await item_model_1.default.findById(itemId);
        if (!isItemExisting) {
            const err = new Error("Item not found");
            err.statusCode = 404;
            throw err;
        }
        const barcodeValue = isItemExisting.barcode;
        const pngBuffer = await bwip_js_1.default.toBuffer({
            bcid: "code128",
            text: barcodeValue,
            scale: 3,
            height: 10,
            includetext: true,
            textxalign: "center",
        });
        const doc = new pdfkit_1.default();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=barcode-${barcodeValue}.pdf`);
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
    }
    catch (err) {
        throw new Error("Failed to generate barcode PDF");
    }
};
exports.generateBarcodePDF = generateBarcodePDF;
const getAllDonationService = async () => {
    const donations = await donation_model_1.default.find()
        .populate({ path: "userId", select: "fullName email" })
        .populate({ path: "itemType", select: "name description" });
    return donations || "";
};
exports.getAllDonationService = getAllDonationService;
const updateDonationStatusService = async (donationId, status) => {
    const donation = await donation_model_1.default.findById(donationId)
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
exports.updateDonationStatusService = updateDonationStatusService;
const processItemReturn = async (itemId) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const queue = await queue_model_1.default.findOne({ itemId })
            .populate("queueMembers.userId")
            .session(session);
        if (!queue || queue.queueMembers.length === 0) {
            await session.commitTransaction();
            session.endSession();
            return { message: "No queue found for this item" };
        }
        if (queue.isProcessing) {
            await session.commitTransaction();
            session.endSession();
            return { message: "Queue is already being processed" };
        }
        const nextUser = queue.queueMembers
            .filter((member) => member.status === "waiting")
            .sort((a, b) => a.position - b.position)[0];
        if (!nextUser) {
            await session.commitTransaction();
            session.endSession();
            return { message: "No waiting users in queue" };
        }
        queue.isProcessing = true;
        queue.currentNotifiedUser = nextUser.userId._id;
        nextUser.status = "notified";
        nextUser.notifiedAt = new Date();
        nextUser.notificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await queue.save({ session });
        await sendItemAvailableNotification(nextUser.userId, itemId);
        await session.commitTransaction();
        session.endSession();
        return {
            message: "Notification sent to next user in queue",
            userId: nextUser.userId._id,
            expiresAt: nextUser.notificationExpires,
        };
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};
exports.processItemReturn = processItemReturn;
const calculateDueDate = (defaultReturnPeriod) => {
    const defaultPeriod = defaultReturnPeriod || 14;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + defaultPeriod);
    return dueDate;
};
const handleUserResponse = async (userId, itemId, accept) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const queue = await queue_model_1.default.findOne({ itemId }).session(session);
        if (!queue) {
            throw new Error("Queue not found");
        }
        const userMember = queue.queueMembers.find((member) => member.userId.toString() === userId && member.status === "notified");
        if (!userMember) {
            throw new Error("User not found in queue or not notified");
        }
        if (accept) {
            // User accepts - issue the item
            const item = await item_model_1.default.findById(itemId).session(session);
            if (!item || item.availableCopies <= 0) {
                throw new Error("Item no longer available");
            }
            // Issue item
            const dueDate = calculateDueDate(item.defaultReturnPeriod);
            const issuedItem = new issuedItem_model_2.default({
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
        }
        else {
            // User declines - mark as skipped
            userMember.status = "skipped";
        }
        // Remove user from queue and recalculate positions
        queue.queueMembers = queue.queueMembers.filter((member) => member.userId.toString() !== userId || member.status === "issued");
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
            await (0, exports.processItemReturn)(itemId);
        }
        await session.commitTransaction();
        session.endSession();
        return {
            message: accept
                ? "Item issued successfully"
                : "Item declined, moving to next user",
            issued: accept,
        };
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};
exports.handleUserResponse = handleUserResponse;
const checkExpiredNotifications = async () => {
    const now = new Date();
    const queues = await queue_model_1.default.find({
        "queueMembers.notificationExpires": { $lt: now },
        "queueMembers.status": "notified",
    }).populate("queueMembers.userId");
    for (const queue of queues) {
        const expiredMembers = queue.queueMembers.filter((member) => member.status === "notified" &&
            member.notificationExpires &&
            member.notificationExpires < now);
        for (const member of expiredMembers) {
            console.log(`Notification expired for user ${member.userId._id} in queue ${queue._id}`);
            member.status = "skipped";
            await sendSkippedNotification(member.userId, queue.itemId.toString());
        }
        // Remove skipped users and recalculate positions
        queue.queueMembers = queue.queueMembers.filter((member) => member.status !== "skipped");
        queue.queueMembers.forEach((member, index) => {
            member.position = index + 1;
        });
        // Reset processing state and process next user
        queue.isProcessing = false;
        queue.currentNotifiedUser = null;
        await queue.save();
        await (0, exports.processItemReturn)(queue.itemId.toString());
    }
};
exports.checkExpiredNotifications = checkExpiredNotifications;
const sendItemAvailableNotification = async (user, itemId) => {
    const item = await item_model_1.default.findById(itemId);
    if (!item)
        return;
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
        await (0, emailService_1.sendEmail)(user.email, "Item Available for Borrowing", emailHtml);
    }
    if (user.notificationPreference?.whatsApp && user.phoneNumber) {
        const whatsappMessage = `${message}\n\nAccept: ${acceptLink}\nDecline: ${declineLink}`;
        await (0, whatsapp_1.sendWhatsAppMessage)(user.phoneNumber, whatsappMessage);
    }
};
const sendSkippedNotification = async (user, itemId) => {
    const item = await item_model_1.default.findById(itemId);
    if (!item)
        return;
    const message = `Your notification period for "${item.title}" has expired. You have been moved to the end of the queue.`;
    if (user.notificationPreference?.email) {
        await (0, emailService_1.sendEmail)(user.email, "Queue Notification Expired", message);
    }
    if (user.notificationPreference?.whatsApp && user.phoneNumber) {
        await (0, whatsapp_1.sendWhatsAppMessage)(user.phoneNumber, message);
    }
};
const sendIssueNotification = async (userId, itemTitle, dueDate, type) => {
    try {
        const user = await user_model_1.default.findById(userId);
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
    }
    catch (error) {
        console.error("Error sending issue notification:", error);
    }
};
const viewQueueService = async (itemId) => {
    const queue = await queue_model_1.default.findOne({ itemId })
        .populate("itemId", "title status")
        .populate("queueMembers.userId", "fullName email phoneNumber")
        .populate("currentNotifiedUser", "fullName email");
    return queue ? [queue] : [];
};
exports.viewQueueService = viewQueueService;
const issueItemFromQueueService = async (queueId, userId, adminId) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const queue = await queue_model_1.default.findById(queueId).session(session);
        if (!queue) {
            throw new Error("Queue not found.");
        }
        const memberToIssue = queue.queueMembers.find((member) => member.userId.toString() === userId);
        if (!memberToIssue) {
            throw new Error("User is not a member of this queue.");
        }
        const item = await item_model_1.default.findById(queue.itemId).session(session);
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
        const dueDate = new Date(issueDate.setDate(issueDate.getDate() + (item.defaultReturnPeriod || 14)));
        // Create issued item record
        const issuedItem = new issuedItem_model_2.default({
            itemId: queue.itemId,
            userId: userId,
            issuedDate: new Date(),
            dueDate: dueDate,
            issuedBy: adminId,
            status: "Issued",
        });
        await issuedItem.save({ session });
        const remainingMembers = queue.queueMembers.filter((member) => member.userId.toString() !== userId);
        const updatedMembers = remainingMembers.map((member, index) => ({
            ...member,
            position: index + 1,
        }));
        queue.queueMembers = updatedMembers;
        await queue.save({ session });
        // Send notification
        const user = await user_model_1.default.findById(userId);
        if (user && item) {
            const message = `Your item "${item.title}" has been issued by admin. Due date: ${dueDate.toDateString()}.`;
            if (user.notificationPreference?.email) {
                await (0, emailService_1.sendEmail)(user.email, "Item Issued by Admin", message);
            }
            if (user.notificationPreference?.whatsApp && user.phoneNumber) {
                await (0, whatsapp_1.sendWhatsAppMessage)(user.phoneNumber, message);
            }
        }
        await session.commitTransaction();
        session.endSession();
        return issuedItem;
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};
exports.issueItemFromQueueService = issueItemFromQueueService;
const removeUserFromQueueService = async (queueId, userId) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const queue = await queue_model_1.default.findById(queueId).session(session);
        if (!queue) {
            throw new Error("Queue not found.");
        }
        if (!queue.queueMembers || queue.queueMembers.length === 0) {
            throw new Error("User is not in the queue.");
        }
        const memberIndex = queue.queueMembers.findIndex((member) => member.userId.equals(new mongoose_1.default.Types.ObjectId(userId)));
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
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};
exports.removeUserFromQueueService = removeUserFromQueueService;
const fetchAllPermissionsService = async () => {
    const permissions = await permission_model_1.Permission.find({}).lean();
    if (!permissions.length) {
        const err = new Error("No permissions found.");
        err.statusCode = 404;
        throw err;
    }
    return permissions;
};
exports.fetchAllPermissionsService = fetchAllPermissionsService;
const getDefaulterReport = async (filters) => {
    try {
        const today = new Date();
        let query = {
            status: "Issued",
            dueDate: { $lt: today },
        };
        if (filters.overdueSince) {
            const overdueSinceDate = new Date(filters.overdueSince);
            query.dueDate.$lt = overdueSinceDate;
        }
        console.log("Query:", query);
        const issuedItems = await issuedItem_model_2.default.find(query)
            .populate("userId", "fullName email employeeId phoneNumber roles")
            .populate("itemId", "title barcode categoryId")
            .populate("issuedBy", "fullName")
            .sort({ dueDate: 1 });
        console.log("Found issued items:", issuedItems.length);
        const defaultersPromises = issuedItems.map(async (item) => {
            try {
                const user = item.userId;
                const inventoryItem = item.itemId;
                if (!user || !inventoryItem) {
                    console.log("Missing user or inventory item");
                    return null;
                }
                const userRoles = await role_model_1.default.find({ _id: { $in: user.roles } });
                const roleNames = userRoles.map((role) => role.roleName).join(", ");
                const category = await category_model_1.default.findById(inventoryItem.categoryId);
                if (filters.categoryId &&
                    category?._id.toString() !== filters.categoryId) {
                    return null;
                }
                if (filters.roleId) {
                    const hasRole = user.roles.some((roleId) => roleId.toString() === filters.roleId);
                    if (!hasRole) {
                        return null;
                    }
                }
                const dueDate = new Date(item.dueDate);
                const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                return {
                    issuedItemId: item._id.toString(),
                    userName: user.fullName,
                    userEmail: user.email,
                    employeeId: user.employeeId,
                    phoneNumber: user.phoneNumber,
                    roleName: roleNames,
                    itemTitle: inventoryItem.title,
                    barcode: inventoryItem.barcode,
                    issuedDate: item.issuedDate.toISOString().split("T")[0],
                    dueDate: item.dueDate.toISOString().split("T")[0],
                    daysOverdue,
                    categoryName: category?.name || "Unknown",
                    userId: user._id.toString(),
                    itemId: inventoryItem._id.toString(),
                };
            }
            catch (error) {
                console.error("Error processing issued item:", error);
                return null;
            }
        });
        const defaulters = await Promise.all(defaultersPromises);
        const result = defaulters.filter((item) => item !== null);
        console.log("Final defaulters count:", result.length);
        return result;
    }
    catch (error) {
        console.error("Error in getDefaulterReport:", error);
        throw new Error(`Failed to fetch defaulter report: ${error.message}`);
    }
};
exports.getDefaulterReport = getDefaulterReport;
const sendReminderService = async (issuedItemId, userId, itemId) => {
    try {
        const user = await user_model_1.default.findById(userId);
        const item = await item_model_1.default.findById(itemId);
        const issuedItem = await issuedItem_model_2.default.findById(issuedItemId);
        if (!user || !item || !issuedItem) {
            throw new Error("User, item, or issued item not found");
        }
        const dueDate = new Date(issuedItem.dueDate);
        const today = new Date();
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
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
            await (0, emailService_1.sendEmail)(user.email, emailSubject, emailBody);
        }
        // WhatsApp reminder
        if (user.notificationPreference?.whatsApp && user.phoneNumber) {
            const whatsappMessage = `
          Overdue Item Reminder

          Dear ${user.fullName},

          This item is overdue:
          ${item.title}
          Due: ${dueDate.toDateString()} 
          Overdue: ${daysOverdue} days
          Barcode: ${item.barcode}

          Please return it ASAP to avoid penalties.

          Library Management System
      `;
            await (0, whatsapp_1.sendWhatsAppMessage)(user.phoneNumber, whatsappMessage);
        }
        return {
            emailSent: user.notificationPreference?.email || false,
            whatsappSent: (user.notificationPreference?.whatsApp && user.phoneNumber) || false,
        };
    }
    catch (error) {
        throw new Error(`Failed to send reminder: ${error.message}`);
    }
};
exports.sendReminderService = sendReminderService;
const exportDefaulterReport = async (filters) => {
    try {
        const defaulters = await (0, exports.getDefaulterReport)(filters);
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
        const csvRows = defaulters.map((defaulter) => [
            `"${defaulter.userName}"`,
            `"${defaulter.employeeId || "-"}"`,
            `"${defaulter.userEmail}"`,
            `"${defaulter.phoneNumber
                ? defaulter.phoneNumber.slice(-4).padStart(10, "*")
                : "-"}"`,
            `"${defaulter.roleName}"`,
            `"${defaulter.itemTitle}"`,
            `"${defaulter.barcode}"`,
            `"${defaulter.issuedDate}"`,
            `"${defaulter.dueDate}"`,
            `"${defaulter.daysOverdue}"`,
            `"${defaulter.categoryName}"`,
        ]);
        const csvContent = [
            headers.join(","),
            ...csvRows.map((row) => row.join(",")),
        ].join("\n");
        return csvContent;
    }
    catch (error) {
        throw new Error(`Failed to export defaulter report: ${error.message}`);
    }
};
exports.exportDefaulterReport = exportDefaulterReport;
const getAllUsersReport = async (filters) => {
    try {
        const today = new Date();
        let userQuery = {};
        if (filters.status) {
            if (filters.status === "active") {
                userQuery.status = "Active";
            }
            else if (filters.status === "inactive") {
                userQuery.status = "Inactive";
            }
        }
        if (filters.roleId) {
            userQuery.roles = new mongoose_1.Types.ObjectId(filters.roleId);
        }
        console.log("User query:", userQuery);
        const users = await user_model_1.default.find(userQuery)
            .populate("roles")
            .sort({ createdAt: -1 });
        console.log("Found users:", users.length);
        const usersReportPromises = users.map(async (user) => {
            try {
                const issuedItems = await issuedItem_model_2.default.find({
                    userId: user._id,
                    status: "Issued",
                })
                    .populate("itemId")
                    .sort({ issuedDate: -1 });
                const totalItemsIssued = issuedItems.length;
                const overdueItems = issuedItems.filter((item) => new Date(item.dueDate) < today);
                const itemsOverdue = overdueItems.length;
                const totalOverdueItems = overdueItems.length;
                let avgDaysOverdue = 0;
                if (overdueItems.length > 0) {
                    const totalDaysOverdue = overdueItems.reduce((sum, item) => {
                        const dueDate = new Date(item.dueDate);
                        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                        return sum + daysOverdue;
                    }, 0);
                    avgDaysOverdue = Math.round(totalDaysOverdue / overdueItems.length);
                }
                const lastIssuedDate = issuedItems.length > 0 ? issuedItems[0].issuedDate : undefined;
                let roleNames = "";
                if (user.roles && user.roles.length > 0) {
                    if (typeof user.roles[0] === "object" &&
                        "roleName" in user.roles[0]) {
                        roleNames = user.roles
                            .map((role) => role.roleName)
                            .join(", ");
                    }
                    else {
                        const roleDocs = await role_model_1.default.find({ _id: { $in: user.roles } });
                        roleNames = roleDocs.map((role) => role.roleName).join(", ");
                    }
                }
                const frontendStatus = user.status === "Active" ? "active" : "inactive";
                const joinDate = user.createdAt
                    ? user.createdAt.toISOString().split("T")[0]
                    : new Date().toISOString().split("T")[0];
                if (filters.hasOverdue === "true" && itemsOverdue === 0) {
                    return null;
                }
                if (filters.hasOverdue === "false" && itemsOverdue > 0) {
                    return null;
                }
                return {
                    userId: user._id.toString(),
                    userName: user.fullName,
                    userEmail: user.email,
                    employeeId: user.employeeId,
                    phoneNumber: user.phoneNumber,
                    roleName: roleNames,
                    totalItemsIssued,
                    itemsOverdue,
                    totalOverdueItems,
                    avgDaysOverdue,
                    lastIssuedDate: lastIssuedDate?.toISOString().split("T")[0],
                    joinDate: joinDate,
                    status: frontendStatus,
                };
            }
            catch (error) {
                console.error("Error processing user:", error);
                return null;
            }
        });
        const usersReport = await Promise.all(usersReportPromises);
        const result = usersReport.filter((item) => item !== null);
        console.log("Final users report count:", result.length);
        return result;
    }
    catch (error) {
        console.error("Error in getAllUsersReport:", error);
        throw new Error(`Failed to fetch users report: ${error.message}`);
    }
};
exports.getAllUsersReport = getAllUsersReport;
const exportAllUsersReport = async (filters) => {
    try {
        const usersReport = await (0, exports.getAllUsersReport)(filters);
        const headers = [
            "User Name",
            "Employee ID",
            "Email",
            "Phone Number",
            "Role",
            "Total Items Issued",
            "Overdue Items Count",
            "Total Overdue Items",
            "Average Days Overdue",
            "Last Issued Date",
            "Join Date",
            "Status",
        ];
        // Convert data to CSV rows
        const csvRows = usersReport.map((user) => [
            `"${user.userName}"`,
            `"${user.employeeId || "-"}"`,
            `"${user.userEmail}"`,
            `"${user.phoneNumber ? user.phoneNumber.slice(-4).padStart(10, "*") : "-"}"`,
            `"${user.roleName}"`,
            `"${user.totalItemsIssued}"`,
            `"${user.itemsOverdue}"`,
            `"${user.totalOverdueItems}"`,
            `"${user.avgDaysOverdue}"`,
            `"${user.lastIssuedDate || "-"}"`,
            `"${user.joinDate}"`,
            `"${user.status}"`,
        ]);
        const csvContent = [
            headers.join(","),
            ...csvRows.map((row) => row.join(",")),
        ].join("\n");
        return csvContent;
    }
    catch (error) {
        throw new Error(`Failed to export users report: ${error.message}`);
    }
};
exports.exportAllUsersReport = exportAllUsersReport;
