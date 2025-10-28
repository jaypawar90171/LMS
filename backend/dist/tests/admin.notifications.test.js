"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = require("../index");
const notificationService_1 = require("../utility/notificationService");
jest.mock("../middleware/auth.middleware", () => ({
    authUser: (req, res, next) => {
        req.user = {
            id: "mockAdminUserId",
            _id: "mockAdminUserId",
        };
        next();
    },
}));
jest.mock("../utility/notificationService", () => ({
    NotificationService: {
        getAdminNotifications: jest.fn(),
        markAsRead: jest.fn(),
        markAllAsRead: jest.fn(),
        deleteNotification: jest.fn(),
    },
}));
const mockedGetAdminNotifications = notificationService_1.NotificationService.getAdminNotifications;
const mockedMarkAsRead = notificationService_1.NotificationService.markAsRead;
const mockedMarkAllAsRead = notificationService_1.NotificationService.markAllAsRead;
const mockedDeleteNotification = notificationService_1.NotificationService.deleteNotification;
describe("Notifications API (/api/admin/notifications)", () => {
    const mockNotificationId = new mongoose_1.default.Types.ObjectId().toString();
    const mockNotification = {
        _id: mockNotificationId,
        message: "Test notification",
        read: false,
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });
    /* ========================= GET /notifications ========================= */
    describe("GET /notifications", () => {
        it("should return 200 and a paginated list of notifications", async () => {
            const mockResponse = {
                notifications: [mockNotification],
                pagination: { total: 1, page: 1, limit: 20 },
            };
            mockedGetAdminNotifications.mockResolvedValue(mockResponse);
            const response = await (0, supertest_1.default)(index_1.app).get("/api/admin/notifications");
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockResponse.notifications);
            expect(response.body.pagination).toEqual(mockResponse.pagination);
            expect(mockedGetAdminNotifications).toHaveBeenCalledTimes(1);
        });
        it("should correctly pass query filters to the service", async () => {
            const filters = {
                type: "info",
                level: "high",
                read: "false",
                page: "2",
                limit: "10",
            };
            mockedGetAdminNotifications.mockResolvedValue({
                notifications: [],
                pagination: {},
            });
            await (0, supertest_1.default)(index_1.app).get("/api/admin/notifications").query(filters);
            expect(mockedGetAdminNotifications).toHaveBeenCalledWith({
                startDate: undefined,
                endDate: undefined,
                type: "info",
                level: "high",
                read: false,
                page: 2,
                limit: 10,
            });
        });
        it("should return 500 if the service fails", async () => {
            mockedGetAdminNotifications.mockRejectedValue(new Error("DB Error"));
            const response = await (0, supertest_1.default)(index_1.app).get("/api/admin/notifications");
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("DB Error");
        });
    });
    /* ========================= PATCH /notifications/:notificationId/read ========================= */
    describe("PATCH /notifications/:notificationId/read", () => {
        it("should return 200 and the updated notification", async () => {
            const updatedNotification = { ...mockNotification, read: true };
            mockedMarkAsRead.mockResolvedValue(updatedNotification);
            const response = await (0, supertest_1.default)(index_1.app).patch(`/api/admin/notifications/${mockNotificationId}/read`);
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(updatedNotification);
            expect(mockedMarkAsRead).toHaveBeenCalledWith(mockNotificationId);
        });
        it("should return 404 if the notification is not found", async () => {
            mockedMarkAsRead.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(index_1.app).patch(`/api/admin/notifications/${mockNotificationId}/read`);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Notification not found");
        });
        it("should return 500 if the service fails", async () => {
            mockedMarkAsRead.mockRejectedValue(new Error("Update failed"));
            const response = await (0, supertest_1.default)(index_1.app).patch(`/api/admin/notifications/${mockNotificationId}/read`);
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Update failed");
        });
    });
    /* ========================= PATCH /notifications/mark-all-read ========================= */
    describe("PATCH /notifications/mark-all-read", () => {
        it("should return 200 and the modification count", async () => {
            mockedMarkAllAsRead.mockResolvedValue({ modifiedCount: 5 });
            const response = await (0, supertest_1.default)(index_1.app).patch("/api/admin/notifications/mark-all-read");
            expect(response.status).toBe(200);
            expect(response.body.data.modifiedCount).toBe(5);
            expect(mockedMarkAllAsRead).toHaveBeenCalledWith("mockAdminUserId");
        });
        it("should return 500 if the service fails", async () => {
            mockedMarkAllAsRead.mockRejectedValue(new Error("Bulk update failed"));
            const response = await (0, supertest_1.default)(index_1.app).patch("/api/admin/notifications/mark-all-read");
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Bulk update failed");
        });
    });
    /* ========================= DELETE /notifications/:notificationId ========================= */
    describe("DELETE /notifications/:notificationId", () => {
        it("should return 200 and a success message", async () => {
            mockedDeleteNotification.mockResolvedValue(mockNotification);
            const response = await (0, supertest_1.default)(index_1.app).delete(`/api/admin/notifications/${mockNotificationId}`);
            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Notification deleted successfully");
            expect(mockedDeleteNotification).toHaveBeenCalledWith(mockNotificationId);
        });
        it("should return 404 if the notification to delete is not found", async () => {
            mockedDeleteNotification.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(index_1.app).delete(`/api/admin/notifications/${mockNotificationId}`);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Notification not found");
        });
        it("should return 500 if the service fails", async () => {
            mockedDeleteNotification.mockRejectedValue(new Error("Delete failed"));
            const response = await (0, supertest_1.default)(index_1.app).delete(`/api/admin/notifications/${mockNotificationId}`);
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Delete failed");
        });
    });
});
