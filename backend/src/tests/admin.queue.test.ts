import request from "supertest";
import mongoose from "mongoose";
import { app } from "../index";
import * as adminService from "../services/admin.service";
import Queue from "../models/queue.model";
import User from "../models/user.model";
import InventoryItem from "../models/item.model";
import IssuedItem from "../models/issuedItem.model";
import Category from "../models/category.model";

jest.mock("../middleware/auth.middleware", () => ({
  authUser: (req: any, res: any, next: any) => {
    req.user = {
      id: "mockAdminId",
      _id: "mockAdminId",
    };
    next();
  },
}));

jest.mock("../services/admin.service", () => ({
  viewQueueService: jest.fn(),
  issueItemFromQueueService: jest.fn(),
  removeUserFromQueueService: jest.fn(),
  processItemReturn: jest.fn(),
  handleUserResponse: jest.fn(),
  checkExpiredNotifications: jest.fn(),
}));

const mockedViewQueue = adminService.viewQueueService as jest.Mock;
const mockedIssueFromQueue =
  adminService.issueItemFromQueueService as jest.Mock;
const mockedRemoveFromQueue =
  adminService.removeUserFromQueueService as jest.Mock;
const mockedProcessReturn = adminService.processItemReturn as jest.Mock;
const mockedHandleResponse = adminService.handleUserResponse as jest.Mock;
const mockedCheckExpired = adminService.checkExpiredNotifications as jest.Mock;

