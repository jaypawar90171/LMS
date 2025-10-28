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
const item_model_1 = __importDefault(require("../models/item.model"));
const category_model_1 = __importDefault(require("../models/category.model"));
const index_1 = require("../index");
const fs_1 = __importDefault(require("fs"));
const auth_validation_1 = require("../validations/auth.validation");
jest.mock("fs", () => ({
    ...jest.requireActual("fs"), // Import and retain default behavior
    unlinkSync: jest.fn(), // Mock unlinkSync
}));
jest.mock("../validations/auth.validation", () => ({
    InventoryItemsSchema: { parse: jest.fn((data) => data) },
    InventoryItemsUpdateSchema: { parse: jest.fn((data) => data) },
    CategorySchema: { parse: jest.fn((data) => data) },
}));
jest.mock("../middleware/auth.middleware", () => ({
    authUser: (req, res, next) => {
        req.user = { id: new mongoose_1.default.Types.ObjectId().toString() };
        next();
    },
}));
jest.mock("../config/upload", () => ({
    ...jest.requireActual("../config/upload"),
    upload: {
        single: jest.fn(() => (req, res, next) => {
            if (req.headers["content-type"]?.includes("multipart/form-data")) {
                req.file = {
                    path: "fake/path/to/file.jpg",
                    originalname: "file.jpg",
                };
            }
            next();
        }),
    },
    uploadFile: jest.fn(),
}));
const uploadConfig = __importStar(require("../config/upload"));
const mockedUploadFile = uploadConfig.uploadFile;
const mockedFsUnlinkSync = fs_1.default.unlinkSync;
describe("Inventory API (/api/admin/inventory)", () => {
    let bookCategory;
    let electronicsCategory;
    let testItem;
    beforeEach(async () => {
        [bookCategory, electronicsCategory] = await category_model_1.default.insertMany([
            { name: "Books", description: "All books" },
            { name: "Electronics", description: "All electronics" },
        ]);
        testItem = await item_model_1.default.create({
            title: "Sample Book",
            isbnOrIdentifier: "123456789",
            categoryId: bookCategory._id,
            price: new mongoose_1.default.Types.Decimal128("19.99"),
            quantity: 10,
            availableCopies: 10,
            status: "Available",
            barcode: "BC-123",
        });
        mockedUploadFile.mockClear();
        mockedFsUnlinkSync.mockClear();
    });
    afterEach(async () => {
        await item_model_1.default.deleteMany({});
        await category_model_1.default.deleteMany({});
    });
    /* ========================= GET /inventory/items ========================= */
    describe("GET /inventory/items", () => {
        it("should return 200 and a paginated list of items", async () => {
            const response = await (0, supertest_1.default)(index_1.app).get("/api/admin/inventory/items");
            expect(response.status).toBe(200);
            expect(response.body.inventoryItems).toHaveLength(1);
            expect(response.body.inventoryItems[0].title).toBe("Sample Book");
            expect(response.body.pagination.totalItems).toBe(1);
        });
    });
    /* ========================= POST /inventory/items ========================= */
    describe("POST /inventory/items", () => {
        it("should return 201 and the new item (with file upload)", async () => {
            const newItemData = {
                title: "New Gadget",
                categoryId: electronicsCategory._id.toString(),
                price: "199.99",
                quantity: "5",
                availableCopies: "5",
                status: "Available",
            };
            mockedUploadFile.mockResolvedValue({
                secure_url: "http://cloudinary.com/image.jpg",
            });
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/admin/inventory/items")
                .field("title", newItemData.title)
                .field("categoryId", newItemData.categoryId)
                .field("price", newItemData.price)
                .field("quantity", newItemData.quantity)
                .field("availableCopies", newItemData.availableCopies)
                .field("status", newItemData.status)
                .set("Content-Type", "multipart/form-data");
            expect(response.status).toBe(201);
            expect(response.body.data.title).toBe("New Gadget");
            expect(response.body.data.mediaUrl).toBe("http://cloudinary.com/image.jpg");
            expect(response.body.data.barcode).toBeDefined();
            expect(mockedFsUnlinkSync).toHaveBeenCalledWith("fake/path/to/file.jpg");
        });
        it('should return 400 if category is "Books" but ISBN is missing', async () => {
            auth_validation_1.InventoryItemsSchema.parse.mockImplementationOnce(() => {
                throw { name: "ZodError", errors: [{ message: "ISBN is required" }] };
            });
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/admin/inventory/items")
                .send({
                title: "Another Book",
                categoryId: bookCategory._id.toString(),
                price: "10.00",
                quantity: 2,
                availableCopies: 2,
            });
            expect(response.status).toBe(400);
            expect(response.body.errors[0].message).toBe("ISBN is required");
        });
        it("should return 409 if ISBN/Barcode already exists", async () => {
            const duplicateItem = {
                title: "Duplicate Book",
                isbnOrIdentifier: "123456789",
                categoryId: bookCategory._id.toString(),
                price: "25.00",
                quantity: 1,
                availableCopies: 1,
            };
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/admin/inventory/items")
                .send(duplicateItem);
            expect(response.status).toBe(409);
            expect(response.body.message).toContain("Duplicate entry");
        });
    });
    /* ========================= GET /inventory/items/:itemId ========================= */
    describe("GET /inventory/items/:itemId", () => {
        it("should return 200 and the item details", async () => {
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/admin/inventory/items/${testItem._id}`);
            expect(response.status).toBe(200);
            expect(response.body.item.title).toBe("Sample Book");
        });
        it("should return 400 if itemId is invalid", async () => {
            const response = await (0, supertest_1.default)(index_1.app).get("/api/admin/inventory/items/invalid-id");
            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Invalid itemId");
        });
        it("should return 404 if item does not exist", async () => {
            const validObjectId = new mongoose_1.default.Types.ObjectId().toString();
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/admin/inventory/items/${validObjectId}`);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("item not found");
        });
    });
    /* ========================= PUT /inventory/items/:itemId ========================= */
    describe("PUT /inventory/items/:itemId", () => {
        it("should return 200 and the updated item", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/inventory/items/${testItem._id}`)
                .send({ title: "Updated Title" });
            expect(response.status).toBe(200);
            expect(response.body.data.title).toBe("Updated Title");
            const itemInDb = await item_model_1.default.findById(testItem._id);
            expect(itemInDb?.title).toBe("Updated Title");
        });
        it("should return 404 if item does not exist", async () => {
            const validObjectId = new mongoose_1.default.Types.ObjectId().toString();
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/inventory/items/${validObjectId}`)
                .send({ title: "Updated Title" });
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("No such item exists");
        });
    });
    /* ========================= DELETE /inventory/items/:itemId ========================= */
    describe("DELETE /inventory/items/:itemId", () => {
        it("should return 200 and the deleted item", async () => {
            const response = await (0, supertest_1.default)(index_1.app).delete(`/api/admin/inventory/items/${testItem._id}`);
            expect(response.status).toBe(200);
            expect(response.body.data.title).toBe("Sample Book");
            const itemInDb = await item_model_1.default.findById(testItem._id);
            expect(itemInDb).toBeNull();
        });
        it("should return 404 if item does not exist", async () => {
            const validObjectId = new mongoose_1.default.Types.ObjectId().toString();
            const response = await (0, supertest_1.default)(index_1.app).delete(`/api/admin/inventory/items/${validObjectId}`);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("No such item exists");
        });
        it.todo("should return 400 if the item is currently issued");
    });
    /* ========================= GET /inventory/categories ========================= */
    describe("GET /inventory/categories", () => {
        it("should return 200 and a flat list of categories by default", async () => {
            const response = await (0, supertest_1.default)(index_1.app).get("/api/admin/inventory/categories");
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.data[0].isParent).toBe(true);
        });
        it("should return 200 and a nested tree structure when ?tree=true", async () => {
            await category_model_1.default.create({
                name: "Sci-Fi",
                parentCategoryId: bookCategory._id,
            });
            const response = await (0, supertest_1.default)(index_1.app).get("/api/admin/inventory/categories?tree=true");
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(2);
            const books = response.body.data.find((c) => c.name === "Books");
            expect(books.children).toHaveLength(1);
            expect(books.children[0].name).toBe("Sci-Fi");
        });
    });
    /* ========================= GET /inventory/categories/:id ========================= */
    describe("GET /inventory/categories/:id", () => {
        it("should return 200 and the category with its children", async () => {
            const subCategory = await category_model_1.default.create({
                name: "Sci-Fi",
                parentCategoryId: bookCategory._id,
            });
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/admin/inventory/categories/${bookCategory._id}`);
            expect(response.status).toBe(200);
            expect(response.body.data.name).toBe("Books");
            expect(response.body.data.children).toHaveLength(1);
            expect(response.body.data.children[0].name).toBe("Sci-Fi");
        });
        it("should return 404 if category not found", async () => {
            const validObjectId = new mongoose_1.default.Types.ObjectId().toString();
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/admin/inventory/categories/${validObjectId}`);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Category not found");
        });
    });
    /* ========================= POST /inventory/categories ========================= */
    describe("POST /inventory/categories", () => {
        it("should return 200 and the newly created parent category", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/admin/inventory/categories")
                .send({ name: "Magazines", description: "All magazines" });
            expect(response.status).toBe(200);
            expect(response.body.category.name).toBe("Magazines");
        });
        it("should return 200 and the newly created child category", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/admin/inventory/categories")
                .send({
                name: "Laptops",
                parentCategoryId: electronicsCategory._id.toString(),
            });
            expect(response.status).toBe(200);
            expect(response.body.category.name).toBe("Laptops");
            expect(response.body.category.parentCategoryId.name).toBe("Electronics");
        });
        it("should return 400 if attempting to create a 3rd-level category", async () => {
            const subCategory = await category_model_1.default.create({
                name: "Laptops",
                parentCategoryId: electronicsCategory._id,
            });
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/admin/inventory/categories")
                .send({
                name: "Gaming Laptops",
                parentCategoryId: subCategory._id.toString(),
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain("Maximum hierarchy depth is 2 levels");
        });
        it("should return 409 if category name already exists at that level", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/admin/inventory/categories")
                .send({ name: "Books" });
            expect(response.status).toBe(409);
            expect(response.body.message).toContain("already exists at this level");
        });
    });
    /* ========================= PUT /inventory/categories/:id ========================= */
    describe("PUT /inventory/categories/:id", () => {
        it("should return 200 and the updated category", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/inventory/categories/${bookCategory._id}`)
                .send({ description: "All books and novels" });
            expect(response.status).toBe(200);
            expect(response.body.category.description).toBe("All books and novels");
        });
        it("should return 409 if renaming to a conflicting name", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/inventory/categories/${bookCategory._id}`)
                .send({ name: "Electronics" });
            expect(response.status).toBe(409);
            expect(response.body.message).toContain("already exists at this level");
        });
        it("should return 404 if category not found", async () => {
            const validObjectId = new mongoose_1.default.Types.ObjectId().toString();
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/inventory/categories/${validObjectId}`)
                .send({ name: "New Name" });
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Category not found");
        });
    });
    /* ========================= DELETE /inventory/categories/:id ========================= */
    describe("DELETE /inventory/categories/:id", () => {
        it("should return 200 and a success message", async () => {
            await item_model_1.default.deleteMany({});
            const response = await (0, supertest_1.default)(index_1.app).delete(`/api/admin/inventory/categories/${bookCategory._id}`);
            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Category deleted successfully");
        });
        it("should return 400 if the category has child categories", async () => {
            await category_model_1.default.create({
                name: "Laptops",
                parentCategoryId: electronicsCategory._id,
            });
            const response = await (0, supertest_1.default)(index_1.app).delete(`/api/admin/inventory/categories/${electronicsCategory._id}`);
            expect(response.status).toBe(400);
            expect(response.body.message).toContain("has child categories");
        });
        it("should return 400 if the category has items assigned to it", async () => {
            const response = await (0, supertest_1.default)(index_1.app).delete(`/api/admin/inventory/categories/${bookCategory._id}`);
            expect(response.status).toBe(400);
            expect(response.body.message).toContain("has inventory items");
        });
    });
});
