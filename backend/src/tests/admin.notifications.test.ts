import request from "supertest";
import mongoose from "mongoose";
import { app } from "../index";
import { NotificationService } from "../utility/notificationService";

jest.mock("../middleware/auth.middleware", () => ({
  authUser: (req: any, res: any, next: any) => {
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

const mockedGetAdminNotifications =
  NotificationService.getAdminNotifications as jest.Mock;
const mockedMarkAsRead = NotificationService.markAsRead as jest.Mock;
const mockedMarkAllAsRead = NotificationService.markAllAsRead as jest.Mock;
const mockedDeleteNotification =
  NotificationService.deleteNotification as jest.Mock;

describe("Notifications API (/api/admin/notifications)", () => {
  const mockNotificationId = new mongoose.Types.ObjectId().toString();
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

      const response = await request(app).get("/api/admin/notifications");

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

      await request(app).get("/api/admin/notifications").query(filters);

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

      const response = await request(app).get("/api/admin/notifications");

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("DB Error");
    });
  });

  /* ========================= PATCH /notifications/:notificationId/read ========================= */
  describe("PATCH /notifications/:notificationId/read", () => {
    it("should return 200 and the updated notification", async () => {
      const updatedNotification = { ...mockNotification, read: true };
      mockedMarkAsRead.mockResolvedValue(updatedNotification);

      const response = await request(app).patch(
        `/api/admin/notifications/${mockNotificationId}/read`
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(updatedNotification);
      expect(mockedMarkAsRead).toHaveBeenCalledWith(mockNotificationId);
    });

    it("should return 404 if the notification is not found", async () => {
      mockedMarkAsRead.mockResolvedValue(null);

      const response = await request(app).patch(
        `/api/admin/notifications/${mockNotificationId}/read`
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Notification not found");
    });

    it("should return 500 if the service fails", async () => {
      mockedMarkAsRead.mockRejectedValue(new Error("Update failed"));

      const response = await request(app).patch(
        `/api/admin/notifications/${mockNotificationId}/read`
      );

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Update failed");
    });
  });

  /* ========================= PATCH /notifications/mark-all-read ========================= */
  describe("PATCH /notifications/mark-all-read", () => {
    it("should return 200 and the modification count", async () => {
      mockedMarkAllAsRead.mockResolvedValue({ modifiedCount: 5 });

      const response = await request(app).patch(
        "/api/admin/notifications/mark-all-read"
      );

      expect(response.status).toBe(200);
      expect(response.body.data.modifiedCount).toBe(5);

      expect(mockedMarkAllAsRead).toHaveBeenCalledWith("mockAdminUserId");
    });

    it("should return 500 if the service fails", async () => {
      mockedMarkAllAsRead.mockRejectedValue(new Error("Bulk update failed"));

      const response = await request(app).patch(
        "/api/admin/notifications/mark-all-read"
      );

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Bulk update failed");
    });
  });

  /* ========================= DELETE /notifications/:notificationId ========================= */
  describe("DELETE /notifications/:notificationId", () => {
    it("should return 200 and a success message", async () => {
      mockedDeleteNotification.mockResolvedValue(mockNotification);

      const response = await request(app).delete(
        `/api/admin/notifications/${mockNotificationId}`
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Notification deleted successfully");
      expect(mockedDeleteNotification).toHaveBeenCalledWith(mockNotificationId);
    });

    it("should return 404 if the notification to delete is not found", async () => {
      mockedDeleteNotification.mockResolvedValue(null);

      const response = await request(app).delete(
        `/api/admin/notifications/${mockNotificationId}`
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Notification not found");
    });

    it("should return 500 if the service fails", async () => {
      mockedDeleteNotification.mockRejectedValue(new Error("Delete failed"));

      const response = await request(app).delete(
        `/api/admin/notifications/${mockNotificationId}`
      );

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Delete failed");
    });
  });
});
