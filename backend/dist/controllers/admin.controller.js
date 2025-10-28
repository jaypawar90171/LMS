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
exports.getIssuedReportController = exports.getFinesReportController = exports.getInventoryReportController = exports.getIssuedItemsReportPDF = exports.getFinesReportPDF = exports.getInventoryReportPDF = exports.waiveFineController = exports.recordPaymentController = exports.deleteFinesController = exports.updateFineController = exports.createFinesController = exports.fetchUserFinesController = exports.getAllFinesController = exports.getCategoryByIdController = exports.deleteCategoryController = exports.updateCategoryController = exports.createCategoryController = exports.getCategoriesController = exports.deleteRequestedItemController = exports.rejectRequestedItemController = exports.approveRequestedItemController = exports.getAllRequestedItemsController = exports.returnItemController = exports.extendPeriodController = exports.rejectIssueRequestController = exports.approveIssueRequestController = exports.issueItemController = exports.getPendingIssueRequestsController = exports.deleteItemController = exports.updateItemController = exports.fetchSpecificItemController = exports.createInventoryItemsController = exports.fetchInventoryItemsController = exports.deleteRoleController = exports.updateRoleController = exports.createRoleController = exports.fetchRolesController = exports.deleteUserController = exports.forcePasswordResetController = exports.updateUserController = exports.getUserDetailsController = exports.createUserController = exports.getAllUsersController = exports.getDashboardSummaryController = exports.updateUserStatusController = exports.logoutController = exports.resetPasswordController = exports.verifyResetPasswordController = exports.forgotPassswordController = exports.loginController = void 0;
exports.exportAllUsersReportController = exports.getAllUsersReportController = exports.deleteNotificationController = exports.markAllAsReadController = exports.markAsReadController = exports.getNotificationsController = exports.exportDefaulterReportController = exports.sendReminderController = exports.getDefaulterReportController = exports.exportIssuedItemsController = exports.exportQueueAnalyticsController = exports.getQueueAnalyticsController = exports.getAllQueuesController = exports.fetchAllPermissionsController = exports.checkExpiredNotificationsController = exports.userResponseController = exports.processReturnController = exports.removeUserFromQueueController = exports.issueItemFromQueueController = exports.viewQueueController = exports.updateDonationStatusController = exports.getAllDonationsController = exports.getItemByScannedBarcodeController = exports.downloadBatchBarcodeController = exports.downloadBarcodeController = exports.generateBarcodeController = exports.updateAdminPasswordController = exports.resetPasswordAdminController = exports.updateAdminController = exports.getAdminProfileController = exports.updateNotificationTemplateController = exports.updateNotificationTemplate = exports.addNotoficationTemplateController = exports.getNotificationTemplatesController = exports.updateSystemRestrictionsController = exports.getSystemRestrictionsController = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const mongoose_1 = __importStar(require("mongoose"));
const auth_validation_1 = require("../validations/auth.validation");
const admin_service_1 = require("../services/admin.service");
const admin_service_2 = require("../services/admin.service");
const admin_service_3 = require("../services/admin.service");
const admin_service_4 = require("../services/admin.service");
const admin_service_5 = require("../services/admin.service");
const admin_service_6 = require("../services/admin.service");
const admin_service_7 = require("../services/admin.service");
const admin_service_8 = require("../services/admin.service");
const admin_service_9 = require("../services/admin.service");
const admin_service_10 = require("../services/admin.service");
const admin_service_11 = require("../services/admin.service");
const admin_service_12 = require("../services/admin.service");
const admin_service_13 = require("../services/admin.service");
const admin_service_14 = require("../services/admin.service");
const admin_service_15 = require("../services/admin.service");
const admin_service_16 = require("../services/admin.service");
const admin_service_17 = require("../services/admin.service");
const admin_service_18 = require("../services/admin.service");
const admin_service_19 = require("../services/admin.service");
const admin_service_20 = require("../services/admin.service");
const admin_service_21 = require("../services/admin.service");
const admin_service_22 = require("../services/admin.service");
const admin_service_23 = require("../services/admin.service");
const admin_service_24 = require("../services/admin.service");
const admin_service_25 = require("../services/admin.service");
const admin_service_26 = require("../services/admin.service");
const admin_service_27 = require("../services/admin.service");
const upload_1 = require("../config/upload");
const fs_1 = __importDefault(require("fs"));
const role_model_1 = __importDefault(require("../models/role.model"));
const emailService_1 = require("../config/emailService");
const permission_model_1 = require("../models/permission.model");
const fine_model_1 = __importDefault(require("../models/fine.model"));
const issuedItem_model_1 = __importDefault(require("../models/issuedItem.model"));
const itemRequest_model_1 = __importDefault(require("../models/itemRequest.model"));
const item_model_1 = __importDefault(require("../models/item.model"));
const queue_model_1 = __importDefault(require("../models/queue.model"));
const notificationService_1 = require("../utility/notificationService");
const pdfkit_1 = __importDefault(require("pdfkit"));
const bwip_js_1 = __importDefault(require("bwip-js"));
const loginController = async (req, res) => {
    try {
        const validatedData = auth_validation_1.loginSchema.parse(req.body);
        const user = await (0, admin_service_1.loginService)(validatedData);
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        return res.status(200).json(user);
    }
    catch (error) {
        if (error.name === "ZodError" && error.errors?.length) {
            const messages = error.errors.map((err) => err.message);
            return res.status(400).json({ errors: messages });
        }
        return res.status(error.statusCode || 500).json({
            error: error.message || "Internal server error",
        });
    }
};
exports.loginController = loginController;
const forgotPassswordController = async (req, res) => {
    try {
        const { email } = req.body;
        const link = await (0, admin_service_2.forgotPasswordService)(email);
        return res.status(200).json({ link: link });
    }
    catch (error) {
        console.error("Error during forgot password:", error);
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error." });
    }
};
exports.forgotPassswordController = forgotPassswordController;
const verifyResetPasswordController = async (req, res) => {
    try {
        const data = req.params;
        const result = await (0, admin_service_3.verifyResetPasswordService)(data);
        if (typeof result === "string") {
            return res
                .status(400)
                .json({ error: "Password reset link is invalid or expired." });
        }
        console.log("Verified user email:", result.email);
        res.render("index", { email: result.email, status: "Not Verified" });
    }
    catch (error) {
        console.error("Error during verifying reset-password link:", error);
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error." });
    }
};
exports.verifyResetPasswordController = verifyResetPasswordController;
const resetPasswordController = async (req, res) => {
    try {
        const { id, token } = req.params;
        const { newPassword, confirmPassword } = req.body;
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: "Passwords do not match." });
        }
        const result = await (0, admin_service_4.resetPasswordService)({
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
    }
    catch (error) {
        console.error("Error during resetting password:", error);
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error." });
    }
};
exports.resetPasswordController = resetPasswordController;
const logoutController = async (req, res) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    }
    catch (error) { }
};
exports.logoutController = logoutController;
const updateUserStatusController = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;
        if (!userId || !status) {
            return res.status(400).json({ message: "userId or status required" });
        }
        const updatedUser = await (0, admin_service_5.updateUserStatusService)(userId, status);
        return res.status(200).json({
            message: "User status updated successfully.",
            user: updatedUser,
        });
    }
    catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            error: error.message || "Internal server error.",
        });
    }
};
exports.updateUserStatusController = updateUserStatusController;
const getDashboardSummaryController = async (req, res) => {
    try {
        const { totalItems, activeUsers, overdueItems, categories, recentActivity, recentOrders, } = await (0, admin_service_6.getDashboardSummaryService)();
        return res.status(200).json({
            totalItems,
            activeUsers,
            overdueItems,
            categories,
            recentActivity,
            recentOrders,
        });
    }
    catch (error) {
        console.error("Error fetching dashboard summary:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};
exports.getDashboardSummaryController = getDashboardSummaryController;
const getAllUsersController = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { users, totalUsers } = await (0, admin_service_7.getAllUsersService)(page, limit);
        return res.status(200).json({
            message: "Users fetched successfully.",
            users: users,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit),
                totalUsers,
            },
        });
    }
    catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({
            error: "Internal server error.",
        });
    }
};
exports.getAllUsersController = getAllUsersController;
const createUserController = async (req, res) => {
    try {
        const { assignedRoles, permissions, relationshipType, employeeId, associatedEmployeeId, ...userData } = req.body;
        if (!userData.email || !userData.username) {
            return res.status(400).json({
                error: "Email and username are required",
            });
        }
        const existingUser = await user_model_1.default.findOne({
            $or: [{ email: userData.email }, { username: userData.username }],
        });
        if (existingUser) {
            return res.status(409).json({
                error: "User with this email or username already exists.",
            });
        }
        if (relationshipType === "Employee") {
            if (!employeeId) {
                return res.status(400).json({
                    error: "Employee ID is required for employees",
                });
            }
            userData.employeeId = employeeId;
            const existingEmployee = await user_model_1.default.findOne({ employeeId });
            if (existingEmployee) {
                return res.status(409).json({
                    error: "Employee ID already exists",
                });
            }
        }
        else if (relationshipType === "Family Member") {
            if (!associatedEmployeeId) {
                return res.status(400).json({
                    error: "Associated employee ID is required for family members",
                });
            }
            userData.associatedEmployeeId = associatedEmployeeId;
            const associatedEmployee = await user_model_1.default.findOne({
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
        let permissionsFromRoles = [];
        if (assignedRoles && assignedRoles.length > 0) {
            const roleDocs = await role_model_1.default.find({ _id: { $in: assignedRoles } });
            if (roleDocs.length !== assignedRoles.length) {
                return res.status(400).json({
                    error: "One or more invalid role IDs provided",
                });
            }
            userData.roles = assignedRoles;
            permissionsFromRoles = roleDocs.flatMap((role) => role.permissions || []);
        }
        let additionalPermissionIds = [];
        if (permissions && permissions.length > 0) {
            const permissionDocs = await permission_model_1.Permission.find({
                permissionKey: { $in: permissions },
            });
            if (permissionDocs.length !== permissions.length) {
                const foundKeys = permissionDocs.map((p) => p.permissionKey);
                const missingKeys = permissions.filter((key) => !foundKeys.includes(key));
                return res.status(400).json({
                    error: `Invalid permission keys: ${missingKeys.join(", ")}`,
                });
            }
            additionalPermissionIds = permissionDocs.map((p) => p._id);
        }
        const allPermissions = [
            ...new Set([...permissionsFromRoles, ...additionalPermissionIds]),
        ];
        userData.permissions = allPermissions;
        if (!userData.status) {
            userData.status = "Inactive";
        }
        // Set the flag to force a password change on first login
        userData.passwordResetRequired = true;
        const user = await user_model_1.default.create(userData);
        const populatedUser = await user_model_1.default.findById(user._id)
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
            <li style="margin-bottom: 10px;"><strong>Username:</strong> ${userData.username || "N/A"}</li>
            <li style="margin-bottom: 10px;"><strong>Temporary Password:</strong> <code style="background-color: #f4f4f4; padding: 3px 6px; border-radius: 4px; font-size: 1.1em;">${userData.password}</code></li>
          </ul>
          <p>For your security, you will be required to change this password after your first login.</p>
          <p>Thank you for joining us!</p>
        </div>
      `;
            await (0, emailService_1.sendEmail)(userData.email, subject, htmlBody);
            console.log("Welcome email sent successfully to:", userData.email);
        }
        catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
        }
        res.status(201).json({
            message: "User created successfully",
            user: populatedUser?.toObject() || user.toObject(),
        });
    }
    catch (error) {
        console.error("Error creating user:", error);
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(409).json({
                error: `User with this ${field} already exists`,
            });
        }
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map((err) => err.message);
            return res.status(400).json({
                error: errors.join(", "),
            });
        }
        res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to create user",
        });
    }
};
exports.createUserController = createUserController;
const getUserDetailsController = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ message: "User does not exists" });
        }
        const user = await (0, admin_service_8.getUserDetailsService)(userId);
        return res
            .status(200)
            .json({ message: "Data Found for the user", user: user });
    }
    catch (error) {
        console.log("Error in crearing new user");
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            error: error.message || "Internal server error.",
        });
    }
};
exports.getUserDetailsController = getUserDetailsController;
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
const updateUserController = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ message: "User does not exists" });
        }
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid userId" });
        }
        const { permissions, assignedRoles, relationshipType, employeeId, associatedEmployeeId, password, ...updateData } = req.body;
        console.log("Update request received for user:", userId);
        console.log("Update data:", updateData);
        console.log("Roles:", assignedRoles);
        console.log("Permissions:", permissions);
        const existingUser = await user_model_1.default.findById(userId);
        if (!existingUser) {
            return res.status(404).json({ error: "User not found" });
        }
        if (relationshipType === "Employee") {
            updateData.employeeId = employeeId;
            updateData.associatedEmployeeId = undefined;
        }
        else if (relationshipType === "Family Member") {
            updateData.associatedEmployeeId = associatedEmployeeId;
            updateData.employeeId = undefined;
        }
        if (relationshipType) {
            updateData.relationshipType = relationshipType;
        }
        if (assignedRoles && Array.isArray(assignedRoles)) {
            const validRoles = await role_model_1.default.find({ _id: { $in: assignedRoles } });
            if (validRoles.length !== assignedRoles.length) {
                return res.status(400).json({
                    error: "One or more invalid role IDs provided",
                });
            }
            updateData.roles = assignedRoles;
        }
        if (permissions && Array.isArray(permissions)) {
            const permissionDocs = await permission_model_1.Permission.find({
                permissionKey: { $in: permissions },
            });
            const permissionIds = permissionDocs.map((p) => p._id);
            let permissionsFromRoles = [];
            if (updateData.roles && updateData.roles.length > 0) {
                const roleDocs = await role_model_1.default.find({ _id: { $in: updateData.roles } });
                permissionsFromRoles = roleDocs.flatMap((role) => role.permissions || []);
            }
            const allPermissionIds = [...permissionsFromRoles, ...permissionIds];
            updateData.permissions = [
                ...new Set(allPermissionIds.map((id) => id.toString())),
            ];
        }
        console.log("Final update data:", updateData);
        const updatedUser = await user_model_1.default.findByIdAndUpdate(userId, { $set: updateData }, {
            new: true,
            runValidators: true,
            lean: true,
        })
            .populate("roles", "roleName description")
            .populate("permissions", "permissionKey description")
            .exec();
        if (!updatedUser) {
            return res.status(404).json({ error: "User not found after update" });
        }
        console.log("User updated successfully:", updatedUser._id);
        res.status(200).json({
            message: "User updated successfully",
            user: updatedUser,
        });
    }
    catch (error) {
        console.error("Error in updating user:", error);
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
exports.updateUserController = updateUserController;
const forcePasswordResetController = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid userId" });
        }
        if (!userId) {
            return res.status(400).json({ message: "user not found" });
        }
        const updatedUser = await (0, admin_service_9.forcePasswordResetService)(userId);
        return res.status(200).json({ message: "chnages made", user: updatedUser });
    }
    catch (error) {
        console.log("Error in updating user");
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            error: error.message || "Internal server error.",
        });
    }
};
exports.forcePasswordResetController = forcePasswordResetController;
const deleteUserController = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await (0, admin_service_1.deleteUserService)(userId);
        return res.status(200).json(result);
    }
    catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            error: error.message || "Internal server error.",
        });
    }
};
exports.deleteUserController = deleteUserController;
const fetchRolesController = async (req, res) => {
    try {
        const rolesWithPermissions = await (0, admin_service_10.fetchRolesService)();
        return res
            .status(200)
            .json({ message: "Roles Fetched", roles: rolesWithPermissions });
    }
    catch (error) {
        console.log("Error in fetching roles");
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            error: error.message || "Internal server error.",
        });
    }
};
exports.fetchRolesController = fetchRolesController;
const createRoleController = async (req, res) => {
    try {
        const validatedData = auth_validation_1.RoleSchema.parse(req.body);
        const { roleName, description, permissions } = validatedData;
        if (!roleName || !description || !permissions) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const newRole = await (0, admin_service_11.createRoleService)({
            roleName,
            description,
            permissions,
        });
        return res.status(200).json({ message: "Role created", role: newRole });
    }
    catch (error) {
        console.log("Error in creating roles");
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            error: error.message || "Internal server error.",
        });
    }
};
exports.createRoleController = createRoleController;
const updateRoleController = async (req, res) => {
    try {
        const { roleId } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(roleId)) {
            return res.status(400).json({ error: "Invalid userId" });
        }
        const validatedData = req.body;
        const updatedRole = await (0, admin_service_12.updateRoleService)({ roleId, ...validatedData });
        if (!updatedRole) {
            return res.status(404).json({ error: "Role not found." });
        }
        return res.status(200).json({
            message: "Role updated successfully",
            data: updatedRole,
        });
    }
    catch (error) {
        console.log("Error in updating role");
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            error: error.message || "Internal server error.",
        });
    }
};
exports.updateRoleController = updateRoleController;
const deleteRoleController = async (req, res) => {
    try {
        const { roleId } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(roleId)) {
            return res.status(400).json({ error: "Invalid userId" });
        }
        const { message, data } = await (0, admin_service_13.deleteRoleService)(roleId);
        return res.status(200).json({ message: message, data: data });
    }
    catch (error) {
        console.log("Error in updating role");
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            error: error.message || "Internal server error.",
        });
    }
};
exports.deleteRoleController = deleteRoleController;
const fetchInventoryItemsController = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    try {
        const { items, totalItems } = await (0, admin_service_27.fetchInventoryItemsService)(page, limit);
        return res.status(200).json({
            inventoryItems: items,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems,
            },
        });
    }
    catch (error) {
        console.error("Error in fetching inventory items:", error);
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            error: error.message || "Internal server error.",
        });
    }
};
exports.fetchInventoryItemsController = fetchInventoryItemsController;
const createInventoryItemsController = async (req, res) => {
    try {
        console.log("Received body:", req.body);
        console.log("Received file:", req.file);
        if (typeof req.body.features === "string") {
            try {
                req.body.features = JSON.parse(req.body.features);
            }
            catch (e) {
                req.body.features = req.body.features
                    .split(",")
                    .map((f) => f.trim())
                    .filter(Boolean);
            }
        }
        const numericFields = [
            "publicationYear",
            "price",
            "quantity",
            "availableCopies",
            "defaultReturnPeriod",
            "warrantyPeriod",
        ];
        numericFields.forEach((field) => {
            if (req.body[field] !== undefined && req.body[field] !== "") {
                req.body[field] = Number(req.body[field]);
            }
        });
        if (req.body.subcategoryId === "" ||
            req.body.subcategoryId === "no-subcategory") {
            delete req.body.subcategoryId;
        }
        const validatedData = auth_validation_1.InventoryItemsSchema.parse(req.body);
        const file = req.file;
        let mediaUrl;
        if (file) {
            const result = await (0, upload_1.uploadFile)(file.path);
            if (result) {
                mediaUrl = result.secure_url;
            }
            fs_1.default.unlinkSync(file.path);
        }
        const barcode = await (0, admin_service_1.generateBarcodeString)();
        const dataToSave = {
            ...validatedData,
            mediaUrl: mediaUrl,
            barcode: barcode,
        };
        const newItem = await (0, admin_service_14.createInventoryItemsService)(dataToSave);
        return res.status(201).json({
            message: "Inventory item created successfully",
            data: newItem,
        });
    }
    catch (error) {
        console.error("Error in createInventoryItemsController:", error);
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
exports.createInventoryItemsController = createInventoryItemsController;
const fetchSpecificItemController = async (req, res) => {
    try {
        const { itemId } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({ error: "Invalid itemId" });
        }
        const item = await (0, admin_service_15.fetchSpecificItemServive)(itemId);
        return res.status(200).json({ item: item });
    }
    catch (error) {
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
exports.fetchSpecificItemController = fetchSpecificItemController;
const updateItemController = async (req, res) => {
    try {
        const { itemId } = req.params;
        if (!itemId) {
            return res.status(400).json({ error: "Item not found" });
        }
        if (!mongoose_1.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({ error: "Invalid itemId" });
        }
        const processedData = { ...req.body };
        if (processedData.subcategoryId === "" ||
            processedData.subcategoryId === "no-subcategory") {
            delete processedData.subcategoryId;
        }
        if (typeof processedData.features === "string") {
            try {
                processedData.features = JSON.parse(processedData.features);
            }
            catch (e) {
                processedData.features = processedData.features
                    .split(",")
                    .map((f) => f.trim())
                    .filter(Boolean);
            }
        }
        const optionalFields = [
            "authorOrCreator",
            "description",
            "publisherOrManufacturer",
            "color",
            "dimensions",
            "usageType",
            "powerSource",
            "usage",
            "warrantyPeriod",
        ];
        optionalFields.forEach((field) => {
            if (processedData[field] === "") {
                processedData[field] = undefined;
            }
        });
        const numericFields = [
            "publicationYear",
            "price",
            "quantity",
            "availableCopies",
            "defaultReturnPeriod",
        ];
        numericFields.forEach((field) => {
            if (processedData[field] !== undefined && processedData[field] !== "") {
                processedData[field] = Number(processedData[field]);
            }
            else if (processedData[field] === "") {
                processedData[field] = undefined;
            }
        });
        const validatedData = auth_validation_1.InventoryItemsUpdateSchema.parse(processedData);
        const updatedItem = await (0, admin_service_16.updateItemService)({ itemId, validatedData });
        return res.status(200).json({
            message: "Inventory item updated successfully",
            data: updatedItem,
        });
    }
    catch (error) {
        console.error("Error in updateItemController:", error);
        if (error.name === "ZodError") {
            return res.status(400).json({
                message: "Validation error",
                errors: error.errors,
            });
        }
        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid data format",
                error: error.message,
            });
        }
        if (error.statusCode === 404) {
            return res.status(404).json({
                message: "No such item exists",
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
exports.updateItemController = updateItemController;
const deleteItemController = async (req, res) => {
    try {
        const { itemId } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({ error: "Invalid itemId" });
        }
        if (!itemId) {
            return res.status(400).json({ error: "Item not found" });
        }
        const deletedItem = await (0, admin_service_17.deleteItemService)(itemId);
        return res.status(200).json({
            message: "Inventory item deleted successfully",
            data: deletedItem,
        });
    }
    catch (error) {
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
exports.deleteItemController = deleteItemController;
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
    const defaultPeriod = defaultReturnPeriod || 14; // Default 14 days
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + defaultPeriod);
    return dueDate;
};
const getPendingIssueRequestsController = async (req, res) => {
    try {
        const requests = await itemRequest_model_1.default.find({ status: "pending" })
            .populate("userId", "fullName email employeeId")
            .populate("itemId", "title authorOrCreator availableCopies categoryId")
            .sort({ requestedAt: -1 });
        res.json({ requests });
    }
    catch (error) {
        console.error("Error fetching pending requests:", error);
        res.status(500).json({ message: "Error fetching pending requests" });
    }
};
exports.getPendingIssueRequestsController = getPendingIssueRequestsController;
const issueItemController = async (req, res) => {
    try {
        const { userId, itemId } = req.body;
        const adminId = req.user?.id;
        if (!mongoose_1.Types.ObjectId.isValid(userId) || !mongoose_1.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({ message: "Invalid user ID or item ID" });
        }
        // Check if user exists and is active
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Check user eligibility
        const eligibility = await checkUserEligibility(new mongoose_1.Types.ObjectId(userId));
        if (!eligibility.eligible) {
            return res.status(400).json({ message: eligibility.reason });
        }
        // Check if item exists and is available
        const item = await item_model_1.default.findById(itemId);
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
        const issuedItem = new issuedItem_model_1.default({
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
    }
    catch (error) {
        console.error("Error issuing item:", error);
        res.status(500).json({ message: "Error issuing item" });
    }
};
exports.issueItemController = issueItemController;
const approveIssueRequestController = async (req, res) => {
    try {
        const { requestId } = req.params;
        const adminId = req.user?.id;
        if (!mongoose_1.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({ message: "Invalid request ID" });
        }
        const issueRequest = await itemRequest_model_1.default.findById(requestId)
            .populate("userId")
            .populate("itemId");
        if (!issueRequest) {
            return res.status(404).json({ message: "Issue request not found" });
        }
        if (issueRequest.status !== "pending") {
            return res.status(400).json({ message: "Request already processed" });
        }
        const eligibility = await checkUserEligibility(issueRequest.userId._id);
        if (!eligibility.eligible) {
            return res.status(400).json({ message: eligibility.reason });
        }
        const item = await item_model_1.default.findById(issueRequest.itemId._id);
        if (!item || item.availableCopies <= 0) {
            return res.status(400).json({ message: "Item no longer available" });
        }
        const dueDate = calculateDueDate(item.defaultReturnPeriod);
        const issuedItem = new issuedItem_model_1.default({
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
                userName: issueRequest.userId.fullName,
                dueDate: issuedItem.dueDate,
            },
        });
    }
    catch (error) {
        console.error("Error approving issue request:", error);
        res.status(500).json({ message: "Error approving issue request" });
    }
};
exports.approveIssueRequestController = approveIssueRequestController;
const rejectIssueRequestController = async (req, res) => {
    try {
        const { requestId } = req.params;
        const adminId = req.user?.id;
        if (!mongoose_1.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({ message: "Invalid request ID" });
        }
        const issueRequest = await itemRequest_model_1.default.findById(requestId);
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
    }
    catch (error) {
        console.error("Error rejecting issue request:", error);
        res.status(500).json({ message: "Error rejecting issue request" });
    }
};
exports.rejectIssueRequestController = rejectIssueRequestController;
const extendPeriodController = async (req, res) => {
    try {
        const { issuedItemId } = req.params;
        const { extensionDays } = req.body;
        if (!issuedItemId) {
            return res.status(400).json({
                success: false,
                message: "Issued item ID is required",
            });
        }
        if (!extensionDays ||
            typeof extensionDays !== "number" ||
            extensionDays <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid extension days (positive number) is required",
            });
        }
        const result = await (0, admin_service_1.extendPeriodService)(issuedItemId, extensionDays);
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
    }
    catch (error) {
        console.error("Error in extend period controller:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.extendPeriodController = extendPeriodController;
const returnItemController = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { itemId } = req.params;
        const { condition } = req.body;
        if (!itemId || !userId || !condition) {
            return res.status(400).json({
                success: false,
                message: "itemId, userId, and condition are required.",
            });
        }
        const validConditions = ["Good", "Lost", "Damaged"];
        if (!validConditions.includes(condition)) {
            return res.status(400).json({
                success: false,
                message: "Invalid condition. Must be 'Good', 'Lost', or 'Damaged'.",
            });
        }
        const result = await (0, admin_service_1.returnItemService)(itemId, userId, condition);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Error processing item return.",
        });
    }
};
exports.returnItemController = returnItemController;
const getAllRequestedItemsController = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, category, sortBy = "requestedAt", sortOrder = "desc", } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({
                success: false,
                message: "Page must be a positive number",
            });
        }
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                success: false,
                message: "Limit must be between 1 and 100",
            });
        }
        if (status &&
            !["pending", "approved", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be one of: pending, approved, rejected",
            });
        }
        if (sortOrder && !["asc", "desc"].includes(sortOrder)) {
            return res.status(400).json({
                success: false,
                message: "Sort order must be 'asc' or 'desc'",
            });
        }
        const result = await (0, admin_service_1.getAllRequestedItemsService)({
            page: pageNum,
            limit: limitNum,
            status: status,
            category: category,
            sortBy: sortBy,
            sortOrder: sortOrder,
        });
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
            });
        }
        res.status(200).json({
            success: true,
            message: "Item requests fetched successfully",
            data: result.data,
        });
    }
    catch (error) {
        console.error("Error fetching item requests:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.getAllRequestedItemsController = getAllRequestedItemsController;
const approveRequestedItemController = async (req, res) => {
    try {
        const { requestId } = req.params;
        const adminId = req.user?.id;
        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: "Request ID is required",
            });
        }
        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Admin ID not found",
            });
        }
        const result = await (0, admin_service_1.approveRequestedItemService)(requestId, adminId.toString());
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
            });
        }
        res.status(200).json({
            success: true,
            message: "Item request approved successfully",
            data: result.data,
        });
    }
    catch (error) {
        console.error("Error approving item request:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.approveRequestedItemController = approveRequestedItemController;
const rejectRequestedItemController = async (req, res) => {
    try {
        const { requestId } = req.params;
        const adminId = req.user?.id;
        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: "Request ID is required",
            });
        }
        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Admin ID not found",
            });
        }
        const result = await (0, admin_service_1.rejectRequestedItemService)(requestId, adminId.toString());
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
            });
        }
        res.status(200).json({
            success: true,
            message: "Item request rejected successfully",
            data: result.data,
        });
    }
    catch (error) {
        console.error("Error rejecting item request:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.rejectRequestedItemController = rejectRequestedItemController;
const deleteRequestedItemController = async (req, res) => {
    try {
        const { requestId } = req.params;
        const adminId = req.user?.id;
        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: "Request ID is required",
            });
        }
        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Admin ID not found",
            });
        }
        const result = await (0, admin_service_1.deleteRequestedItemService)(requestId);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
            });
        }
        res.status(200).json({
            success: true,
            message: "Item request deleted successfully",
            data: result.data,
        });
    }
    catch (error) {
        console.error("Error deleting item request:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
exports.deleteRequestedItemController = deleteRequestedItemController;
const getCategoriesController = async (req, res) => {
    try {
        const { tree } = req.query;
        const includeTree = tree === "true";
        const categories = await (0, admin_service_18.getCategoriesService)(includeTree);
        return res.status(200).json({
            message: "Categories fetched successfully",
            data: categories,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error.message || "Internal Server Error",
        });
    }
};
exports.getCategoriesController = getCategoriesController;
const createCategoryController = async (req, res) => {
    try {
        const validatedData = auth_validation_1.CategorySchema.parse(req.body);
        const category = await (0, admin_service_19.createCategoryService)(validatedData);
        return res
            .status(200)
            .json({ message: "Category created successfully", category: category });
    }
    catch (error) {
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
exports.createCategoryController = createCategoryController;
const updateCategoryController = async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = auth_validation_1.CategorySchema.partial().parse(req.body);
        const category = await (0, admin_service_20.updateCategoryService)(id, validatedData);
        return res.status(200).json({
            message: "Category updated successfully",
            category: category,
        });
    }
    catch (error) {
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
exports.updateCategoryController = updateCategoryController;
const deleteCategoryController = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await (0, admin_service_21.deleteCategoryService)(id);
        return res.status(200).json(result);
    }
    catch (error) {
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
exports.deleteCategoryController = deleteCategoryController;
const getCategoryByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await (0, admin_service_1.getCategoryByIdService)(id);
        return res.status(200).json({
            message: "Category fetched successfully",
            data: category,
        });
    }
    catch (error) {
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
exports.getCategoryByIdController = getCategoryByIdController;
const getAllFinesController = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    try {
        const { fines, totalItems } = await (0, admin_service_22.getAllFinesService)(page, limit);
        return res.status(200).json({
            message: "Fines fetched successfully",
            fines,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems,
            },
        });
    }
    catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ message: error.message });
        }
        return res.status(500).json({
            message: error.message || "Internal Server Error",
        });
    }
};
exports.getAllFinesController = getAllFinesController;
const fetchUserFinesController = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(404).json({ error: "User not found" });
        }
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid userId" });
        }
        const fines = await (0, admin_service_24.fetchUserFinesService)(userId);
        return res.status(200).json({ fines: fines });
    }
    catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ error: error.message });
        }
        return res.status(500).json({
            error: error.message || "Internal Server Error",
        });
    }
};
exports.fetchUserFinesController = fetchUserFinesController;
const createFinesController = async (req, res) => {
    try {
        const adminId = req.user.id;
        const validatedData = auth_validation_1.FineSchema.parse(req.body);
        const { userId, itemId, reason, amountIncurred, amountPaid, paymentDetails = [], } = validatedData;
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid userId" });
        }
        if (!mongoose_1.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({ error: "Invalid itemId" });
        }
        const fine = await (0, admin_service_23.createFineService)({
            userId,
            itemId,
            reason,
            amountIncurred,
            amountPaid,
            paymentDetails,
            managedByAdminId: adminId,
        });
        return res.status(201).json({
            message: "Fine created successfully",
            fine,
        });
    }
    catch (error) {
        if (error.name === "ZodError") {
            return res.status(400).json({
                error: "Validation error",
                errors: error.errors,
            });
        }
        return res.status(500).json({
            error: error.message || "Internal Server Error",
        });
    }
};
exports.createFinesController = createFinesController;
const updateFineController = async (req, res) => {
    try {
        const { fineId } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(fineId)) {
            return res.status(400).json({ error: "Invalid fineId" });
        }
        const validatedData = auth_validation_1.FineUpdateSchema.parse(req.body);
        const updatedFine = await (0, admin_service_1.updateFineService)({
            fineId,
            data: validatedData,
        });
        return res.status(200).json({
            message: "Fine updated successfully",
            fine: updatedFine,
        });
    }
    catch (error) {
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
exports.updateFineController = updateFineController;
const deleteFinesController = async (req, res) => {
    try {
        const { fineId } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(fineId)) {
            return res.status(400).json({ error: "Invalid fineId" });
        }
        const message = await (0, admin_service_1.deleteFineService)(fineId);
        return res.status(200).json({ msg: message });
    }
    catch (error) {
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
exports.deleteFinesController = deleteFinesController;
const recordPaymentController = async (req, res) => {
    try {
        const { fineId } = req.params;
        const { amountPaid, paymentMethod, referenceId, notes } = req.body;
        if (!mongoose_1.Types.ObjectId.isValid(fineId)) {
            return res.status(400).json({ error: "Invalid fineId" });
        }
        const fine = await fine_model_1.default.findById(fineId);
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
        const updatedFine = await (0, admin_service_1.recordPaymentService)({
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
    }
    catch (error) {
        return res.status(500).json({
            message: error.message || "Internal Server Error",
        });
    }
};
exports.recordPaymentController = recordPaymentController;
const waiveFineController = async (req, res) => {
    try {
        const { fineId } = req.params;
        const { waiverReason } = req.body;
        if (!mongoose_1.Types.ObjectId.isValid(fineId)) {
            return res.status(400).json({ error: "Invalid fineId" });
        }
        if (!waiverReason) {
            return res.status(400).json({ message: "Waiver reason is required" });
        }
        const fine = await fine_model_1.default.findById(fineId);
        if (!fine) {
            return res.status(404).json({ message: "Fine not found" });
        }
        if (fine.status !== "Outstanding") {
            return res
                .status(400)
                .json({ message: "Can only waive outstanding fines" });
        }
        const updatedFine = await (0, admin_service_1.waiveFineService)({
            fineId,
            waiverReason,
            managedByAdminId: req.user?.id,
        });
        return res.status(200).json({
            message: "Fine waived successfully",
            fine: updatedFine,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error.message || "Internal Server Error",
        });
    }
};
exports.waiveFineController = waiveFineController;
const getInventoryReportPDF = async (req, res) => {
    try {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=inventory-report.pdf");
        await (0, admin_service_25.generateInventoryReportPDF)(res);
    }
    catch (error) {
        console.error("Error generating PDF:", error.message);
        res
            .status(500)
            .json({ message: "Failed to generate PDF", error: error.message });
    }
};
exports.getInventoryReportPDF = getInventoryReportPDF;
const getFinesReportPDF = async (req, res) => {
    try {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=fines-report.pdf");
        await (0, admin_service_26.generateFinesReportPDF)(res);
    }
    catch (error) {
        console.error("Error generating PDF:", error.message);
        res
            .status(500)
            .json({ message: "Failed to generate PDF", error: error.message });
    }
};
exports.getFinesReportPDF = getFinesReportPDF;
const getIssuedItemsReportPDF = async (req, res) => {
    try {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=issuedItems-report.pdf");
        await (0, admin_service_1.generateIssuedItemsReportPDF)(res);
    }
    catch (error) {
        console.error("Error generating PDF:", error.message);
        res
            .status(500)
            .json({ message: "Failed to generate PDF", error: error.message });
    }
};
exports.getIssuedItemsReportPDF = getIssuedItemsReportPDF;
const getInventoryReportController = async (req, res) => {
    try {
        const report = await (0, admin_service_1.getInventoryReportService)();
        res.status(200).json({ report });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch inventory report",
            error: error.message,
        });
    }
};
exports.getInventoryReportController = getInventoryReportController;
const getFinesReportController = async (req, res) => {
    try {
        const report = await (0, admin_service_1.getFinesReportService)();
        res.status(200).json(report);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Failed to fetch fines report", error: error.message });
    }
};
exports.getFinesReportController = getFinesReportController;
const getIssuedReportController = async (req, res) => {
    try {
        const report = await (0, admin_service_1.getIssuedReportService)();
        res.status(200).json({ report });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Failed to fetch issued report", error: error.message });
    }
};
exports.getIssuedReportController = getIssuedReportController;
const getSystemRestrictionsController = async (req, res) => {
    try {
        const restrictions = await (0, admin_service_1.getSystemRestrictionsService)();
        res.status(200).json({
            message: "System restrictions fetched successfully",
            data: restrictions,
        });
    }
    catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || "Failed to fetch system restrictions",
        });
    }
};
exports.getSystemRestrictionsController = getSystemRestrictionsController;
const updateSystemRestrictionsController = async (req, res) => {
    try {
        const updateData = auth_validation_1.SystemRestrictionsUpdateSchema.parse(req.body);
        if (!updateData || Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No fields provided for update",
            });
        }
        const updatedSettings = await (0, admin_service_1.updateSystemRestrictionsService)(updateData);
        res.status(200).json({
            success: true,
            message: "System restrictions updated successfully",
            data: updatedSettings,
        });
    }
    catch (error) {
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
exports.updateSystemRestrictionsController = updateSystemRestrictionsController;
const getNotificationTemplatesController = async (req, res) => {
    try {
        const templates = await (0, admin_service_1.getNotificationTemplatesService)();
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching notification templates",
            error: error.message,
        });
    }
};
exports.getNotificationTemplatesController = getNotificationTemplatesController;
const addNotoficationTemplateController = async (req, res) => {
    try {
        const { key, emailSubject, emailBody, whatsappMessage } = req.body;
        if (!key || !emailSubject || !emailBody || !whatsappMessage) {
            return res
                .status(400)
                .json({ success: false, message: "All fields required" });
        }
        const updated = await (0, admin_service_1.addTemplateService)(key, {
            emailSubject,
            emailBody,
            whatsappMessage,
        });
        res.json({ success: true, data: updated });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error in adding notification templates",
            error: error.message,
        });
    }
};
exports.addNotoficationTemplateController = addNotoficationTemplateController;
const updateNotificationTemplate = async (req, res) => {
    const { key } = req.params;
    const { emailSubject, emailBody, whatsappMessage } = req.body;
    const updated = await (0, admin_service_1.updateTemplateService)(key, {
        emailSubject,
        emailBody,
        whatsappMessage,
    });
    res.json({ success: true, data: updated });
};
exports.updateNotificationTemplate = updateNotificationTemplate;
const updateNotificationTemplateController = async (req, res) => {
    try {
        const { templateKey } = req.params;
        const updateData = req.body;
        if (!templateKey) {
            return res.status(400).json({ message: "Template key is required" });
        }
        const updatedTemplate = await (0, admin_service_1.updateNotificationTemplateService)({
            templateKey,
            data: updateData,
        });
        return res.status(200).json({
            success: true,
            message: "Notification template updated successfully",
            template: updatedTemplate,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update notification template",
        });
    }
};
exports.updateNotificationTemplateController = updateNotificationTemplateController;
const getAdminProfileController = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res
                .status(401)
                .json({ message: "Unauthorized: Admin not logged in" });
        }
        const adminProfile = await (0, admin_service_1.getAdminProfileService)(userId);
        return res.status(200).json({
            success: true,
            message: "Admin profile fetched successfully",
            data: adminProfile,
        });
    }
    catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to fetch profile",
        });
    }
};
exports.getAdminProfileController = getAdminProfileController;
const updateAdminController = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid userId" });
        }
        const updateData = { ...req.body };
        if (req.file) {
            const result = await (0, upload_1.uploadFile)(req.file.path);
            if (result) {
                updateData.profile = result.secure_url;
            }
            fs_1.default.unlinkSync(req.file.path);
        }
        const updatedUser = await user_model_1.default.findByIdAndUpdate(userId, { $set: updateData }, { new: true, runValidators: true });
        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser.toObject(),
        });
    }
    catch (error) {
        console.log(error.message);
        console.log("Error in updating user");
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            error: error.message || "Internal server error.",
        });
    }
};
exports.updateAdminController = updateAdminController;
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
const resetPasswordAdminController = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid userId" });
        }
        const user = await (0, admin_service_1.resetPasswordAdminService)(userId);
        return res.status(200).json({
            success: true,
            message: "Admin avatar updated successfully",
            data: user,
        });
    }
    catch (error) {
        console.log("Error in reset password request");
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            error: error.message || "Internal server error.",
        });
    }
};
exports.resetPasswordAdminController = resetPasswordAdminController;
const updateAdminPasswordController = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid userId" });
        }
        const validatedData = auth_validation_1.updateUserSchema.parse(req.body);
        const user = await (0, admin_service_1.updateAdminPasswordServive)({
            userId,
            password: validatedData.password,
        });
        return res.status(200).json({
            success: true,
            message: "Admin password updated successfully",
            data: user,
        });
    }
    catch (error) {
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
exports.updateAdminPasswordController = updateAdminPasswordController;
const generateBarcodeController = async (req, res) => {
    try {
        const barcodeString = await (0, admin_service_1.generateBarcodeString)();
        return res.status(200).json({ barcode: barcodeString });
    }
    catch (error) {
        console.log("Error in barcode generation");
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            error: error.message || "Internal server error.",
        });
    }
};
exports.generateBarcodeController = generateBarcodeController;
const downloadBarcodeController = async (req, res) => {
    try {
        const { itemId } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({ error: "Invalid itemId" });
        }
        if (!itemId) {
            return res.status(400).json({ message: "Barcode value is required" });
        }
        await (0, admin_service_1.generateBarcodePDF)(itemId, res);
    }
    catch (error) {
        console.log("Error in barcode generation");
        if (!res.headersSent) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                error: error.message || "Internal server error.",
            });
        }
    }
};
exports.downloadBarcodeController = downloadBarcodeController;
const downloadBatchBarcodeController = async (req, res) => {
    try {
        const { itemId } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({ error: "Invalid itemId" });
        }
        const item = await item_model_1.default.findById(itemId);
        if (!item) {
            return res.status(404).json({ error: "Item not found" });
        }
        const baseBarcode = item.barcode;
        const quantity = item.quantity;
        const doc = new pdfkit_1.default();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=barcodes-${baseBarcode}.pdf`);
        doc.pipe(res);
        doc.fontSize(20).text(`Barcodes for: ${item.title}`, { align: "center" });
        doc.fontSize(14).text(`(Base Code: ${baseBarcode})`, { align: "center" });
        doc.moveDown(2);
        for (let i = 1; i <= quantity; i++) {
            const copyBarcodeValue = `${baseBarcode}-${i}`;
            const pngBuffer = await bwip_js_1.default.toBuffer({
                bcid: "code128",
                text: copyBarcodeValue,
                scale: 3,
                height: 10,
                includetext: true,
                textxalign: "center",
            });
            doc.image(pngBuffer, {
                fit: [250, 100],
                align: "center",
            });
            doc.moveDown(1);
            if (i < quantity) {
                doc.addPage();
            }
        }
        doc.end();
    }
    catch (error) {
        console.log("Error in batch barcode generation", error);
        if (!res.headersSent) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({
                error: error.message || "Internal server error.",
            });
        }
    }
};
exports.downloadBatchBarcodeController = downloadBatchBarcodeController;
const getItemByScannedBarcodeController = async (req, res) => {
    try {
        const { scannedCode } = req.params;
        const baseCode = scannedCode.replace(/-\d+$/, "");
        if (!baseCode) {
            return res.status(400).json({ error: "Invalid barcode format" });
        }
        const item = await item_model_1.default.findOne({ barcode: baseCode }).populate("categoryId", "name description parentCategoryId");
        if (!item) {
            return res.status(404).json({ error: "No item found with this barcode" });
        }
        const issuedItem = await issuedItem_model_1.default.findOne({
            itemId: item._id,
            status: "Issued",
        })
            .populate("userId", "name email")
            .populate("issuedBy", "name email")
            .populate("returnedTo", "name email")
            .populate("fineId");
        const responseData = {
            item: item.toObject(),
            issuedInfo: issuedItem
                ? {
                    issuedDate: issuedItem.issuedDate,
                    dueDate: issuedItem.dueDate,
                    issuedBy: issuedItem.issuedBy,
                    userId: issuedItem.userId,
                    returnedTo: issuedItem.returnedTo,
                    returnDate: issuedItem.returnDate,
                    status: issuedItem.status,
                    extensionCount: issuedItem.extensionCount,
                    maxExtensionAllowed: issuedItem.maxExtensionAllowed,
                    fineId: issuedItem.fineId,
                    isOverdue: issuedItem.dueDate
                        ? new Date() > issuedItem.dueDate
                        : false,
                }
                : null,
        };
        return res.status(200).json(responseData);
    }
    catch (error) {
        console.log("Error in barcode lookup", error);
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            error: error.message || "Internal server error.",
        });
    }
};
exports.getItemByScannedBarcodeController = getItemByScannedBarcodeController;
const getAllDonationsController = async (req, res) => {
    try {
        const donations = await (0, admin_service_1.getAllDonationService)();
        return res.status(200).json({
            success: true,
            message: "Donations fetched successfully",
            data: donations,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: error.message || "Internal Server Error",
        });
    }
};
exports.getAllDonationsController = getAllDonationsController;
const updateDonationStatusController = async (req, res) => {
    try {
        const { donationId } = req.params;
        const { status } = req.body;
        if (!["Accepted", "Rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }
        const updatedDonation = await (0, admin_service_1.updateDonationStatusService)(donationId, status);
        return res.status(200).json({
            success: true,
            message: `Donation ${status} successfully`,
            donation: updatedDonation,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: error.message || "Error updating donation status" });
    }
};
exports.updateDonationStatusController = updateDonationStatusController;
const viewQueueController = async (req, res) => {
    try {
        const { itemId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({ message: "Invalid itemId" });
        }
        const queue = await (0, admin_service_1.viewQueueService)(itemId);
        return res.status(200).json({
            success: true,
            message: "Queue fetched successfully",
            donation: queue,
        });
    }
    catch (error) {
        console.error("Error in viewQueueController:", error);
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error" });
    }
};
exports.viewQueueController = viewQueueController;
const issueItemFromQueueController = async (req, res) => {
    try {
        const adminId = req.user._id;
        const { queueId } = req.params;
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: "User ID is required." });
        }
        const issuedItem = await (0, admin_service_1.issueItemFromQueueService)(queueId, userId, adminId);
        return res.status(200).json({
            success: true,
            message: "Item issued for the queue member successfully",
            donation: issuedItem,
        });
    }
    catch (error) {
        console.error("Error in issueItemFromQueueController:", error);
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error" });
    }
};
exports.issueItemFromQueueController = issueItemFromQueueController;
const removeUserFromQueueController = async (req, res) => {
    try {
        const { queueId } = req.params;
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: "User ID is required." });
        }
        const result = await (0, admin_service_1.removeUserFromQueueService)(queueId, userId);
        return res.status(200).json({
            success: true,
            message: result,
        });
    }
    catch (error) {
        console.error("Error in removeUserFromQueueController:", error);
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error" });
    }
};
exports.removeUserFromQueueController = removeUserFromQueueController;
const processReturnController = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { itemId } = req.params;
        const status = req.body;
        if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Valid userId is required",
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({ message: "Invalid itemId" });
        }
        const result = await (0, admin_service_1.processItemReturn)(itemId);
        return res.status(200).json({
            success: true,
            message: result.message,
            data: result,
        });
    }
    catch (error) {
        console.error("Error in processReturnController:", error);
        return res
            .status(500)
            .json({ error: error.message || "Internal server error" });
    }
};
exports.processReturnController = processReturnController;
const userResponseController = async (req, res) => {
    try {
        const userId = req.user._id;
        const { itemId } = req.params;
        const { accept } = req.body;
        if (typeof accept !== "boolean") {
            return res
                .status(400)
                .json({ message: "Accept field is required and must be boolean" });
        }
        const result = await (0, admin_service_1.handleUserResponse)(userId.toString(), itemId, accept);
        return res.status(200).json({
            success: true,
            message: result.message,
            data: result,
        });
    }
    catch (error) {
        console.error("Error in userResponseController:", error);
        return res
            .status(500)
            .json({ error: error.message || "Internal server error" });
    }
};
exports.userResponseController = userResponseController;
const checkExpiredNotificationsController = async (req, res) => {
    try {
        await (0, admin_service_1.checkExpiredNotifications)();
        return res.status(200).json({
            success: true,
            message: "Expired notifications processed successfully",
        });
    }
    catch (error) {
        console.error("Error in checkExpiredNotificationsController:", error);
        return res
            .status(500)
            .json({ error: error.message || "Internal server error" });
    }
};
exports.checkExpiredNotificationsController = checkExpiredNotificationsController;
const fetchAllPermissionsController = async (req, res) => {
    try {
        const permissions = await (0, admin_service_1.fetchAllPermissionsService)();
        console.log("Permissions fetched successfully");
        return res.status(200).json({
            message: "Permissions fetched successfully",
            data: permissions,
        });
    }
    catch (error) {
        console.log("Error in fetching permissions");
        const statusCode = error.statusCode || 500;
        const message = error.message || "Internal server error";
        return res.status(statusCode).json({
            error: message,
        });
    }
};
exports.fetchAllPermissionsController = fetchAllPermissionsController;
const getAllQueuesController = async (req, res) => {
    try {
        const queues = await queue_model_1.default.find()
            .populate("itemId", "title status availableCopies categoryId")
            .populate("queueMembers.userId", "fullName email")
            .populate("currentNotifiedUser", "fullName")
            .sort({ updatedAt: -1 });
        return res.status(200).json({
            success: true,
            message: "All queues fetched successfully",
            data: queues,
        });
    }
    catch (error) {
        console.error("Error in getAllQueuesController:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};
exports.getAllQueuesController = getAllQueuesController;
const getQueueAnalyticsController = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const analytics = await (0, admin_service_1.getQueueAnalytics)(start, end);
        return res.status(200).json({
            success: true,
            message: "Analytics fetched successfully",
            data: analytics,
        });
    }
    catch (error) {
        console.error("Error in getQueueAnalyticsController:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};
exports.getQueueAnalyticsController = getQueueAnalyticsController;
const exportQueueAnalyticsController = async (req, res) => {
    try {
        const csvData = await (0, admin_service_1.exportQueueAnalytics)();
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=queue-analytics.csv");
        return res.send(csvData);
    }
    catch (error) {
        console.error("Error in exportQueueAnalyticsController:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};
exports.exportQueueAnalyticsController = exportQueueAnalyticsController;
const exportIssuedItemsController = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const csvData = await (0, admin_service_1.exportIssuedItemsReport)(startDate, endDate);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=issued-items-${new Date().toISOString().split("T")[0]}.csv`);
        return res.send(csvData);
    }
    catch (error) {
        console.error("Error in exportIssuedItemsController:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};
exports.exportIssuedItemsController = exportIssuedItemsController;
const getDefaulterReportController = async (req, res) => {
    try {
        const { overdueSince, categoryId, roleId } = req.query;
        console.log("Defaulters request received:", {
            overdueSince,
            categoryId,
            roleId,
        });
        const filters = {
            overdueSince: overdueSince,
            categoryId: categoryId,
            roleId: roleId,
        };
        const defaulters = await (0, admin_service_1.getDefaulterReport)(filters);
        return res.status(200).json({
            success: true,
            data: defaulters,
        });
    }
    catch (error) {
        console.error("Error in getDefaulterReportController:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};
exports.getDefaulterReportController = getDefaulterReportController;
const sendReminderController = async (req, res) => {
    try {
        const { issuedItemId, userId, itemId } = req.body;
        const result = await (0, admin_service_1.sendReminderService)(issuedItemId, userId, itemId);
        return res.status(200).json({
            success: true,
            message: "Reminder sent successfully",
            data: result,
        });
    }
    catch (error) {
        console.error("Error in sendReminderController:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to send reminder",
        });
    }
};
exports.sendReminderController = sendReminderController;
const exportDefaulterReportController = async (req, res) => {
    try {
        const { overdueSince, categoryId, roleId } = req.query;
        const filters = {
            overdueSince: overdueSince,
            categoryId: categoryId,
            roleId: roleId,
        };
        const csvData = await (0, admin_service_1.exportDefaulterReport)(filters);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=defaulter-report-${new Date().toISOString().split("T")[0]}.csv`);
        return res.send(csvData);
    }
    catch (error) {
        console.error("Error in exportDefaulterReportController:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};
exports.exportDefaulterReportController = exportDefaulterReportController;
const getNotificationsController = async (req, res) => {
    try {
        const { startDate, endDate, type, level, read, page = 1, limit = 20, } = req.query;
        const filters = {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            type: type,
            level: level,
            read: read !== undefined ? read === "true" : undefined,
            page: parseInt(page),
            limit: parseInt(limit),
        };
        const result = await notificationService_1.NotificationService.getAdminNotifications(filters);
        return res.status(200).json({
            success: true,
            data: result.notifications,
            pagination: result.pagination,
        });
    }
    catch (error) {
        console.error("Error in getNotificationsController:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};
exports.getNotificationsController = getNotificationsController;
const markAsReadController = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const notification = await notificationService_1.NotificationService.markAsRead(notificationId);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: notification,
        });
    }
    catch (error) {
        console.error("Error in markAsReadController:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};
exports.markAsReadController = markAsReadController;
const markAllAsReadController = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await notificationService_1.NotificationService.markAllAsRead(userId);
        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
            data: { modifiedCount: result.modifiedCount },
        });
    }
    catch (error) {
        console.error("Error in markAllAsReadController:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};
exports.markAllAsReadController = markAllAsReadController;
const deleteNotificationController = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const notification = await notificationService_1.NotificationService.deleteNotification(notificationId);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Notification deleted successfully",
        });
    }
    catch (error) {
        console.error("Error in deleteNotificationController:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};
exports.deleteNotificationController = deleteNotificationController;
const getAllUsersReportController = async (req, res) => {
    try {
        const { roleId, status, hasOverdue } = req.query;
        const filters = {
            roleId: roleId,
            status: status,
            hasOverdue: hasOverdue,
        };
        const usersReport = await (0, admin_service_1.getAllUsersReport)(filters);
        return res.status(200).json({
            success: true,
            data: usersReport,
        });
    }
    catch (error) {
        console.error("Error in getAllUsersReportController:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};
exports.getAllUsersReportController = getAllUsersReportController;
const exportAllUsersReportController = async (req, res) => {
    try {
        const { roleId, status, hasOverdue } = req.query;
        const filters = {
            roleId: roleId,
            status: status,
            hasOverdue: hasOverdue,
        };
        const csvData = await (0, admin_service_1.exportAllUsersReport)(filters);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=all-users-report-${new Date().toISOString().split("T")[0]}.csv`);
        return res.send(csvData);
    }
    catch (error) {
        console.error("Error in exportAllUsersReportController:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};
exports.exportAllUsersReportController = exportAllUsersReportController;
