"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotificationController = exports.markAsReadController = exports.getUserNotificationController = exports.uploadPhotoController = exports.withdrawDonationController = exports.getDonationDetailsController = exports.getMyDonationsController = exports.expressDonationInterestController = exports.updatePasswordController = exports.updateProfilePictureController = exports.updateNotificationPreferenceController = exports.updateProfileController = exports.getProfileDetailsController = exports.getAllFinesController = exports.getMyIssueRequestsController = exports.createIssueRequestController = exports.getHistoryController = exports.getNewArrivalsController = exports.deleteRequestedItemController = exports.getNewSpecificRequestedItemController = exports.getNewRequestedItemController = exports.requestNewItemController = exports.returnItemRequestController = exports.extendIssuedItemController = exports.searchItemsController = exports.withdrawFromQueueController = exports.getQueueItemController = exports.getQueuedItemsController = exports.requestItemController = exports.getRequestedItemsController = exports.getItemController = exports.getCategoryItemsController = exports.getCategoriesController = exports.getIssuedItemsController = exports.dashboardSummaryController = exports.logoutController = exports.resetPasswordController = exports.verifyResetPasswordController = exports.forgotPassswordController = exports.loginUserController = exports.registerUserController = void 0;
const user_service_1 = require("../services/user.service");
const auth_validation_1 = require("../validations/auth.validation");
const auth_validation_2 = require("../validations/auth.validation");
const user_service_2 = require("../services/user.service");
const user_service_3 = require("../services/user.service");
const user_service_4 = require("../services/user.service");
const user_service_5 = require("../services/user.service");
const mongoose_1 = require("mongoose");
const item_model_1 = __importDefault(require("../models/item.model"));
const upload_1 = require("../config/upload");
const fs_1 = __importDefault(require("fs"));
const donation_model_1 = __importDefault(require("../models/donation.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const registerUserController = async (req, res) => {
    try {
        const validatedData = auth_validation_1.registrationSchema.parse(req.body);
        const user = await (0, user_service_1.registerUserService)(validatedData);
        return res.status(201).json({
            message: "Registration successful. Your account is pending admin approval.",
            userId: user._id,
        });
    }
    catch (error) {
        console.error("Error during user registration:", error);
        if (error.name === "ZodError") {
            return res.status(400).json({
                error: "Validation failed",
                details: error.errors,
            });
        }
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error." });
    }
};
exports.registerUserController = registerUserController;
const loginUserController = async (req, res) => {
    try {
        const validatedData = auth_validation_2.loginSchema.parse(req.body);
        const result = await (0, user_service_2.loginUserService)(validatedData);
        if (result.passwordChangeRequired) {
            return res.status(201).json({
                message: result.message,
                passwordChangeRequired: true,
                user: result.user,
                token: result.token,
            });
        }
        return res.status(201).json({
            message: "Login successful.",
            user: result.user,
            token: result.token,
            passwordChangeRequired: false,
        });
    }
    catch (error) {
        console.error("Error during user login:", error);
        if (error.name === "ZodError") {
            return res.status(400).json({
                error: "Validation failed",
                details: error.errors,
            });
        }
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error." });
    }
};
exports.loginUserController = loginUserController;
const forgotPassswordController = async (req, res) => {
    try {
        const { email } = req.body;
        const link = await (0, user_service_3.forgotPasswordService)(email);
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
        const result = await (0, user_service_4.verifyResetPasswordService)(data);
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
        const result = await (0, user_service_5.resetPasswordService)({
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
const dashboardSummaryController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const { userId } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(userId) || !userId) {
            return res.status(400).json({ error: "Invalid userId" });
        }
        if (req.user.id !== userId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden. You can only access your own dashboard.",
            });
        }
        const { issuedItems, queuedItems, newArrivals } = await (0, user_service_1.dashboardSummaryService)(userId);
        return res.status(200).json({
            success: true,
            message: "Dashboard data fetched successfully",
            data: { issuedItems, queuedItems, newArrivals },
        });
    }
    catch (error) {
        console.error("Error fetching dashboard data:", error);
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error." });
    }
};
exports.dashboardSummaryController = dashboardSummaryController;
const getIssuedItemsController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const userId = req.user.id;
        if (!mongoose_1.Types.ObjectId.isValid(userId) || !userId) {
            return res.status(400).json({ error: "Invalid userId" });
        }
        const issuedItems = await (0, user_service_1.getIssueddItemsSerive)(userId);
        return res.status(200).json({
            success: true,
            message: "Items fetched succesfully",
            data: issuedItems,
        });
    }
    catch (error) {
        console.error("Error fetching issued items data:", error);
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error." });
    }
};
exports.getIssuedItemsController = getIssuedItemsController;
const getCategoriesController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const categories = await (0, user_service_1.getCategoriesService)();
        return res.status(200).json({
            message: "Categories fetched successfully",
            data: categories,
        });
    }
    catch (error) {
        if (error.statusCode === 404) {
            return res.status(404).json({ message: "No categories found" });
        }
        return res.status(500).json({
            message: error.message || "Internal Server Error",
        });
    }
};
exports.getCategoriesController = getCategoriesController;
const getCategoryItemsController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const { categoryId } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(categoryId) || !categoryId) {
            return res.status(400).json({ error: "Invalid categoryId" });
        }
        const items = await (0, user_service_1.getCategoryItemsService)(categoryId);
        return res.status(200).json({
            success: true,
            message: "Items fetched succesfully",
            data: items,
        });
    }
    catch (error) {
        console.error("Error fetching fetching items data:", error);
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error." });
    }
};
exports.getCategoryItemsController = getCategoryItemsController;
const getItemController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const { itemId } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(itemId) || !itemId) {
            return res.status(400).json({ error: "Invalid itemId" });
        }
        const items = await (0, user_service_1.getItemService)(itemId);
        return res.status(200).json({
            success: true,
            message: "Items fetched successfully",
            data: items,
        });
    }
    catch (error) {
        console.error("Error fetching items data:", error);
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error." });
    }
};
exports.getItemController = getItemController;
const getRequestedItemsController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const { userId } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(userId) || !userId) {
            return res.status(400).json({ error: "Invalid userId" });
        }
        if (req.user.id !== userId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden. You can only access your own requests.",
            });
        }
        const requestedItems = await (0, user_service_1.getRequestedItemsSerice)(userId);
        return res.status(200).json({
            success: true,
            message: "Requested items fetched successfully",
            data: requestedItems,
        });
    }
    catch (error) {
        console.error("Error fetching requested items data:", error);
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error." });
    }
};
exports.getRequestedItemsController = getRequestedItemsController;
const requestItemController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const { userId } = req.params;
        const validatedData = auth_validation_1.itemRequestUpdateSchema.parse(req.body);
        if (!mongoose_1.Types.ObjectId.isValid(userId) || !userId) {
            return res.status(400).json({ error: "Invalid userId" });
        }
        const request = await (0, user_service_1.requestItemService)(userId, validatedData);
        return res.status(201).json({
            success: true,
            message: "Item requested successfully",
            request,
        });
    }
    catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || "Something went wrong",
        });
    }
};
exports.requestItemController = requestItemController;
const getQueuedItemsController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const userId = req.user.id;
        if (!mongoose_1.Types.ObjectId.isValid(userId) || !userId) {
            return res.status(400).json({ error: "Invalid userId" });
        }
        const queuedItems = await (0, user_service_1.getQueuedItemsService)(userId);
        return res.status(200).json({
            success: true,
            message: "Queue items fetched successfully",
            queuedItems,
        });
    }
    catch (error) {
        console.error("Error fetching queue items data:", error);
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error." });
    }
};
exports.getQueuedItemsController = getQueuedItemsController;
const getQueueItemController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const { queueId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const queueItem = await (0, user_service_1.getQueueItemByIdService)(queueId);
        const isUserInQueue = queueItem.queueMembers.some((member) => member.userId && member.userId._id.toString() === userId);
        if (!isUserInQueue) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to access this queue item",
            });
        }
        res.status(200).json({
            success: true,
            message: "Queue item fetched successfully",
            data: queueItem,
        });
    }
    catch (error) {
        console.error("Get queue item error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch queue item",
        });
    }
};
exports.getQueueItemController = getQueueItemController;
const withdrawFromQueueController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const { queueId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const result = await (0, user_service_1.withdrawFromQueueService)(queueId, userId);
        res.status(200).json({
            success: true,
            message: result.message,
            data: result,
        });
    }
    catch (error) {
        console.error("Withdraw from queue error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to withdraw from queue",
        });
    }
};
exports.withdrawFromQueueController = withdrawFromQueueController;
const searchItemsController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const { query, category, status } = req.query;
        const userId = req.user.id;
        const searchCriteria = {};
        if (query) {
            searchCriteria.$or = [
                { title: { $regex: query, $options: "i" } },
                { authorOrCreator: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } },
                { isbnOrIdentifier: { $regex: query, $options: "i" } },
            ];
        }
        if (category) {
            searchCriteria.categoryId = category;
        }
        if (status) {
            searchCriteria.status = status;
        }
        const items = await item_model_1.default.find(searchCriteria)
            .populate("categoryId", "name description")
            .sort({ title: 1 })
            .limit(50);
        res.status(200).json({
            success: true,
            message: "Search completed successfully",
            data: items,
            total: items.length,
        });
    }
    catch (error) {
        console.error("Search error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error during search",
        });
    }
};
exports.searchItemsController = searchItemsController;
const extendIssuedItemController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const { itemId } = req.params;
        const userId = req.user.id;
        if (!mongoose_1.Types.ObjectId.isValid(itemId) || !mongoose_1.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid itemId or userId" });
        }
        const updatedItem = await (0, user_service_1.extendIssuedItemService)(itemId, userId);
        return res.status(200).json({
            success: true,
            message: "Issued item period extended successfully",
            updatedItem,
        });
    }
    catch (error) {
        console.error("Error extending issued item:", error);
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error" });
    }
};
exports.extendIssuedItemController = extendIssuedItemController;
const returnItemRequestController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const { itemId } = req.params;
        const userId = req.user?.id;
        const { status } = req.body;
        if (!mongoose_1.Types.ObjectId.isValid(itemId) || !mongoose_1.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid itemId or userId" });
        }
        const { issuedItem, fine } = await (0, user_service_1.returnItemRequestService)(itemId, userId, status);
        return res.status(200).json({
            success: true,
            message: "Item return processed successfully",
            item: issuedItem,
            fine: fine,
        });
    }
    catch (error) {
        console.error("Error in returning an item:", error);
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error" });
    }
};
exports.returnItemRequestController = returnItemRequestController;
const requestNewItemController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const validatedData = req.body;
        const userId = req.user.id;
        const item = await (0, user_service_1.requestNewItemService)(userId, validatedData);
        return res.status(200).json({
            success: true,
            message: "Item request processed successfully",
            item: item,
        });
    }
    catch (error) {
        if (error.name === "ZodError") {
            return res.status(400).json({
                message: "Validation error",
                errors: error.errors,
            });
        }
        console.error("Error in requesting new item:", error);
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error" });
    }
};
exports.requestNewItemController = requestNewItemController;
const getNewRequestedItemController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const userId = req.user.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: User not found.",
            });
        }
        const userRequests = await (0, user_service_1.getNewRequestedItemService)(userId);
        return res.status(200).json({
            success: true,
            message: "Successfully retrieved your item requests",
            count: userRequests.length,
            data: userRequests,
        });
    }
    catch (error) {
        console.error("Error fetching user item requests:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};
exports.getNewRequestedItemController = getNewRequestedItemController;
const getNewSpecificRequestedItemController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const { itemId } = req.params;
        if (!itemId) {
            return res.status(401).json({
                success: false,
                message: "Item not found.",
            });
        }
        const newRequest = await (0, user_service_1.getNewSpecificRequestedItemService)(itemId);
        return res.status(200).json({
            success: true,
            message: "Successfully retrieved your item request",
            data: newRequest,
        });
    }
    catch (error) {
        console.error("Error fetching user item request:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};
exports.getNewSpecificRequestedItemController = getNewSpecificRequestedItemController;
const deleteRequestedItemController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const { itemId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const result = await (0, user_service_1.deleteRequestedItemService)(itemId, userId);
        res.status(200).json({
            success: true,
            message: result.message,
            data: result,
        });
    }
    catch (error) {
        console.error("Delete requested item error:", error);
        if (error.message.includes("not found") ||
            error.message.includes("Not authorized") ||
            error.message.includes("Only pending requests")) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete requested item",
        });
    }
};
exports.deleteRequestedItemController = deleteRequestedItemController;
const getNewArrivalsController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const newArrivals = await (0, user_service_1.getNewArrivalsService)();
        return res.status(200).json({
            success: true,
            message: "New Arrivals fetched successfully",
            items: newArrivals,
        });
    }
    catch (error) {
        console.error("Error in fetching an item:", error);
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error" });
    }
};
exports.getNewArrivalsController = getNewArrivalsController;
const getHistoryController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json({ message: "userId not found" });
        }
        const history = await (0, user_service_1.getHistoryService)(userId);
        return res.status(200).json({
            success: true,
            message: "User history fetched successfully",
            data: history,
        });
    }
    catch (error) {
        console.error("Error in getHistoryController:", error);
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error" });
    }
};
exports.getHistoryController = getHistoryController;
const createIssueRequestController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const userId = req.user.id;
        const { itemId } = req.body;
        if (!itemId) {
            return res.status(400).json({
                success: false,
                message: "Item ID is required",
            });
        }
        const result = await (0, user_service_1.createIssueRequestService)(userId.toString(), itemId);
        if (result.type === "immediate" && "issuedItem" in result) {
            return res.status(201).json({
                success: true,
                message: result.message,
                data: {
                    issuedItem: result.issuedItem,
                    type: result.type,
                },
            });
        }
        else if (result.type === "queued" && "queuePosition" in result) {
            return res.status(201).json({
                success: true,
                message: result.message,
                data: {
                    queuePosition: result.queuePosition,
                    type: result.type,
                },
            });
        }
        else {
            return res.status(201).json({
                success: true,
                message: result.message,
                data: { type: result.type },
            });
        }
    }
    catch (error) {
        console.error("Error creating issue request:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};
exports.createIssueRequestController = createIssueRequestController;
const getMyIssueRequestsController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const userId = req.user?.id;
        const requests = await (0, user_service_1.getMyIssueRequestsService)(userId);
        return res.status(200).json({
            success: true,
            message: "Issue requests fetched successfully",
            data: requests,
        });
    }
    catch (error) {
        console.error("Error in getMyIssueRequestsController:", error);
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error" });
    }
};
exports.getMyIssueRequestsController = getMyIssueRequestsController;
const getAllFinesController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json({ message: "userId not found" });
        }
        const fines = await (0, user_service_1.getAllFinesService)(userId);
        return res.status(200).json({
            success: true,
            message: "User fines fetched successfully",
            data: fines,
        });
    }
    catch (error) {
        console.error("Error in getAllFinesController:", error);
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error" });
    }
};
exports.getAllFinesController = getAllFinesController;
const getProfileDetailsController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json({ message: "userId not found" });
        }
        const profile = await (0, user_service_1.getProfileDetailsService)(userId);
        return res.status(200).json({
            success: true,
            message: "Profile details fetched successfully",
            data: profile,
        });
    }
    catch (error) {
        console.error("Error in getProfileDetailsController:", error);
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error" });
    }
};
exports.getProfileDetailsController = getProfileDetailsController;
const updateProfileController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json({ message: "userId not found" });
        }
        const updatedProfile = await (0, user_service_1.updateProfileService)(userId, req.body);
        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedProfile,
        });
    }
    catch (error) {
        console.error("Error in updateProfileController:", error);
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error" });
    }
};
exports.updateProfileController = updateProfileController;
const updateNotificationPreferenceController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json({ message: "userId not found" });
        }
        const updatedUser = await (0, user_service_1.updateNotificationPreferenceService)(userId, req.body);
        return res.status(200).json({
            success: true,
            message: "Notification preferences updated successfully",
            data: updatedUser.notificationPreference,
        });
    }
    catch (error) {
        console.error("Error in updateNotificationPreferenceController:", error);
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error" });
    }
};
exports.updateNotificationPreferenceController = updateNotificationPreferenceController;
const updateProfilePictureController = async (req, res) => {
    try {
        const userId = req.user.id;
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image file provided",
            });
        }
        const uploadResult = await (0, upload_1.uploadFile)(req.file.path);
        if (!uploadResult || !uploadResult.secure_url) {
            return res.status(500).json({
                success: false,
                message: "Failed to upload image to cloud storage",
            });
        }
        const updatedUser = await user_model_1.default.findByIdAndUpdate(userId, {
            profile: uploadResult.secure_url,
            updatedAt: new Date()
        }, { new: true });
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Profile picture updated successfully",
            data: {
                profilePicture: uploadResult.secure_url,
                user: updatedUser
            }
        });
    }
    catch (error) {
        console.error("Update profile picture error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};
exports.updateProfilePictureController = updateProfilePictureController;
const updatePasswordController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json({ message: "userId not found" });
        }
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res
                .status(400)
                .json({ message: "Both currentPassword and newPassword are required" });
        }
        await (0, user_service_1.updatePasswordService)(userId, currentPassword, newPassword);
        return res.status(200).json({
            success: true,
            message: "Password updated successfully",
        });
    }
    catch (error) {
        console.error("Error in updatePasswordController:", error);
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error" });
    }
};
exports.updatePasswordController = updatePasswordController;
const expressDonationInterestController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json({ message: "userId not found" });
        }
        // console.log("Donation request body:", req.body);
        // console.log("User ID:", userId);
        const donation = await (0, user_service_1.expressDonationInterestService)(userId, req.body);
        return res.status(201).json({
            success: true,
            message: "Donation interest submitted successfully",
            data: donation,
        });
    }
    catch (error) {
        console.error("Error in expressDonationInterestController:", error);
        console.error("Error stack:", error.stack);
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal server error",
        });
    }
};
exports.expressDonationInterestController = expressDonationInterestController;
const getMyDonationsController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json({ message: "userId not found" });
        }
        const response = await (0, user_service_1.getMyDonationsService)(userId);
        return res.status(200).json({
            success: true,
            message: "Donations fetched successfully",
            data: response.data,
            count: response.count,
        });
    }
    catch (error) {
        console.error("Error in getMyDonationsController:", error);
        return res
            .status(error.statusCode || 500)
            .json({ error: error.message || "Internal server error" });
    }
};
exports.getMyDonationsController = getMyDonationsController;
const getDonationDetailsController = async (req, res) => {
    const { donationId } = req.params;
    const userId = req.user?.id;
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        if (!userId) {
            return res.status(400).json({ message: "userId not found" });
        }
        const donation = await donation_model_1.default.findById(donationId)
            .populate("userId", "fullName email username phoneNumber")
            .populate("itemType", "name description")
            .populate("inventoryItemId", "title authorOrCreator description barcode status");
        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Donation not found",
            });
        }
        if (donation.userId._id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Access denied",
            });
        }
        return res.status(200).json({
            success: true,
            data: donation,
        });
    }
    catch (error) {
        console.error("Error fetching donation details:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};
exports.getDonationDetailsController = getDonationDetailsController;
const withdrawDonationController = async (req, res) => {
    try {
        const { donationId } = req.params;
        const userId = req.user?.id;
        if (!donationId) {
            return res.status(400).json({
                success: false,
                message: "Donation ID is required",
            });
        }
        const result = await (0, user_service_1.withdrawDonationService)(donationId, userId);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
            });
        }
        return res.status(200).json({
            success: true,
            message: "Donation request withdrawn successfully",
            data: result.withdrawnDonation,
        });
    }
    catch (error) {
        console.error("Error in withdraw donation controller:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};
exports.withdrawDonationController = withdrawDonationController;
const uploadPhotoController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image file provided",
            });
        }
        const filePath = req.file.path;
        const result = await (0, upload_1.uploadFile)(filePath);
        if (!result) {
            try {
                fs_1.default.unlinkSync(filePath);
            }
            catch (unlinkErr) {
                console.error("Error deleting temp file after failed upload:", unlinkErr);
            }
            return res.status(500).json({
                success: false,
                message: "Failed to upload image to Cloudinary",
            });
        }
        try {
            fs_1.default.unlinkSync(filePath);
            console.log(`Successfully deleted temporary file: ${filePath}`);
        }
        catch (unlinkErr) {
            console.error("Error deleting temporary file after successful upload:", unlinkErr);
        }
        res.status(200).json({
            success: true,
            message: "Image uploaded successfully",
            data: {
                url: result.secure_url,
                publicId: result.public_id,
            },
        });
    }
    catch (error) {
        console.error("Image upload error:", error);
        if (req.file && req.file.path) {
            try {
                if (fs_1.default.existsSync(req.file.path)) {
                    fs_1.default.unlinkSync(req.file.path);
                }
            }
            catch (cleanupErr) {
                console.error("Error during cleanup after upload error:", cleanupErr);
            }
        }
        res.status(500).json({
            success: false,
            message: error.message || "Internal server error during upload",
        });
    }
};
exports.uploadPhotoController = uploadPhotoController;
const getUserNotificationController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json({ message: "userId not found" });
        }
        const notifications = await (0, user_service_1.getUserNotificationService)(userId);
        return res.status(200).json({
            success: true,
            message: "notifications fetched successfully",
            data: {
                notifications: notifications,
            },
        });
    }
    catch (error) {
        console.error("Notification fetch error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal server error during notification fetching",
        });
    }
};
exports.getUserNotificationController = getUserNotificationController;
const markAsReadController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const userId = req.user.id;
        const { notificationId, markAll } = req.body;
        if (!userId) {
            return res.status(400).json({ message: "userId not found" });
        }
        const message = await (0, user_service_1.markAsReadService)(userId, notificationId, markAll);
        return res.status(200).json({
            success: true,
            message: "mark notification as read",
            data: {
                message: message,
            },
        });
    }
    catch (error) {
        console.error("mark as read error:", error);
        res.status(500).json({
            success: false,
            message: error.message ||
                "Internal server error during notification mark-as-read",
        });
    }
};
exports.markAsReadController = markAsReadController;
const deleteNotificationController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in.",
            });
        }
        const userId = req.user.id;
        const { notificationId, deleteAll } = req.body;
        if (!userId) {
            return res.status(400).json({ message: "userId not found" });
        }
        const message = await (0, user_service_1.deleteNotificationService)(userId, notificationId, deleteAll);
        return res.status(200).json({
            success: true,
            message: "notification deleted successfully",
            data: {
                message: message,
            },
        });
    }
    catch (error) {
        console.error("notification delete error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal server error during notification delete",
        });
    }
};
exports.deleteNotificationController = deleteNotificationController;
