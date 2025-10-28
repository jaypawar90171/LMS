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
const item_model_1 = __importDefault(require("../models/item.model"));
const category_model_1 = __importDefault(require("../models/category.model"));
const issuedItem_model_1 = __importDefault(require("../models/issuedItem.model"));
const queue_model_1 = __importDefault(require("../models/queue.model"));
const userService = __importStar(require("../services/user.service"));
jest.mock("../validations/auth.validation", () => ({
    itemRequestUpdateSchema: { parse: jest.fn((data) => data) },
}));
jest.mock("../middleware/auth.middleware", () => ({
    authUser: jest.fn((req, res, next) => next()),
}));
jest.mock("../services/user.service", () => ({
    getCategoriesService: jest.fn(),
    getCategoryItemsService: jest.fn(),
    getItemService: jest.fn(),
    createIssueRequestService: jest.fn(),
    getNewArrivalsService: jest.fn(),
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
const mockedGetCategories = userService.getCategoriesService;
const mockedGetCategoryItems = userService.getCategoryItemsService;
const mockedGetItem = userService.getItemService;
const mockedCreateIssueRequest = userService.createIssueRequestService;
const mockedGetNewArrivals = userService.getNewArrivalsService;
describe("User API - Inventory & Requests", () => {
    let testUser;
    let bookCategory;
    let availableItem;
    let unavailableItem;
    beforeAll(async () => {
        await role_model_1.default.insertMany([
            { roleName: "employee", description: "Employee Role" },
        ]);
    });
    beforeEach(async () => {
        jest.clearAllMocks();
        unmockAuthUser();
        const roles = await role_model_1.default.find({});
        testUser = await user_model_1.default.create({
            _id: new mongoose_1.default.Types.ObjectId(),
            fullName: "Inventory User",
            email: "inv@example.com",
            username: "invuser",
            password: "password123",
            status: "Active",
            roles: roles.map((r) => r._id),
        });
        testUser = testUser.toObject();
        testUser.id = testUser._id.toString();
        bookCategory = await category_model_1.default.create({
            name: "Books",
            description: "Fiction",
        });
        availableItem = await item_model_1.default.create({
            title: "Available Novel",
            categoryId: bookCategory._id,
            price: "15.00",
            quantity: 5,
            availableCopies: 1,
            status: "Available",
            barcode: "AV123",
        });
        unavailableItem = await item_model_1.default.create({
            title: "Unavailable Textbook",
            categoryId: bookCategory._id,
            price: "50.00",
            quantity: 2,
            availableCopies: 0,
            status: "Issued",
            barcode: "UNAV456",
        });
        mockAuthUser(testUser);
    });
    afterEach(async () => {
        await user_model_1.default.deleteMany({});
        await item_model_1.default.deleteMany({});
        await category_model_1.default.deleteMany({});
        await issuedItem_model_1.default.deleteMany({});
        await queue_model_1.default.deleteMany({});
    });
    afterAll(async () => {
        await role_model_1.default.deleteMany({});
    });
    /* ========================= GET /inventory/categories ========================= */
    describe("GET /inventory/categories", () => {
        it("should return 200 and a list of categories", async () => {
            const mockCategories = [
                { _id: "68f8d489ed280f904b854997", name: "Books" },
            ];
            mockedGetCategories.mockResolvedValue(mockCategories);
            const response = await (0, supertest_1.default)(index_1.app).get("/api/user/inventory/categories");
            expect(response.status).toBe(200);
            expect(response.body.message).toContain("fetched successfully");
            expect(response.body.data).toEqual(mockCategories);
            expect(mockedGetCategories).toHaveBeenCalledTimes(1);
        });
        it("should return 404 if no categories are found", async () => {
            mockedGetCategories.mockRejectedValue({
                statusCode: 404,
                message: "No categories found",
            });
            const response = await (0, supertest_1.default)(index_1.app).get("/api/user/inventory/categories");
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("No categories found");
        });
        it("should return 401 Unauthorized if user is not logged in", async () => {
            unmockAuthUser();
            const response = await (0, supertest_1.default)(index_1.app).get("/api/user/inventory/categories");
            expect(response.status).toBe(401);
        });
    });
    /* ========================= GET /inventory/categories/items/:categoryId ========================= */
    describe("GET /inventory/categories/items/:categoryId", () => {
        it("should return 200 and items for a valid categoryId", async () => {
            const mockItems = [availableItem.toObject(), unavailableItem.toObject()];
            mockedGetCategoryItems.mockResolvedValue(mockItems);
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/user/inventory/categories/items/${bookCategory._id}`);
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(2);
            expect(mockedGetCategoryItems).toHaveBeenCalledWith(bookCategory._id.toString());
        });
        it("should return 400 if categoryId is invalid", async () => {
            const response = await (0, supertest_1.default)(index_1.app).get("/api/user/inventory/categories/items/invalid-id");
            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Invalid categoryId");
        });
        it("should return 404 if category is not found", async () => {
            const fakeId = new mongoose_1.default.Types.ObjectId().toString();
            mockedGetCategoryItems.mockRejectedValue({
                statusCode: 404,
                message: "No categories found",
            });
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/user/inventory/categories/items/${fakeId}`);
            expect(response.status).toBe(404);
            expect(response.body.error).toBe("No categories found");
        });
        it("should return 404 if category exists but has no items", async () => {
            const emptyCategory = await category_model_1.default.create({ name: "Empty" });
            mockedGetCategoryItems.mockRejectedValue({
                statusCode: 404,
                message: "No items found for this category",
            });
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/user/inventory/categories/items/${emptyCategory._id}`);
            expect(response.status).toBe(404);
            expect(response.body.error).toBe("No items found for this category");
        });
        it("should return 401 Unauthorized if user is not logged in", async () => {
            unmockAuthUser();
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/user/inventory/categories/items/${bookCategory._id}`);
            expect(response.status).toBe(401);
        });
    });
    /* ========================= GET /inventory/categories/:itemId ========================= */
    describe("GET /inventory/categories/:itemId (Get Specific Item)", () => {
        it("should return 200 and the specific item details", async () => {
            const mockItemData = availableItem.toObject();
            mockedGetItem.mockResolvedValue(mockItemData);
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/user/inventory/categories/${availableItem._id}`);
            expect(response.status).toBe(200);
            expect(response.body.data.title).toBe(availableItem.title);
            expect(mockedGetItem).toHaveBeenCalledWith(availableItem._id.toString());
        });
        it("should return 400 if itemId is invalid", async () => {
            const response = await (0, supertest_1.default)(index_1.app).get("/api/user/inventory/categories/invalid-id");
            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Invalid itemId");
        });
        it("should return 404 if item is not found", async () => {
            const fakeId = new mongoose_1.default.Types.ObjectId().toString();
            mockedGetItem.mockRejectedValue({
                statusCode: 404,
                message: "No items found for this category",
            });
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/user/inventory/categories/${fakeId}`);
            expect(response.status).toBe(404);
            expect(response.body.error).toBe("No items found for this category");
        });
        it("should return 401 Unauthorized if user is not logged in", async () => {
            unmockAuthUser();
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/user/inventory/categories/${availableItem._id}`);
            expect(response.status).toBe(401);
        });
    });
    /* ========================= POST /issue-requests ========================= */
    describe("POST /issue-requests", () => {
        it("should return 201 and issue item immediately if available", async () => {
            const mockResult = {
                message: "Item issued successfully",
                type: "immediate",
                issuedItem: {
                    _id: "issued123",
                    itemTitle: availableItem.title,
                    dueDate: new Date(),
                },
            };
            mockedCreateIssueRequest.mockResolvedValue(mockResult);
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/user/issue-requests")
                .send({ itemId: availableItem._id.toString() });
            expect(response.status).toBe(201);
            expect(response.body.message).toBe(mockResult.message);
            expect(response.body.data.type).toBe("immediate");
            expect(response.body.data.issuedItem).toBeDefined();
            expect(mockedCreateIssueRequest).toHaveBeenCalledWith(testUser.id, availableItem._id.toString());
        });
        it("should return 201 and add user to queue if item is unavailable", async () => {
            const mockResult = {
                message: "Item is currently unavailable. You have been added to the queue...",
                type: "queued",
                queuePosition: 1,
            };
            mockedCreateIssueRequest.mockResolvedValue(mockResult);
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/user/issue-requests")
                .send({ itemId: unavailableItem._id.toString() });
            expect(response.status).toBe(201);
            expect(response.body.message).toContain("added to the queue");
            expect(response.body.data.type).toBe("queued");
            expect(response.body.data.queuePosition).toBe(1);
            expect(mockedCreateIssueRequest).toHaveBeenCalledWith(testUser.id, unavailableItem._id.toString());
        });
        it("should return 400 if itemId is missing", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/user/issue-requests")
                .send({}); // Missing itemId
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Item ID is required");
        });
        it("should return 404 if item does not exist", async () => {
            const fakeId = new mongoose_1.default.Types.ObjectId().toString();
            mockedCreateIssueRequest.mockRejectedValue({
                statusCode: 404,
                message: "Item not found",
            });
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/user/issue-requests")
                .send({ itemId: fakeId });
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Item not found");
        });
        it("should return 400 if user is ineligible (e.g., overdue items)", async () => {
            mockedCreateIssueRequest.mockRejectedValue({
                statusCode: 400,
                message: "User has 1 overdue item(s)",
            });
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/user/issue-requests")
                .send({ itemId: availableItem._id.toString() });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("User has 1 overdue item(s)");
        });
        it("should return 401 Unauthorized if user is not logged in", async () => {
            unmockAuthUser();
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/user/issue-requests")
                .send({ itemId: availableItem._id.toString() });
            expect(response.status).toBe(401);
        });
    });
    /* ========================= GET /items/new-arrivals ========================= */
    describe("GET /items/new-arrivals", () => {
        it("should return 200 and a list of new arrival items", async () => {
            const mockArrivals = JSON.parse(JSON.stringify([availableItem.toObject()]));
            mockedGetNewArrivals.mockResolvedValue(mockArrivals);
            const response = await (0, supertest_1.default)(index_1.app).get("/api/user/items/new-arrivals");
            expect(response.status).toBe(200);
            expect(response.body.items).toEqual(mockArrivals);
            expect(mockedGetNewArrivals).toHaveBeenCalledTimes(1);
        });
        it("should return 401 Unauthorized if user is not logged in", async () => {
            unmockAuthUser();
            const response = await (0, supertest_1.default)(index_1.app).get("/api/user/items/new-arrivals");
            expect(response.status).toBe(401);
        });
    });
    /* ========================= GET /search/items ========================= */
    describe("GET /search/items", () => {
        it("should return 200 and items matching the query", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .get("/api/user/search/items")
                .query({ query: "Novel" });
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].title).toBe("Available Novel");
        });
        it("should return 200 and items matching the category", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .get("/api/user/search/items")
                .query({ category: bookCategory._id.toString() });
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(2);
        });
        it("should return 200 and items matching the status", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .get("/api/user/search/items")
                .query({ status: "Issued" });
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].title).toBe("Unavailable Textbook");
        });
        it("should return 200 and items matching multiple filters", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .get("/api/user/search/items")
                .query({ query: "Available", status: "Available" });
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].title).toBe("Available Novel");
        });
        it("should return 200 and an empty array if no items match", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .get("/api/user/search/items")
                .query({ query: "NonExistent" });
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(0);
        });
        it("should return 401 Unauthorized if user is not logged in", async () => {
            unmockAuthUser();
            const response = await (0, supertest_1.default)(index_1.app)
                .get("/api/user/search/items")
                .query({ query: "Novel" });
            expect(response.status).toBe(401);
        });
    });
});
