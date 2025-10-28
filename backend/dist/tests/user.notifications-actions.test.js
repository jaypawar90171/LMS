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
const user_model_1 = __importDefault(require("../models/user.model"));
const role_model_1 = __importDefault(require("../models/role.model"));
const notofication_modal_1 = __importDefault(require("../models/notofication.modal"));
const issuedItem_model_1 = __importDefault(require("../models/issuedItem.model"));
const itemRequest_model_1 = __importDefault(require("../models/itemRequest.model"));
const requestedItem_model_1 = __importDefault(require("../models/requestedItem.model"));
const item_model_1 = __importDefault(require("../models/item.model"));
const category_model_1 = __importDefault(require("../models/category.model"));
const queue_model_1 = __importDefault(require("../models/queue.model"));
const fine_model_1 = __importDefault(require("../models/fine.model"));
const userService = __importStar(require("../services/user.service"));
jest.mock("../middleware/auth.middleware", () => ({
    authUser: jest.fn((req, res, next) => next()),
}));
jest.mock("../services/user.service", () => ({
    getUserNotificationService: jest.fn(),
    markAsReadService: jest.fn(),
    deleteNotificationService: jest.fn(),
    getIssueddItemsSerive: jest.fn(),
    getRequestedItemsSerice: jest.fn(),
    getNewRequestedItemService: jest.fn(),
    getNewSpecificRequestedItemService: jest.fn(),
    deleteRequestedItemService: jest.fn(),
    getQueuedItemsService: jest.fn(),
    extendIssuedItemService: jest.fn(),
    returnItemRequestService: jest.fn(),
}));
const mockAuthUser = (user) => {
    jest.requireMock("../middleware/auth.middleware").authUser.mockImplementation((req, res, next) => {
        req.user = user;
        next();
    });
};
const unmockAuthUser = () => {
    jest.requireMock("../middleware/auth.middleware").authUser.mockImplementation((req, res, next) => next());
};
const mockedGetNotifications = userService.getUserNotificationService;
const mockedMarkAsRead = userService.markAsReadService;
const mockedDeleteNotification = userService.deleteNotificationService;
const mockedGetIssuedItems = userService.getIssueddItemsSerive;
const mockedGetOldRequests = userService.getRequestedItemsSerice;
const mockedGetNewRequests = userService.getNewRequestedItemService;
const mockedGetSpecificNewRequest = userService.getNewSpecificRequestedItemService;
const mockedDeleteNewRequest = userService.deleteRequestedItemService;
const mockedGetQueuedItems = userService.getQueuedItemsService;
const mockedExtendItem = userService.extendIssuedItemService;
const mockedReturnItem = userService.returnItemRequestService;
describe("User API - Notifications & Actions", () => {
    let testUser;
    let testItem;
    let issuedItem;
    let notification;
    let newItemRequest;
    beforeAll(async () => {
        await role_model_1.default.updateOne({ roleName: "employee" }, { $set: { roleName: "employee" } }, { upsert: true });
    });
    beforeEach(async () => {
        jest.clearAllMocks();
        unmockAuthUser();
        const roles = await role_model_1.default.find({ roleName: "employee" });
        testUser = await user_model_1.default.create({
            _id: new mongoose_1.default.Types.ObjectId(),
            fullName: "Action User",
            email: "action@example.com",
            username: "actionuser",
            password: "password123",
            status: "Active",
            roles: roles.map((r) => r._id),
        });
        testUser = testUser.toObject();
        testUser.id = testUser._id.toString();
        const category = await category_model_1.default.create({ name: "Test Cat" });
        testItem = await item_model_1.default.create({
            title: "Action Item",
            categoryId: category._id,
            price: "20",
            quantity: 1,
            availableCopies: 1,
            barcode: "ACT1",
        });
        issuedItem = await issuedItem_model_1.default.create({
            itemId: testItem._id,
            userId: testUser._id,
            status: "Issued",
            dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        });
        notification = await notofication_modal_1.default.create({
            recipientId: testUser._id,
            title: "Test",
            message: { content: "Test msg" },
            level: "Info",
            type: "system_alert",
        });
        newItemRequest = await requestedItem_model_1.default.create({
            userId: testUser._id,
            name: "Requested Book",
            description: "A book",
            category: "Books",
            reason: "Reading",
            quantity: 1,
            status: "pending",
        });
        mockAuthUser(testUser);
    });
    afterEach(async () => {
        await user_model_1.default.deleteMany({});
        await item_model_1.default.deleteMany({});
        await issuedItem_model_1.default.deleteMany({});
        await notofication_modal_1.default.deleteMany({});
        await itemRequest_model_1.default.deleteMany({});
        await requestedItem_model_1.default.deleteMany({});
        await category_model_1.default.deleteMany({});
        await queue_model_1.default.deleteMany({});
        await fine_model_1.default.deleteMany({});
    });
    afterAll(async () => {
        await role_model_1.default.deleteMany({});
    });
    /* ========================= GET /notifications ========================= */
    describe("GET /notifications", () => {
        it("should return 200 and the user's notifications", async () => {
            const mockNotifs = [notification.toObject()];
            mockedGetNotifications.mockResolvedValue(mockNotifs);
            const response = await (0, supertest_1.default)(index_1.app).get("/api/user/notifications");
            expect(response.status).toBe(200);
            expect(response.body.data.notifications).toHaveLength(1);
            expect(response.body.data.notifications[0].title).toBe("Test");
            expect(mockedGetNotifications).toHaveBeenCalledWith(testUser.id);
        });
        it("should return 200 and an empty array if no notifications", async () => {
            mockedGetNotifications.mockResolvedValue([]);
            const response = await (0, supertest_1.default)(index_1.app).get("/api/user/notifications");
            expect(response.status).toBe(200);
            expect(response.body.data.notifications).toEqual([]);
        });
        it("should return 401 Unauthorized if not logged in", async () => {
            unmockAuthUser();
            const response = await (0, supertest_1.default)(index_1.app).get("/api/user/notifications");
            expect(response.status).toBe(401);
        });
    });
    /* ========================= PATCH /notifications/mark-as-read ========================= */
    describe("PATCH /notifications/mark-as-read", () => {
        it("should return 200 and mark a specific notification as read", async () => {
            mockedMarkAsRead.mockResolvedValue("Notification marked as read");
            const response = await (0, supertest_1.default)(index_1.app)
                .patch("/api/user/notifications/mark-as-read")
                .send({ notificationId: notification._id.toString() });
            expect(response.status).toBe(200);
            expect(response.body.data.message).toBe("Notification marked as read");
            expect(mockedMarkAsRead).toHaveBeenCalledWith(testUser.id, notification._id.toString(), undefined); // markAll is undefined
        });
        it("should return 200 and mark all notifications as read", async () => {
            mockedMarkAsRead.mockResolvedValue("All notifications marked as read");
            const response = await (0, supertest_1.default)(index_1.app)
                .patch("/api/user/notifications/mark-as-read")
                .send({ markAll: true });
            expect(response.status).toBe(200);
            expect(response.body.data.message).toBe("All notifications marked as read");
            expect(mockedMarkAsRead).toHaveBeenCalledWith(testUser.id, undefined, true); // notificationId is undefined
        });
        it("should return 401 Unauthorized if not logged in", async () => {
            unmockAuthUser();
            const response = await (0, supertest_1.default)(index_1.app)
                .patch("/api/user/notifications/mark-as-read")
                .send({ notificationId: notification._id });
            expect(response.status).toBe(401);
        });
    });
    /* ========================= DELETE /notifications ========================= */
    describe("DELETE /notifications", () => {
        it("should return 200 and delete a specific notification", async () => {
            mockedDeleteNotification.mockResolvedValue("Notification deleted");
            const response = await (0, supertest_1.default)(index_1.app)
                .delete("/api/user/notifications")
                .send({ notificationId: notification._id.toString() });
            expect(response.status).toBe(200);
            expect(response.body.data.message).toBe("Notification deleted");
            expect(mockedDeleteNotification).toHaveBeenCalledWith(testUser.id, notification._id.toString(), undefined);
        });
        it("should return 200 and delete all notifications", async () => {
            mockedDeleteNotification.mockResolvedValue("All notifications deleted");
            const response = await (0, supertest_1.default)(index_1.app)
                .delete("/api/user/notifications")
                .send({ deleteAll: true });
            expect(response.status).toBe(200);
            expect(response.body.data.message).toBe("All notifications deleted");
            expect(mockedDeleteNotification).toHaveBeenCalledWith(testUser.id, undefined, true);
        });
        it("should return 401 Unauthorized if not logged in", async () => {
            unmockAuthUser();
            const response = await (0, supertest_1.default)(index_1.app)
                .delete("/api/user/notifications")
                .send({ notificationId: notification._id });
            expect(response.status).toBe(401);
        });
    });
    /* ========================= GET /items/issued ========================= */
    describe("GET /items/issued", () => {
        it("should return 200 and the user's issued items", async () => {
            const mockIssued = [issuedItem.toObject()];
            mockedGetIssuedItems.mockResolvedValue(mockIssued);
            const response = await (0, supertest_1.default)(index_1.app).get("/api/user/items/issued");
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].itemId.toString()).toBe(testItem._id.toString());
            expect(mockedGetIssuedItems).toHaveBeenCalledWith(testUser.id);
        });
        it("should return 404 if user not found (edge case)", async () => {
            mockedGetIssuedItems.mockRejectedValue({
                statusCode: 404,
                message: "No user found",
            });
            const response = await (0, supertest_1.default)(index_1.app).get("/api/user/items/issued");
            expect(response.status).toBe(404);
            expect(response.body.error).toBe("No user found");
        });
        it("should return 401 Unauthorized if not logged in", async () => {
            unmockAuthUser();
            const response = await (0, supertest_1.default)(index_1.app).get("/api/user/items/issued");
            expect(response.status).toBe(401);
        });
    });
    /* ========================= GET /:userId/requests (Old Item Requests) ========================= */
    describe("GET /:userId/requests", () => {
        let oldRequest;
        beforeEach(async () => {
            oldRequest = await itemRequest_model_1.default.create({
                userId: testUser._id,
                itemId: testItem._id,
                status: "pending",
            });
        });
        it("should return 200 and the user's old item requests", async () => {
            const mockRequests = [oldRequest.toObject()];
            mockedGetOldRequests.mockResolvedValue(mockRequests);
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/user/${testUser.id}/requests`);
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0]._id.toString()).toBe(oldRequest._id.toString());
            expect(mockedGetOldRequests).toHaveBeenCalledWith(testUser.id);
        });
        it("should return 403 Forbidden if requesting another user's old requests", async () => {
            const otherUserId = new mongoose_1.default.Types.ObjectId().toString();
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/user/${otherUserId}/requests`);
            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Forbidden. You can only access your own requests.");
        });
        it("should return 401 Unauthorized if not logged in", async () => {
            unmockAuthUser();
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/user/${testUser.id}/requests`);
            expect(response.status).toBe(401);
        });
    });
    /* ========================= GET /items/requested-items (New Item Requests) ========================= */
    describe("GET /items/requested-items", () => {
        // Uses NewItemRequest model
        it("should return 200 and the user's new item requests", async () => {
            const mockRequests = [newItemRequest.toObject()];
            mockedGetNewRequests.mockResolvedValue(mockRequests);
            const response = await (0, supertest_1.default)(index_1.app).get("/api/user/items/requested-items");
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].name).toBe("Requested Book");
            expect(mockedGetNewRequests).toHaveBeenCalledWith(testUser.id);
        });
        it("should return 401 Unauthorized if not logged in", async () => {
            unmockAuthUser();
            const response = await (0, supertest_1.default)(index_1.app).get("/api/user/items/requested-items");
            expect(response.status).toBe(401);
        });
    });
    /* ========================= GET /items/requested-item/:itemId (Specific New Request) ========================= */
    describe("GET /items/requested-item/:itemId", () => {
        it("should return 200 and the specific new item request", async () => {
            const mockRequest = newItemRequest.toObject();
            mockedGetSpecificNewRequest.mockResolvedValue(mockRequest);
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/user/items/requested-item/${newItemRequest._id}`);
            expect(response.status).toBe(200);
            expect(response.body.data.name).toBe("Requested Book");
            expect(mockedGetSpecificNewRequest).toHaveBeenCalledWith(newItemRequest._id.toString());
        });
        it("should return 401 Unauthorized if not logged in", async () => {
            unmockAuthUser();
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/user/items/requested-item/${newItemRequest._id}`);
            expect(response.status).toBe(401);
        });
    });
    /* ========================= DELETE /items/requested-item/:itemId (Delete New Request) ========================= */
    describe("DELETE /items/requested-item/:itemId", () => {
        it("should return 200 and delete the user's own pending request", async () => {
            mockedDeleteNewRequest.mockResolvedValue({
                message: "Requested item deleted successfully",
            });
            const response = await (0, supertest_1.default)(index_1.app).delete(`/api/user/items/requested-item/${newItemRequest._id}`);
            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Requested item deleted successfully");
            expect(mockedDeleteNewRequest).toHaveBeenCalledWith(newItemRequest._id.toString(), testUser.id);
        });
        it("should return 400 if trying to delete a non-pending request", async () => {
            await requestedItem_model_1.default.findByIdAndUpdate(newItemRequest._id, {
                status: "approved",
            });
            mockedDeleteNewRequest.mockRejectedValue(new Error("Only pending requests can be deleted"));
            const response = await (0, supertest_1.default)(index_1.app).delete(`/api/user/items/requested-item/${newItemRequest._id}`);
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Only pending requests can be deleted");
        });
        it("should return 400 if trying to delete another user's request", async () => {
            const otherUser = await user_model_1.default.create({
                email: "other@d.com",
                username: "d",
                password: "p",
                fullName: "Other User",
            });
            const otherRequest = await requestedItem_model_1.default.create({
                userId: otherUser._id,
                name: "Other Del Req",
                description: "Test description",
                category: "electronics",
                reason: "Need this item",
                quantity: 1,
            });
            mockedDeleteNewRequest.mockRejectedValue(new Error("Not authorized to delete this requested item"));
            const response = await (0, supertest_1.default)(index_1.app).delete(`/api/user/items/requested-item/${otherRequest._id}`);
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Not authorized to delete this requested item");
        });
        it("should return 401 Unauthorized if not logged in", async () => {
            unmockAuthUser();
            const response = await (0, supertest_1.default)(index_1.app).delete(`/api/user/items/requested-item/${newItemRequest._id}`);
            expect(response.status).toBe(401);
        });
    });
    /* ========================= GET /items/queues/queued ========================= */
    describe("GET /items/queues/queued", () => {
        it("should return 200 and the list of queues the user is in", async () => {
            const mockQueuedItem = {
                itemId: { title: "Queued Book" },
                queueMembers: [{ userId: testUser.id }],
            };
            mockedGetQueuedItems.mockResolvedValue([mockQueuedItem]);
            const response = await (0, supertest_1.default)(index_1.app).get("/api/user/items/queues/queued");
            expect(response.status).toBe(200);
            expect(response.body.queuedItems).toHaveLength(1);
            expect(mockedGetQueuedItems).toHaveBeenCalledWith(testUser.id);
        });
        it("should return 404 if user not found", async () => {
            mockedGetQueuedItems.mockRejectedValue({
                statusCode: 404,
                message: "No user found",
            });
            const response = await (0, supertest_1.default)(index_1.app).get("/api/user/items/queues/queued");
            expect(response.status).toBe(404);
            expect(response.body.error).toBe("No user found");
        });
        it("should return 401 Unauthorized if not logged in", async () => {
            unmockAuthUser();
            const response = await (0, supertest_1.default)(index_1.app).get("/api/user/items/queues/queued");
            expect(response.status).toBe(401);
        });
    });
    /* ========================= GET /items/:itemId/extend-period ========================= */
    describe("GET /items/:itemId/extend-period", () => {
        it("should return 200 and the updated issued item record", async () => {
            const extendedDueDate = new Date(issuedItem.dueDate);
            extendedDueDate.setDate(extendedDueDate.getDate() + 7);
            const mockUpdatedItem = {
                ...issuedItem.toObject(),
                dueDate: extendedDueDate,
                extensionCount: 1,
            };
            mockedExtendItem.mockResolvedValue(mockUpdatedItem);
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/user/items/${testItem._id}/extend-period`);
            expect(response.status).toBe(200);
            expect(response.body.updatedItem.extensionCount).toBe(1);
            expect(mockedExtendItem).toHaveBeenCalledWith(testItem._id.toString(), testUser.id);
        });
        it("should return 400 if max extensions reached", async () => {
            mockedExtendItem.mockRejectedValue({
                statusCode: 400,
                message: "Maximum extension limit reached",
            });
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/user/items/${testItem._id}/extend-period`);
            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Maximum extension limit reached");
        });
        it("should return 404 if no active issued item found for this user/item", async () => {
            mockedExtendItem.mockRejectedValue({
                statusCode: 404,
                message: "No active issued item found",
            });
            const fakeItemId = new mongoose_1.default.Types.ObjectId().toString();
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/user/items/${fakeItemId}/extend-period`);
            expect(response.status).toBe(404);
            expect(response.body.error).toBe("No active issued item found");
        });
        it("should return 401 Unauthorized if not logged in", async () => {
            unmockAuthUser();
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/user/items/${testItem._id}/extend-period`);
            expect(response.status).toBe(401);
        });
    });
    /* ========================= POST /items/:itemId/return-item ========================= */
    describe("POST /items/:itemId/return-item", () => {
        it("should return 200 and process a standard return", async () => {
            const mockResult = {
                issuedItem: { ...issuedItem.toObject(), status: "Returned" },
                fine: null,
            };
            mockedReturnItem.mockResolvedValue(mockResult);
            const response = await (0, supertest_1.default)(index_1.app)
                .post(`/api/user/items/${testItem._id}/return-item`)
                .send({ status: "Returned" }); // Body includes condition
            expect(response.status).toBe(200);
            expect(response.body.message).toContain("processed successfully");
            expect(response.body.item.status).toBe("Returned");
            expect(response.body.fine).toBeNull();
            expect(mockedReturnItem).toHaveBeenCalledWith(testItem._id.toString(), testUser.id, "Returned");
        });
        it("should return 200 and create a fine if item is returned overdue", async () => {
            // Make item overdue for the mock
            const overdueDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
            await issuedItem_model_1.default.findByIdAndUpdate(issuedItem._id, {
                dueDate: overdueDate,
            });
            const mockFine = {
                _id: "fine1",
                reason: "Overdue",
                amountIncurred: 10,
                status: "Outstanding",
            };
            const mockResult = {
                issuedItem: {
                    ...issuedItem.toObject(),
                    status: "Returned",
                    dueDate: overdueDate,
                },
                fine: mockFine,
            };
            mockedReturnItem.mockResolvedValue(mockResult);
            const response = await (0, supertest_1.default)(index_1.app)
                .post(`/api/user/items/${testItem._id}/return-item`)
                .send({ status: "Returned" });
            expect(response.status).toBe(200);
            expect(response.body.item.status).toBe("Returned");
            expect(response.body.fine).toEqual(mockFine);
            expect(mockedReturnItem).toHaveBeenCalledWith(testItem._id.toString(), testUser.id, "Returned");
        });
        it("should return 200 and create a fine if item is returned Damaged", async () => {
            const mockFine = {
                _id: "fine2",
                reason: "Damaged",
                amountIncurred: 25,
                status: "Outstanding",
            };
            const mockResult = {
                issuedItem: { ...issuedItem.toObject(), status: "Returned" },
                fine: mockFine,
            };
            mockedReturnItem.mockResolvedValue(mockResult);
            const response = await (0, supertest_1.default)(index_1.app)
                .post(`/api/user/items/${testItem._id}/return-item`)
                .send({ status: "Damaged" });
            expect(response.status).toBe(200);
            expect(response.body.item.status).toBe("Returned");
            expect(response.body.fine).toEqual(mockFine);
            expect(mockedReturnItem).toHaveBeenCalledWith(testItem._id.toString(), testUser.id, "Damaged");
        });
        it("should return 404 if no active issued item found", async () => {
            mockedReturnItem.mockRejectedValue({
                statusCode: 404,
                message: "No active issued item found",
            });
            const response = await (0, supertest_1.default)(index_1.app)
                .post(`/api/user/items/${testItem._id}/return-item`)
                .send({ status: "Returned" });
            expect(response.status).toBe(404);
            expect(response.body.error).toBe("No active issued item found");
        });
        it("should return 401 Unauthorized if not logged in", async () => {
            unmockAuthUser();
            const response = await (0, supertest_1.default)(index_1.app)
                .post(`/api/user/items/${testItem._id}/return-item`)
                .send({ status: "Returned" });
            expect(response.status).toBe(401);
        });
    });
});
