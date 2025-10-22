import request from "supertest";
import mongoose from "mongoose";
import { app } from "../index";
import InventoryItem from "../models/item.model";
import Category from "../models/category.model";

jest.mock("../services/admin.service", () => ({
  generateBarcodeString: jest.fn(),
  generateBarcodePDF: jest.fn(),
}));

jest.mock("../middleware/auth.middleware", () => ({
  authUser: (req: any, res: any, next: any) => {
    req.user = { id: new mongoose.Types.ObjectId().toString() };
    next();
  },
}));

import * as adminService from "../services/admin.service";

const mockedGenerateBarcodeString =
  adminService.generateBarcodeString as jest.Mock;
const mockedGenerateBarcodePDF = adminService.generateBarcodePDF as jest.Mock;

describe("Barcode API (/api/admin/barcode)", () => {
  let testItem: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const category = await Category.create({ name: "Test" });
    testItem = await InventoryItem.create({
      title: "Barcode Item",
      categoryId: category._id,
      price: new mongoose.Types.Decimal128("10.00"),
      quantity: 1,
      availableCopies: 1,
      barcode: "UNIQUE-BARCODE-123",
      isbnOrIdentifier: "TEST-ISBN-123",
      status: "Available",
      mediaUrl: "https://example.com/image.jpg",
    });
  });

  afterEach(async () => {
    await InventoryItem.deleteMany({});
    await Category.deleteMany({});
  });

  /* ========================= GET /barcode/generate ========================= */

  describe("GET /barcode/generate", () => {
    it("should return 200 and a new barcode string from the service", async () => {
      const mockBarcode = "ITEM-UUID-TEST-123";
      mockedGenerateBarcodeString.mockResolvedValue(mockBarcode);

      const response = await request(app).get("/api/admin/barcode/generate");

      expect(response.status).toBe(200);
      expect(response.body.barcode).toBe(mockBarcode);
      expect(mockedGenerateBarcodeString).toHaveBeenCalledTimes(1);
    });

    it("should return 500 if the barcode generation service fails", async () => {
      mockedGenerateBarcodeString.mockRejectedValue(
        new Error("Generation failed")
      );

      const response = await request(app).get("/api/admin/barcode/generate");

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Generation failed");
    });
  });

  /* ========================= GET /barcode/download/:itemId ========================= */

  describe("GET /barcode/download/:itemId", () => {
    it("should return 200, PDF headers, and call the PDF service", async () => {
      mockedGenerateBarcodePDF.mockImplementation(async (itemId, response) => {
        response.setHeader("Content-Type", "application/pdf");
        response.setHeader(
          "Content-Disposition",
          `attachment; filename=barcode-UNIQUE-BARCODE-123.pdf`
        );
        response.status(200);
        response.end();
      });

      const response = await request(app).get(
        `/api/admin/barcode/download/${testItem._id}`
      );

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.headers["content-disposition"]).toContain(
        "barcode-UNIQUE-BARCODE-123.pdf"
      );
      expect(mockedGenerateBarcodePDF).toHaveBeenCalledWith(
        testItem._id.toString(),
        expect.any(Object)
      );
    }, 10000);

    it("should return 400 if itemId is not a valid ObjectId", async () => {
      const response = await request(app).get(
        "/api/admin/barcode/download/invalid-id"
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid itemId");
      expect(mockedGenerateBarcodePDF).not.toHaveBeenCalled();
    });

    it("should return 404 if the service throws a 404 error (item not found)", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      mockedGenerateBarcodePDF.mockRejectedValue(
        Object.assign(new Error("Item not found"), { statusCode: 404 })
      );

      const response = await request(app).get(
        `/api/admin/barcode/download/${fakeId}`
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Item not found");
    });
  });
});
