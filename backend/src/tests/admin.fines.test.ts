import request from "supertest";
import mongoose from "mongoose";
import { app } from "../index";
import User from "../models/user.model";
import InventoryItem from "../models/item.model";
import Fine from "../models/fine.model";
import Category from "../models/category.model";
import { FineSchema } from "../validations/auth.validation";

jest.mock("../validations/auth.validation", () => ({
  FineSchema: { parse: jest.fn((data) => data) },
  FineUpdateSchema: { parse: jest.fn((data) => data) },
}));

jest.mock("../middleware/auth.middleware", () => ({
  authUser: (req: any, res: any, next: any) => {
    req.user = {
      id: new mongoose.Types.ObjectId().toString(),
      _id: new mongoose.Types.ObjectId(),
    };
    next();
  },
}));

jest.mock("../config/whatsapp", () => ({
  sendWhatsAppMessage: jest.fn().mockResolvedValue(true),
}));

describe("Fines API (/api/admin/fines)", () => {
  let testUser: any;
  let testItem: any;
  let outstandingFine: any;
  let paidFine: any;

  beforeEach(async () => {
    testUser = await User.create({
      fullName: "Fine User",
      email: "fine@example.com",
      username: "fineuser",
      password: "password123",
      phoneNumber: "+1234567890",
    });

    const category = await Category.create({ name: "Test" });

    testItem = await InventoryItem.create({
      title: "Test Item for Fines",
      categoryId: category._id,
      price: new mongoose.Types.Decimal128("10.00"),
      quantity: 1,
      availableCopies: 1,
      barcode: "FINE-ITEM-123",
    });

    [outstandingFine, paidFine] = await Fine.insertMany([
      {
        userId: testUser._id,
        itemId: testItem._id,
        reason: "Overdue",
        amountIncurred: 50.0,
        amountPaid: 10.0,
        outstandingAmount: 40.0,
        status: "Outstanding",
      },
      {
        userId: testUser._id,
        itemId: testItem._id,
        reason: "Damaged",
        amountIncurred: 25.0,
        amountPaid: 25.0,
        outstandingAmount: 0.0,
        status: "Paid",
      },
    ]);
  });

  afterEach(async () => {
    await User.deleteMany({});
    await InventoryItem.deleteMany({});
    await Fine.deleteMany({});
    await Category.deleteMany({});
    jest.clearAllMocks();
  });

  /* ========================= GET /fines ========================= */
  describe("GET /fines", () => {
    it("should return 200 and a list of all fines", async () => {
      const response = await request(app).get("/api/admin/fines");

      expect(response.status).toBe(200);
      expect(response.body.fines).toBeInstanceOf(Array);
      expect(response.body.fines).toHaveLength(2);
    });

    it("should return 200 and an empty list if no fines exist", async () => {
      await Fine.deleteMany({});
      const response = await request(app).get("/api/admin/fines");

      expect(response.status).toBe(200);
      expect(response.body.fines).toBeInstanceOf(Array);
      expect(response.body.fines).toHaveLength(0);
    });
  });

  /* ========================= GET /fines/:userId ========================= */
  describe("GET /fines/:userId", () => {
    it("should return 200 and a list of fines for a specific user", async () => {
      const response = await request(app).get(
        `/api/admin/fines/${testUser._id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.fines).toHaveLength(2);
      expect(response.body.fines[0].userId.toString()).toBe(
        testUser._id.toString()
      );
    });

    it("should return 400 if userId is not a valid ObjectId", async () => {
      const response = await request(app).get("/api/admin/fines/invalid-id");
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid userId");
    });

    it("should return 404 if the user exists but has no fines", async () => {
      const newUser = await User.create({
        fullName: "NoFine User",
        email: "nofine@example.com",
        username: "nofine",
        password: "password123",
      });

      const response = await request(app).get(
        `/api/admin/fines/${newUser._id}`
      );
      expect(response.status).toBe(404);
      expect(response.body.error).toBe("No Fines found");
    });

    it("should return 404 if the user ID does not exist", async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();
      const response = await request(app).get(`/api/admin/fines/${fakeUserId}`);
      expect(response.status).toBe(404);
    });
  });

  /* ========================= POST /fines ========================= */
  describe("POST /fines", () => {
    const newFine = {
      userId: "",
      itemId: "",
      reason: "Lost item",
      amountIncurred: 100.0,
    };

    beforeEach(() => {
      newFine.userId = testUser._id.toString();
      newFine.itemId = testItem._id.toString();
    });

    it("should return 201 and the newly created fine (defaulting to Outstanding)", async () => {
      const response = await request(app)
        .post("/api/admin/fines")
        .send(newFine);

      expect(response.status).toBe(201);
      expect(response.body.fine.reason).toBe("Lost item");
      expect(response.body.fine.status).toBe("Outstanding");
      expect(response.body.fine.outstandingAmount).toBe(100.0);
    });

    it("should return 201 and a fine with status 'Paid' if amountPaid equals amountIncurred", async () => {
      const response = await request(app)
        .post("/api/admin/fines")
        .send({ ...newFine, amountPaid: 100.0 });

      expect(response.status).toBe(201);
      expect(response.body.fine.status).toBe("Paid");
      expect(response.body.fine.outstandingAmount).toBe(0);
    });

    it("should return 400 if userId is not a valid ObjectId", async () => {
      const response = await request(app)
        .post("/api/admin/fines")
        .send({ ...newFine, userId: "invalid-id" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid userId");
    });

    it("should return 400 if amountIncurred is missing", async () => {
      (FineSchema.parse as jest.Mock).mockImplementationOnce(() => {
        throw { name: "ZodError", errors: [{ message: "Amount is required" }] };
      });
      const { amountIncurred, ...badFine } = newFine;

      const response = await request(app)
        .post("/api/admin/fines")
        .send(badFine);

      expect(response.status).toBe(400);
      expect(response.body.errors[0].message).toBe("Amount is required");
    });
  });

  /* ========================= PUT /fines/:fineId ========================= */
  describe("PUT /fines/:fineId", () => {
    it("should return 200 and the updated fine", async () => {
      const response = await request(app)
        .put(`/api/admin/fines/${outstandingFine._id}`)
        .send({ reason: "Lost item" });

      expect(response.status).toBe(200);
      expect(response.body.fine.reason).toBe("Lost item");
    });

    it('should recalculate status to "Paid" if amountPaid is updated', async () => {
      const response = await request(app)
        .put(`/api/admin/fines/${outstandingFine._id}`)
        .send({ amountPaid: 50.0 });

      expect(response.status).toBe(200);
      expect(response.body.fine.status).toBe("Paid");
      expect(response.body.fine.outstandingAmount).toBe(0);
    });

    it('should recalculate status to "Outstanding" if amountIncurred is increased', async () => {
      const response = await request(app)
        .put(`/api/admin/fines/${paidFine._id}`)
        .send({ amountIncurred: 100.0 });

      expect(response.status).toBe(200);
      expect(response.body.fine.status).toBe("Outstanding");
      expect(response.body.fine.outstandingAmount).toBe(75);
    });

    it("should return 400 if fineId is not a valid ObjectId", async () => {
      const response = await request(app)
        .put("/api/admin/fines/invalid-id")
        .send({ reason: "test" });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid fineId");
    });

    it("should return 404 if the fine ID does not exist", async () => {
      const fakeFineId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .put(`/api/admin/fines/${fakeFineId}`)
        .send({ reason: "test" });
      expect(response.status).toBe(404);
      expect(response.body.message).toBe("No such fine exists");
    });
  });

  /* ========================= DELETE /fines/:fineId ========================= */
  describe("DELETE /fines/:fineId", () => {
    it("should return 200 and a success message", async () => {
      const response = await request(app).delete(
        `/api/admin/fines/${outstandingFine._id}`
      );
      expect(response.status).toBe(200);
      expect(response.body.msg.message).toBe("Fine deleted successfully");

      const fineInDb = await Fine.findById(outstandingFine._id);
      expect(fineInDb).toBeNull();
    });

    it("should return 400 if fineId is not a valid ObjectId", async () => {
      const response = await request(app).delete("/api/admin/fines/invalid-id");
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid fineId");
    });

    it("should return 404 if the fine ID does not exist", async () => {
      const fakeFineId = new mongoose.Types.ObjectId().toString();
      const response = await request(app).delete(
        `/api/admin/fines/${fakeFineId}`
      );
      expect(response.status).toBe(404);
      expect(response.body.message).toBe("No such fine exists");
    });
  });

  /* ========================= POST /fines/:fineId/record-payment ========================= */
  describe("POST /fines/:fineId/record-payment", () => {
    it("should return 200 and record a partial payment", async () => {
      const response = await request(app)
        .post(`/api/admin/fines/${outstandingFine._id}/record-payment`)
        .send({ amountPaid: 20.0, paymentMethod: "Cash" });

      expect(response.status).toBe(200);
      expect(response.body.fine.status).toBe("Outstanding");
      expect(response.body.fine.outstandingAmount).toBe(20.0);
      expect(response.body.fine.amountPaid).toBe(30.0);
      expect(response.body.fine.paymentDetails).toHaveLength(1);
      expect(response.body.fine.paymentDetails[0].amountPaid).toBe(20.0);
    });

    it('should return 200, record a full payment, and set status to "Paid"', async () => {
      const response = await request(app)
        .post(`/api/admin/fines/${outstandingFine._id}/record-payment`)
        .send({ amountPaid: 40.0, paymentMethod: "Online Transfer" });

      expect(response.status).toBe(200);
      expect(response.body.fine.status).toBe("Paid");
      expect(response.body.fine.outstandingAmount).toBe(0);
      expect(response.body.fine.amountPaid).toBe(50.0);
      expect(response.body.fine.dateSettled).toBeDefined();
    });

    it("should return 400 if payment amount exceeds outstanding amount", async () => {
      const response = await request(app)
        .post(`/api/admin/fines/${outstandingFine._id}/record-payment`)
        .send({ amountPaid: 100.0, paymentMethod: "Cash" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Payment amount cannot exceed outstanding amount"
      );
    });

    it('should return 400 if the fine is already "Paid"', async () => {
      const response = await request(app)
        .post(`/api/admin/fines/${paidFine._id}/record-payment`)
        .send({ amountPaid: 1.0, paymentMethod: "Cash" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Can only record payment for outstanding fines"
      );
    });

    it("should return 404 if the fine ID does not exist", async () => {
      const fakeFineId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .post(`/api/admin/fines/${fakeFineId}/record-payment`)
        .send({ amountPaid: 10.0, paymentMethod: "Cash" });
      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Fine not found");
    });
  });

  /* ========================= POST /fines/:fineId/waive ========================= */
  describe("POST /fines/:fineId/waive", () => {
    it('should return 200, waive the fine, and set status to "Waived"', async () => {
      const response = await request(app)
        .post(`/api/admin/fines/${outstandingFine._id}/waive`)
        .send({ waiverReason: "Admin discretion" });

      expect(response.status).toBe(200);
      expect(response.body.fine.status).toBe("Waived");
      expect(response.body.fine.outstandingAmount).toBe(0);
      expect(response.body.fine.waiverReason).toBe("Admin discretion");
      expect(response.body.fine.dateSettled).toBeDefined();

      expect(
        require("../config/whatsapp").sendWhatsAppMessage
      ).toHaveBeenCalled();
    });

    it("should return 400 if waiverReason is missing", async () => {
      const response = await request(app)
        .post(`/api/admin/fines/${outstandingFine._id}/waive`)
        .send({});
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Waiver reason is required");
    });

    it('should return 400 if the fine is already "Paid"', async () => {
      const response = await request(app)
        .post(`/api/admin/fines/${paidFine._id}/waive`)
        .send({ waiverReason: "Test" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Can only waive outstanding fines");
    });

    it("should return 404 if the fine ID does not exist", async () => {
      const fakeFineId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .post(`/api/admin/fines/${fakeFineId}/waive`)
        .send({ waiverReason: "Test" });
      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Fine not found");
    });
  });
});
