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
const supertest_1 = __importDefault(require("supertest"));
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = require("../index");
const adminService = __importStar(require("../services/admin.service"));
const user_model_1 = __importDefault(require("../models/user.model"));
const bcrypt_1 = __importDefault(require("bcrypt"));
jest.mock("../middleware/auth.middleware", () => ({
    authUser: (req, res, next) => {
        req.user = {
            id: new mongoose_1.default.Types.ObjectId().toString(),
            email: "admin@example.com",
            roles: ["admin"],
        };
        next();
    },
}));
jest.mock("../config/upload", () => ({
    upload: {
        single: jest.fn(() => (req, res, next) => {
            if (req.headers["content-type"]?.includes("multipart/form-data")) {
                req.file = { path: "fake/profile.png" };
            }
            next();
        }),
    },
    uploadFile: jest
        .fn()
        .mockResolvedValue({ secure_url: "http://cloudinary.com/profile.png" }),
}));
jest.mock("fs", () => ({
    ...jest.requireActual("fs"),
    unlinkSync: jest.fn(),
}));
jest.mock("../validations/auth.validation", () => ({
    SystemRestrictionsUpdateSchema: { parse: jest.fn((data) => data) },
    updateUserSchema: { parse: jest.fn((data) => data) },
}));
jest.mock("../services/admin.service", () => ({
    getSystemRestrictionsService: jest.fn(),
    updateSystemRestrictionsService: jest.fn(),
    getNotificationTemplatesService: jest.fn(),
    updateNotificationTemplateService: jest.fn(),
    addTemplateService: jest.fn(),
    getAdminProfileService: jest.fn(),
    resetPasswordAdminService: jest.fn(),
    updateAdminPasswordServive: jest.fn(),
    loginService: jest.fn(),
    forgotPasswordService: jest.fn(),
    verifyResetPasswordService: jest.fn(),
    resetPasswordService: jest.fn(),
    updateUserStatusService: jest.fn(),
    getDashboardSummaryService: jest.fn(),
    getAllUsersService: jest.fn(),
    createUserService: jest.fn(),
    getUserDetailsService: jest.fn(),
    updateUserController: jest.fn(),
    forcePasswordResetService: jest.fn(),
    deleteUserService: jest.fn(),
    fetchRolesService: jest.fn(),
    createRoleService: jest.fn(),
    updateRoleService: jest.fn(),
    deleteRoleService: jest.fn(),
    fetchInventoryItemsService: jest.fn(),
    createInventoryItemsService: jest.fn(),
    fetchSpecificItemServive: jest.fn(),
    updateItemService: jest.fn(),
    deleteItemService: jest.fn(),
    getCategoriesService: jest.fn(),
    updateCategoryService: jest.fn(),
    deleteCategoryService: jest.fn(),
    getAllFinesService: jest.fn(),
    createFinesController: jest.fn(),
    fetchUserFinesService: jest.fn(),
    getIssuedReportService: jest.fn(),
    getFinesReportService: jest.fn(),
    getInventoryReportService: jest.fn(),
    generateInventoryReportPDF: jest.fn(),
    generateFinesReportPDF: jest.fn(),
    generateIssuedItemsReportPDF: jest.fn(),
    createFineService: jest.fn(),
    updateFineService: jest.fn(),
    deleteFineService: jest.fn(),
    recordPaymentService: jest.fn(),
    waiveFineService: jest.fn(),
    createCategoryService: jest.fn(),
    getCategoryByIdService: jest.fn(),
    getPendingIssueRequestsController: jest.fn(),
    issueItemController: jest.fn(),
    approveIssueRequestController: jest.fn(),
    rejectIssueRequestController: jest.fn(),
    extendPeriodService: jest.fn(),
    processItemReturn: jest.fn(),
    handleUserResponse: jest.fn(),
    checkExpiredNotifications: jest.fn(),
    getAllQueuesController: jest.fn(),
    getQueueAnalytics: jest.fn(),
    exportQueueAnalytics: jest.fn(),
    exportIssuedItemsController: jest.fn(),
    getDefaulterReport: jest.fn(),
    sendReminderService: jest.fn(),
    exportDefaulterReport: jest.fn(),
    getNotificationsController: jest.fn(),
    markAsReadController: jest.fn(),
    markAllAsReadController: jest.fn(),
    deleteNotificationController: jest.fn(),
    getAllUsersReport: jest.fn(),
    exportAllUsersReportController: jest.fn(),
    generateBarcodeString: jest.fn(),
    generateBarcodePDF: jest.fn(),
    getAllDonationService: jest.fn(),
    updateDonationStatusService: jest.fn(),
    viewQueueService: jest.fn(),
    issueItemFromQueueService: jest.fn(),
    removeUserFromQueueService: jest.fn(),
    fetchAllPermissionsService: jest.fn(),
    updateAdminController: jest.fn(),
}));
const mockedGetSystemRestrictions = adminService.getSystemRestrictionsService;
const mockedUpdateSystemRestrictions = adminService.updateSystemRestrictionsService;
const mockedGetNotificationTemplates = adminService.getNotificationTemplatesService;
const mockedUpdateNotificationTemplate = adminService.updateNotificationTemplateService;
const mockedGetAdminProfile = adminService.getAdminProfileService;
const mockedResetPasswordAdmin = adminService.resetPasswordAdminService;
const mockedUpdateAdminPassword = adminService.updateAdminPasswordServive;
const mockedAddTemplate = adminService.addTemplateService;
describe("Settings API (/api/admin/settings)", () => {
    const mockAdminUserId = new mongoose_1.default.Types.ObjectId().toString();
    let mockAdminUser;
    beforeEach(async () => {
        jest.clearAllMocks();
        mockAdminUser = await user_model_1.default.create({
            _id: mockAdminUserId,
            fullName: "Admin User",
            email: "admin@example.com",
            username: "admin",
            password: "oldPassword123",
        });
    });
    afterEach(async () => {
        await user_model_1.default.deleteMany({});
    });
    /* ========================= System Restrictions ========================= */
    describe("GET /settings/system-restrictions", () => {
        it("should return 200 and the system restrictions", async () => {
            const mockSettings = { borrowingLimits: 5 };
            mockedGetSystemRestrictions.mockResolvedValue(mockSettings);
            const response = await (0, supertest_1.default)(index_1.app).get("/api/admin/settings/system-restrictions");
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockSettings);
            expect(mockedGetSystemRestrictions).toHaveBeenCalledTimes(1);
        });
        it("should return 404 if settings are not found", async () => {
            mockedGetSystemRestrictions.mockRejectedValue({
                statusCode: 404,
                message: "Not found",
            });
            const response = await (0, supertest_1.default)(index_1.app).get("/api/admin/settings/system-restrictions");
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Not found");
        });
    });
    describe("PUT /settings/system-restrictions", () => {
        it("should return 200 and the updated restrictions", async () => {
            const updateData = { libraryName: "New Library Name" };
            mockedUpdateSystemRestrictions.mockResolvedValue(updateData);
            const response = await (0, supertest_1.default)(index_1.app)
                .put("/api/admin/settings/system-restrictions")
                .send(updateData);
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(updateData);
            expect(mockedUpdateSystemRestrictions).toHaveBeenCalledWith(updateData);
        });
        it("should return 400 if no data is provided", async () => {
            jest.requireMock("../validations/auth.validation")
                .SystemRestrictionsUpdateSchema.parse.mockImplementationOnce(() => {
                throw { name: "ZodError", errors: [] };
            });
            const response = await (0, supertest_1.default)(index_1.app)
                .put("/api/admin/settings/system-restrictions")
                .send({});
            const emptyResponse = await (0, supertest_1.default)(index_1.app)
                .put("/api/admin/settings/system-restrictions")
                .send({});
            expect(emptyResponse.status).toBe(400);
            expect(emptyResponse.body.message).toBe("No fields provided for update");
        });
    });
    /* ========================= Notification Templates ========================= */
    describe("GET /settings/notification-templates", () => {
        it("should return 200 and the list of templates", async () => {
            const mockTemplates = { welcome: { emailSubject: "Welcome!" } };
            mockedGetNotificationTemplates.mockResolvedValue(mockTemplates);
            const response = await (0, supertest_1.default)(index_1.app).get("/api/admin/settings/notification-templates");
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockTemplates);
        });
    });
    describe("POST /settings/notofication-templates", () => {
        it("should return 200 and the added template", async () => {
            const newTemplate = {
                key: "newTemplate",
                emailSubject: "New",
                emailBody: "Body",
                whatsappMessage: "Msg",
            };
            mockedAddTemplate.mockResolvedValue({ ...newTemplate });
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/admin/settings/notofication-templates")
                .send(newTemplate);
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual({ ...newTemplate });
            expect(mockedAddTemplate).toHaveBeenCalledWith(newTemplate.key, {
                emailSubject: newTemplate.emailSubject,
                emailBody: newTemplate.emailBody,
                whatsappMessage: newTemplate.whatsappMessage,
            });
        });
        it("should return 400 if fields are missing", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/admin/settings/notofication-templates")
                .send({ key: "test" });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("All fields required");
        });
    });
    describe("PUT /settings/notification-templates/:templateKey", () => {
        it("should return 200 and the updated template", async () => {
            const updateData = { emailSubject: "Updated Subject" };
            mockedUpdateNotificationTemplate.mockResolvedValue({
                emailSubject: "Updated Subject",
            });
            const response = await (0, supertest_1.default)(index_1.app)
                .put("/api/admin/settings/notification-templates/welcome")
                .send(updateData);
            expect(response.status).toBe(200);
            expect(response.body.template).toEqual(updateData);
            expect(mockedUpdateNotificationTemplate).toHaveBeenCalledWith({
                templateKey: "welcome",
                data: updateData,
            });
        });
    });
    /* ========================= Admin Profile ========================= */
    describe("GET /settings/profile/:userId", () => {
        it("should return 200 and the admin profile", async () => {
            mockedGetAdminProfile.mockResolvedValue({ fullName: "Admin User" });
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/admin/settings/profile/${mockAdminUserId}`);
            expect(response.status).toBe(200);
            expect(response.body.data.fullName).toBe("Admin User");
            expect(mockedGetAdminProfile).toHaveBeenCalledWith(mockAdminUserId);
        });
    });
    describe("PUT /settings/profile/:userId", () => {
        it("should return 200 and update the admin's profile data (text only)", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/settings/profile/${mockAdminUserId}`)
                .send({ fullName: "Updated Admin Name" });
            expect(response.status).toBe(200);
            expect(response.body.user.fullName).toBe("Updated Admin Name");
            const userInDb = await user_model_1.default.findById(mockAdminUserId);
            expect(userInDb?.fullName).toBe("Updated Admin Name");
        });
        it("should return 200 and update profile with a file upload", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/settings/profile/${mockAdminUserId}`)
                .field("fullName", "Admin User")
                .set("Content-Type", "multipart/form-data");
            expect(response.status).toBe(200);
            expect(response.body.user.fullName).toBe("Admin User");
            expect(response.body.user.profile).toBe("http://cloudinary.com/profile.png");
            const userInDb = await user_model_1.default.findById(mockAdminUserId);
            expect(userInDb?.profile).toBe("http://cloudinary.com/profile.png");
            expect(jest.requireMock("fs").unlinkSync).toHaveBeenCalledWith("fake/profile.png");
        });
        it("should return 404 if user ID does not exist", async () => {
            const fakeId = new mongoose_1.default.Types.ObjectId().toString();
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/settings/profile/${fakeId}`)
                .send({ fullName: "Ghost" });
            expect(response.status).toBe(404);
            expect(response.body.error).toBe("User not found");
        });
    });
    /* ========================= Admin Password ========================= */
    describe("PUT /settings/profile/password-reset/:userId", () => {
        it("should return 200 and set passwordResetRequired to true", async () => {
            mockedResetPasswordAdmin.mockResolvedValue({
                passwordResetRequired: true,
            });
            const response = await (0, supertest_1.default)(index_1.app).put(`/api/admin/settings/profile/password-reset/${mockAdminUserId}`);
            expect(response.status).toBe(200);
            expect(response.body.data.passwordResetRequired).toBe(true);
            expect(mockedResetPasswordAdmin).toHaveBeenCalledWith(mockAdminUserId);
        });
    });
    describe("PUT /settings/profile/password/:userId", () => {
        it("should return 200 and update the admin's password", async () => {
            mockedUpdateAdminPassword.mockImplementation(async ({ userId, password }) => {
                const salt = await bcrypt_1.default.genSalt(10);
                const hashPassword = await bcrypt_1.default.hash(password, salt);
                await user_model_1.default.findByIdAndUpdate(userId, {
                    $set: { password: hashPassword },
                });
                return { ...mockAdminUser.toObject(), password: hashPassword };
            });
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/settings/profile/password/${mockAdminUserId}`)
                .send({ password: "newStrongPassword123" });
            expect(response.status).toBe(200);
            // Verify the service was called
            expect(mockedUpdateAdminPassword).toHaveBeenCalledWith({
                userId: mockAdminUserId,
                password: "newStrongPassword123",
            });
            const userInDb = await user_model_1.default.findById(mockAdminUserId).select("+password");
            const isMatch = await bcrypt_1.default.compare("newStrongPassword123", userInDb.password);
            expect(isMatch).toBe(true);
            const isOldMatch = await bcrypt_1.default.compare("oldPassword123", userInDb.password);
            expect(isOldMatch).toBe(false);
        });
    });
});
