import request from "supertest";
import mongoose from "mongoose";
import { app } from "../index";
import * as adminService from "../services/admin.service";
import Donation from "../models/donation.model";
import User from "../models/user.model";
import Category from "../models/category.model";

jest.mock("../middleware/auth.middleware", () => ({
  authUser: (req: any, res: any, next: any) => {
    req.user = { id: new mongoose.Types.ObjectId().toString() };
    next();
  },
}));

jest.mock("../services/admin.service", () => ({
  getAllDonationService: jest.fn(),
  updateDonationStatusService: jest.fn(),
}));

const mockedGetAllDonations = adminService.getAllDonationService as jest.Mock;
const mockedUpdateDonationStatus =
  adminService.updateDonationStatusService as jest.Mock;

describe("Donations API (/api/admin/donations)", () => {
  let pendingDonation: any;
  let testUser: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    testUser = await User.create({
      fullName: "Donor User",
      email: "donor@example.com",
      username: "donor",
      password: "password123",
    });

    const category = await Category.create({ name: "Donated Books" });

    pendingDonation = new Donation({
      userId: testUser._id,
      itemType: category._id,
      title: "Donated Book",
      quantity: 1,
      condition: "Good",
      status: "Pending",
    });
    pendingDonation = await pendingDonation.save();
    pendingDonation = pendingDonation.toObject();
  });

  afterEach(async () => {
    await Donation.deleteMany({});
    await User.deleteMany({});
    await Category.deleteMany({});
  });

  /* ========================= GET /donations ========================= */

  describe("GET /donations", () => {
    it("should return 200 and a list of all donations", async () => {
      const mockDonations = [
        {
          _id: "68f7b4ae30f76b34ea75dad5",
          title: "Donated Book",
          donationType: "giveaway",
          preferredContactMethod: "whatsApp",
          status: "Pending",
          duration: 0,
          inventoryItemId: null,
          userId: "68f7b4ae30f76b34ea75dace",
          itemType: "68f7b4ae30f76b34ea75dad3",
          createdAt: "2025-10-21T16:28:30.920Z",
          updatedAt: "2025-10-21T16:28:30.920Z",
          __v: 0,
        },
      ];
      mockedGetAllDonations.mockResolvedValue(mockDonations);

      const response = await request(app).get("/api/admin/donations");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockDonations);
      expect(mockedGetAllDonations).toHaveBeenCalledTimes(1);
    });

    it("should return 200 and an empty list if no donations exist", async () => {
      mockedGetAllDonations.mockResolvedValue([]);

      const response = await request(app).get("/api/admin/donations");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it("should return 500 if the service fails", async () => {
      mockedGetAllDonations.mockRejectedValue(new Error("DB Error"));

      const response = await request(app).get("/api/admin/donations");

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("DB Error");
    });
  });

  /* ========================= PUT /donations/:donationId/status ========================= */

  describe("PUT /donations/:donationId/status", () => {
    it('should return 200 and the updated donation with status "Accepted"', async () => {
      const updatedDonation = { ...pendingDonation, status: "Accepted" };
      mockedUpdateDonationStatus.mockResolvedValue(updatedDonation);

      const response = await request(app)
        .put(`/api/admin/donations/${pendingDonation._id}/status`)
        .send({ status: "Accepted" });

      expect(response.status).toBe(200);
      expect(response.body.donation.status).toBe("Accepted");
      expect(response.body.message).toBe("Donation Accepted successfully");

      expect(mockedUpdateDonationStatus).toHaveBeenCalledWith(
        pendingDonation._id.toString(),
        "Accepted"
      );
    });

    it('should return 200 and the updated donation with status "Rejected"', async () => {
      const updatedDonation = { ...pendingDonation, status: "Rejected" };
      mockedUpdateDonationStatus.mockResolvedValue(updatedDonation);

      const response = await request(app)
        .put(`/api/admin/donations/${pendingDonation._id}/status`)
        .send({ status: "Rejected" });

      expect(response.status).toBe(200);
      expect(response.body.donation.status).toBe("Rejected");
      expect(response.body.message).toBe("Donation Rejected successfully");

      expect(mockedUpdateDonationStatus).toHaveBeenCalledWith(
        pendingDonation._id.toString(),
        "Rejected"
      );
    });

    it("should return 400 if status is invalid", async () => {
      const response = await request(app)
        .put(`/api/admin/donations/${pendingDonation._id}/status`)
        .send({ status: "Pending" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid status value");
      expect(mockedUpdateDonationStatus).not.toHaveBeenCalled();
    });

    it("should return 500 if the service fails (e.g., donation not found)", async () => {
      mockedUpdateDonationStatus.mockRejectedValue(
        new Error("Donation not found")
      );

      const response = await request(app)
        .put(`/api/admin/donations/${pendingDonation._id}/status`)
        .send({ status: "Accepted" });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Donation not found");
    });

    it("should return 500 if the donation is already processed", async () => {
      mockedUpdateDonationStatus.mockRejectedValue(
        new Error("Donation is already Accepted")
      );

      const response = await request(app)
        .put(`/api/admin/donations/${pendingDonation._id}/status`)
        .send({ status: "Accepted" });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Donation is already Accepted");
    });
  });
});
