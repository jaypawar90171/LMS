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
const item_model_1 = __importDefault(require("../models/item.model"));
const category_model_1 = __importDefault(require("../models/category.model"));
jest.mock("../services/admin.service", () => ({
    generateBarcodeString: jest.fn(),
    generateBarcodePDF: jest.fn(),
}));
jest.mock("../middleware/auth.middleware", () => ({
    authUser: (req, res, next) => {
        req.user = { id: new mongoose_1.default.Types.ObjectId().toString() };
        next();
    },
}));
const adminService = __importStar(require("../services/admin.service"));
const mockedGenerateBarcodeString = adminService.generateBarcodeString;
const mockedGenerateBarcodePDF = adminService.generateBarcodePDF;
describe("Barcode API (/api/admin/barcode)", () => {
    let testItem;
    beforeEach(async () => {
        jest.clearAllMocks();
        const category = await category_model_1.default.create({ name: "Test" });
        testItem = await item_model_1.default.create({
            title: "Barcode Item",
            categoryId: category._id,
            price: new mongoose_1.default.Types.Decimal128("10.00"),
            quantity: 1,
            availableCopies: 1,
            barcode: "UNIQUE-BARCODE-123",
            isbnOrIdentifier: "TEST-ISBN-123",
            status: "Available",
            mediaUrl: "https://example.com/image.jpg",
        });
    });
    afterEach(async () => {
        await item_model_1.default.deleteMany({});
        await category_model_1.default.deleteMany({});
    });
    /* ========================= GET /barcode/generate ========================= */
    describe("GET /barcode/generate", () => {
        it("should return 200 and a new barcode string from the service", async () => {
            const mockBarcode = "ITEM-UUID-TEST-123";
            mockedGenerateBarcodeString.mockResolvedValue(mockBarcode);
            const response = await (0, supertest_1.default)(index_1.app).get("/api/admin/barcode/generate");
            expect(response.status).toBe(200);
            expect(response.body.barcode).toBe(mockBarcode);
            expect(mockedGenerateBarcodeString).toHaveBeenCalledTimes(1);
        });
        it("should return 500 if the barcode generation service fails", async () => {
            mockedGenerateBarcodeString.mockRejectedValue(new Error("Generation failed"));
            const response = await (0, supertest_1.default)(index_1.app).get("/api/admin/barcode/generate");
            expect(response.status).toBe(500);
            expect(response.body.error).toBe("Generation failed");
        });
    });
    /* ========================= GET /barcode/download/:itemId ========================= */
    describe("GET /barcode/download/:itemId", () => {
        it("should return 200, PDF headers, and call the PDF service", async () => {
            mockedGenerateBarcodePDF.mockImplementation(async (itemId, response) => {
                response.setHeader("Content-Type", "application/pdf");
                response.setHeader("Content-Disposition", `attachment; filename=barcode-UNIQUE-BARCODE-123.pdf`);
                response.status(200);
                response.end();
            });
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/admin/barcode/download/${testItem._id}`);
            expect(response.status).toBe(200);
            expect(response.headers["content-type"]).toBe("application/pdf");
            expect(response.headers["content-disposition"]).toContain("barcode-UNIQUE-BARCODE-123.pdf");
            expect(mockedGenerateBarcodePDF).toHaveBeenCalledWith(testItem._id.toString(), expect.any(Object));
        }, 10000);
        it("should return 400 if itemId is not a valid ObjectId", async () => {
            const response = await (0, supertest_1.default)(index_1.app).get("/api/admin/barcode/download/invalid-id");
            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Invalid itemId");
            expect(mockedGenerateBarcodePDF).not.toHaveBeenCalled();
        });
        it("should return 404 if the service throws a 404 error (item not found)", async () => {
            const fakeId = new mongoose_1.default.Types.ObjectId().toString();
            mockedGenerateBarcodePDF.mockRejectedValue(Object.assign(new Error("Item not found"), { statusCode: 404 }));
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/admin/barcode/download/${fakeId}`);
            expect(response.status).toBe(404);
            expect(response.body.error).toBe("Item not found");
        });
    });
});