describe("Queue API (/api/admin/inventory/items/.../queue)", () => {
  let testItem: any;
  let testUser: any;
  let testQueue: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    testUser = {
      _id: new mongoose.Types.ObjectId().toString(),
      fullName: "Queue User",
    };

    testItem = {
      _id: new mongoose.Types.ObjectId().toString(),
      title: "Queued Item",
    };

    testQueue = {
      _id: new mongoose.Types.ObjectId().toString(),
      itemId: testItem._id,
      queueMembers: [
        {
          userId: testUser._id,
          position: 1,
          status: "waiting",
        },
      ],
    };
  });

  /* ========================= GET /inventory/items/:itemId/view-queue ========================= */
  describe("GET /inventory/items/:itemId/view-queue", () => {
    it("should return 200 and the queue for the item", async () => {
      mockedViewQueue.mockResolvedValue(testQueue);

      const response = await request(app).get(
        `/api/admin/inventory/items/${testItem._id}/view-queue`
      );

      expect(response.status).toBe(200);
      expect(response.body.donation).toEqual(testQueue);
      expect(mockedViewQueue).toHaveBeenCalledWith(testItem._id);
    });

    it("should return 400 if itemId is invalid", async () => {
      const response = await request(app).get(
        "/api/admin/inventory/items/invalid-id/view-queue"
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid itemId");
      expect(mockedViewQueue).not.toHaveBeenCalled();
    });

    it("should return 500 if the service fails", async () => {
      mockedViewQueue.mockRejectedValue(new Error("DB Error"));

      const response = await request(app).get(
        `/api/admin/inventory/items/${testItem._id}/view-queue`
      );

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("DB Error");
    });
  });

  /* ========================= POST /inventory/items/queue/:queueId/issue ========================= */
  describe("POST /inventory/items/queue/:queueId/issue", () => {
    it("should return 200 and the issued item when successful", async () => {
      const mockIssuedItem = {
        _id: new mongoose.Types.ObjectId().toString(),
        itemId: testItem._id,
        userId: testUser._id,
      };
      mockedIssueFromQueue.mockResolvedValue(mockIssuedItem);

      const response = await request(app)
        .post(`/api/admin/inventory/items/queue/${testQueue._id}/issue`)
        .send({ userId: testUser._id });

      expect(response.status).toBe(200);
      expect(response.body.donation).toEqual(mockIssuedItem);
      expect(mockedIssueFromQueue).toHaveBeenCalledWith(
        testQueue._id.toString(),
        testUser._id,
        "mockAdminId"
      );
    });

    it("should return 400 if userId is missing in the body", async () => {
      const response = await request(app)
        .post(`/api/admin/inventory/items/queue/${testQueue._id}/issue`)
        .send({}); // No userId

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("User ID is required.");
      expect(mockedIssueFromQueue).not.toHaveBeenCalled();
    });

    it("should return 500 (or 404) if the service fails (e.g., Queue not found)", async () => {
      mockedIssueFromQueue.mockRejectedValue({
        statusCode: 404,
        message: "Queue not found.",
      });

      const response = await request(app)
        .post(`/api/admin/inventory/items/queue/${testQueue._id}/issue`)
        .send({ userId: testUser._id });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Queue not found.");
    });
  });

  /* ========================= PUT /inventory/items/queue/:queueId/remove-user ========================= */
  describe("PUT /inventory/items/queue/:queueId/remove-user", () => {
    it("should return 200 and a success message", async () => {
      mockedRemoveFromQueue.mockResolvedValue({
        message: "User removed successfully.",
      });

      const response = await request(app)
        .put(`/api/admin/inventory/items/queue/${testQueue._id}/remove-user`)
        .send({ userId: testUser._id });

      expect(response.status).toBe(200);
      expect(response.body.message).toEqual({
        message: "User removed successfully.",
      });
      expect(mockedRemoveFromQueue).toHaveBeenCalledWith(
        testQueue._id.toString(),
        testUser._id
      );
    });

    it("should return 400 if userId is missing", async () => {
      const response = await request(app)
        .put(`/api/admin/inventory/items/queue/${testQueue._id}/remove-user`)
        .send({}); // No userId

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("User ID is required.");
      expect(mockedRemoveFromQueue).not.toHaveBeenCalled();
    });

    it("should return 500 (or 404) if the user is not in the queue", async () => {
      mockedRemoveFromQueue.mockRejectedValue({
        statusCode: 404,
        message: "User not in queue.",
      });

      const response = await request(app)
        .put(`/api/admin/inventory/items/queue/${testQueue._id}/remove-user`)
        .send({ userId: "fakeUserId" });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("User not in queue.");
    });
  });

  /* ========================= POST /inventory/items/:itemId/process-return ========================= */
  describe("POST /inventory/items/:itemId/process-return", () => {
    it("should return 200 and a success message", async () => {
      const mockResult = {
        message: "Notification sent to next user in queue",
      };
      mockedProcessReturn.mockResolvedValue(mockResult);

      const response = await request(app).post(
        `/api/admin/inventory/items/${testItem._id}/process-return`
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(mockResult.message);
      expect(mockedProcessReturn).toHaveBeenCalledWith(testItem._id);
    });

    it("should return 200 if no queue is found", async () => {
      const mockResult = { message: "No queue found for this item" };
      mockedProcessReturn.mockResolvedValue(mockResult);

      const response = await request(app).post(
        `/api/admin/inventory/items/${testItem._id}/process-return`
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(mockResult.message);
    });

    it("should return 400 if itemId is invalid", async () => {
      const response = await request(app).post(
        "/api/admin/inventory/items/invalid-id/process-return"
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid itemId");
    });
  });

  /* ========================= POST /queue/:itemId/respond ========================= */
  describe("POST /queue/:itemId/respond (User Response)", () => {
    it("should return 200 and a success message", async () => {
      const mockResult = { message: "Item issued successfully", issued: true };
      mockedHandleResponse.mockResolvedValue(mockResult);

      const response = await request(app)
        .post(`/api/admin/queue/${testItem._id}/respond`)
        .send({ accept: true });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockResult);
      expect(mockedHandleResponse).toHaveBeenCalledWith(
        "mockAdminId", // This comes from the mocked authUser
        testItem._id,
        true
      );
    });

    it("should return 400 if 'accept' field is missing or not boolean", async () => {
      const response = await request(app)
        .post(`/api/admin/queue/${testItem._id}/respond`)
        .send({ accept: "yes" }); // Not a boolean

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("must be boolean");
    });
  });

  /* ========================= POST /queue/check-expired ========================= */
  describe("POST /queue/check-expired", () => {
    it("should return 200 and a success message", async () => {
      mockedCheckExpired.mockResolvedValue(undefined);

      const response = await request(app).post(
        "/api/admin/queue/check-expired"
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(
        "Expired notifications processed successfully"
      );
      expect(mockedCheckExpired).toHaveBeenCalledTimes(1);
    });

    it("should return 500 if the service fails", async () => {
      mockedCheckExpired.mockRejectedValue(new Error("Cron job error"));

      const response = await request(app).post(
        "/api/admin/queue/check-expired"
      );

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Cron job error");
    });
  });
});
