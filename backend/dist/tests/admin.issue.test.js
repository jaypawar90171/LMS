"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = require("../index");
const user_model_1 = __importDefault(require("../models/user.model"));
const item_model_1 = __importDefault(require("../models/item.model"));
const issuedItem_model_1 = __importDefault(require("../models/issuedItem.model"));
const itemRequest_model_1 = __importDefault(require("../models/itemRequest.model"));
const category_model_1 = __importDefault(require("../models/category.model"));
jest.mock("../middleware/auth.middleware", () => ({
    authUser: jest.fn((req, res, next) => {
        req.user = {
            id: new mongoose_1.default.Types.ObjectId().toString(),
            _id: new mongoose_1.default.Types.ObjectId(),
            email: "admin@example.com",
        };
        next();
    }),
}));
describe("Issue/Return & Queue API", () => {
    let testUser;
    let testItem;
    let issuedItem;
    let pendingRequest;
    beforeEach(async () => {
        testUser = await user_model_1.default.create({
            fullName: "Test User",
            email: "test@example.com",
            username: "testuser",
            password: "password123",
            status: "Active",
        });
        const category = await category_model_1.default.create({ name: "Books" });
        testItem = await item_model_1.default.create({
            title: "Available Book",
            categoryId: category._id,
            price: new mongoose_1.default.Types.Decimal128("10.00"),
            quantity: 5,
            availableCopies: 5,
            status: "Available",
            barcode: "ITEM-123",
        });
        pendingRequest = await itemRequest_model_1.default.create({
            userId: testUser._id,
            itemId: testItem._id,
            status: "pending",
        });
        issuedItem = await issuedItem_model_1.default.create({
            userId: testUser._id,
            itemId: testItem._id,
            issuedDate: new Date(),
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            status: "Issued",
        });
    });
    afterEach(async () => {
        await user_model_1.default.deleteMany({});
        await item_model_1.default.deleteMany({});
        await issuedItem_model_1.default.deleteMany({});
        await itemRequest_model_1.default.deleteMany({});
        await category_model_1.default.deleteMany({});
    });
    /* ========================= GET /issue-requests/pending ========================= */
    describe("GET /issue-requests/pending", () => {
        it("should return 200 and a list of pending requests", async () => {
            const response = await (0, supertest_1.default)(index_1.app).get("/api/admin/issue-requests/pending");
            console.log("Response status:", response.status);
            console.log("Response body:", response.body);
            expect(response.status).toBe(200);
            expect(response.body.requests).toHaveLength(1);
            expect(response.body.requests[0]._id).toBe(pendingRequest._id.toString());
        });
    });
    /* ========================= POST /issue-item (Direct Issue) ========================= */
    describe("POST /issue-item", () => {
        it("should return 200, issue the item, and decrement availableCopies", async () => {
            const response = await (0, supertest_1.default)(index_1.app).post("/api/admin/issue-item").send({
                userId: testUser._id.toString(),
                itemId: testItem._id.toString(),
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Item issued successfully");
            expect(response.body.issuedItem.itemTitle).toBe("Available Book");
            // Check database
            const itemInDb = await item_model_1.default.findById(testItem._id);
            expect(itemInDb?.availableCopies).toBe(4);
        });
        it("should return 400 if item is not available", async () => {
            await item_model_1.default.findByIdAndUpdate(testItem._id, {
                availableCopies: 0,
            });
            const response = await (0, supertest_1.default)(index_1.app).post("/api/admin/issue-item").send({
                userId: testUser._id.toString(),
                itemId: testItem._id.toString(),
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Item not available");
        });
        it("should return 400 if user has overdue items", async () => {
            await issuedItem_model_1.default.create({
                userId: testUser._id,
                itemId: testItem._id,
                status: "Issued",
                dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            });
            const response = await (0, supertest_1.default)(index_1.app).post("/api/admin/issue-item").send({
                userId: testUser._id.toString(),
                itemId: testItem._id.toString(),
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain("overdue item(s)");
        });
        it("should return 404 if user not found", async () => {
            const fakeUserId = new mongoose_1.default.Types.ObjectId().toString();
            const response = await (0, supertest_1.default)(index_1.app).post("/api/admin/issue-item").send({
                userId: fakeUserId,
                itemId: testItem._id.toString(),
            });
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("User not found");
        });
    });
    /* ========================= PUT /issue-requests/:requestId/approve ========================= */
    describe("PUT /issue-requests/:requestId/approve", () => {
        it("should return 200, approve the request, and issue the item", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/issue-requests/${pendingRequest._id}/approve`)
                .send();
            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Issue request approved successfully");
            const reqInDb = await itemRequest_model_1.default.findById(pendingRequest._id);
            expect(reqInDb?.status).toBe("approved");
            const itemInDb = await item_model_1.default.findById(testItem._id);
            expect(itemInDb?.availableCopies).toBe(4); // Was 5 now 4
        });
        it("should return 400 if request is already processed", async () => {
            await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/issue-requests/${pendingRequest._id}/approve`)
                .send();
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/issue-requests/${pendingRequest._id}/approve`)
                .send();
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Request already processed");
        });
        it("should return 400 if item is no longer available", async () => {
            await item_model_1.default.findByIdAndUpdate(testItem._id, {
                availableCopies: 0,
            });
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/issue-requests/${pendingRequest._id}/approve`)
                .send();
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Item no longer available");
        });
    });
    /* ========================= PUT /issue-requests/:requestId/reject ========================= */
    describe("PUT /issue-requests/:requestId/reject", () => {
        it("should return 200 and reject the request", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/issue-requests/${pendingRequest._id}/reject`)
                .send();
            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Issue request rejected");
            const reqInDb = await itemRequest_model_1.default.findById(pendingRequest._id);
            expect(reqInDb?.status).toBe("rejected");
            const itemInDb = await item_model_1.default.findById(testItem._id);
            expect(itemInDb?.availableCopies).toBe(5);
        });
    });
    /* ========================= POST /issued-items/:issuedItemId/extend ========================= */
    describe("POST /issued-items/:issuedItemId/extend", () => {
        it("should return 200 and extend the due date", async () => {
            const oldDueDate = issuedItem.dueDate;
            const extensionDays = 7;
            const response = await (0, supertest_1.default)(index_1.app)
                .post(`/api/admin/issued-items/${issuedItem._id}/extend`)
                .send({ extensionDays });
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            const updatedIssuedItem = await issuedItem_model_1.default.findById(issuedItem._id);
            expect(updatedIssuedItem?.extensionCount).toBe(1);
            const expectedDueDate = new Date(oldDueDate);
            expectedDueDate.setDate(expectedDueDate.getDate() + extensionDays);
            expect(updatedIssuedItem?.dueDate.toDateString()).toBe(expectedDueDate.toDateString());
        });
        it("should return 400 if extensionDays is missing or invalid", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .post(`/api/admin/issued-items/${issuedItem._id}/extend`)
                .send({ extensionDays: -5 });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain("Valid extension days (positive number) is required");
        });
        it("should return 400 if max extensions reached", async () => {
            await issuedItem_model_1.default.findByIdAndUpdate(issuedItem._id, {
                extensionCount: 2,
                maxExtensionAllowed: 2,
            });
            const response = await (0, supertest_1.default)(index_1.app)
                .post(`/api/admin/issued-items/${issuedItem._id}/extend`)
                .send({ extensionDays: 7 });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain("Maximum extensions");
        });
        it("should return 400 if item is already returned", async () => {
            await issuedItem_model_1.default.findByIdAndUpdate(issuedItem._id, {
                status: "Returned",
            });
            const response = await (0, supertest_1.default)(index_1.app)
                .post(`/api/admin/issued-items/${issuedItem._id}/extend`)
                .send({ extensionDays: 7 });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Cannot extend period for returned item");
        });
    });
});
