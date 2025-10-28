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
const adminService = __importStar(require("../services/admin.service"));
const donation_model_1 = __importDefault(require("../models/donation.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const category_model_1 = __importDefault(require("../models/category.model"));
jest.mock("../middleware/auth.middleware", () => ({
    authUser: (req, res, next) => {
        req.user = { id: new mongoose_1.default.Types.ObjectId().toString() };
        next();
    },
}));
jest.mock("../services/admin.service", () => ({
    getAllDonationService: jest.fn(),
    updateDonationStatusService: jest.fn(),
}));
const mockedGetAllDonations = adminService.getAllDonationService;
const mockedUpdateDonationStatus = adminService.updateDonationStatusService;
describe("Donations API (/api/admin/donations)", () => {
    let pendingDonation;
    let testUser;
    beforeEach(async () => {
        jest.clearAllMocks();
        testUser = await user_model_1.default.create({
            fullName: "Donor User",
            email: "donor@example.com",
            username: "donor",
            password: "password123",
        });
        const category = await category_model_1.default.create({ name: "Donated Books" });
        pendingDonation = new donation_model_1.default({
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
        await donation_model_1.default.deleteMany({});
        await user_model_1.default.deleteMany({});
        await category_model_1.default.deleteMany({});
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
            const response = await (0, supertest_1.default)(index_1.app).get("/api/admin/donations");
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockDonations);
            expect(mockedGetAllDonations).toHaveBeenCalledTimes(1);
        });
        it("should return 200 and an empty list if no donations exist", async () => {
            mockedGetAllDonations.mockResolvedValue([]);
            const response = await (0, supertest_1.default)(index_1.app).get("/api/admin/donations");
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual([]);
        });
        it("should return 500 if the service fails", async () => {
            mockedGetAllDonations.mockRejectedValue(new Error("DB Error"));
            const response = await (0, supertest_1.default)(index_1.app).get("/api/admin/donations");
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("DB Error");
        });
    });
    /* ========================= PUT /donations/:donationId/status ========================= */
    describe("PUT /donations/:donationId/status", () => {
        it('should return 200 and the updated donation with status "Accepted"', async () => {
            const updatedDonation = { ...pendingDonation, status: "Accepted" };
            mockedUpdateDonationStatus.mockResolvedValue(updatedDonation);
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/donations/${pendingDonation._id}/status`)
                .send({ status: "Accepted" });
            expect(response.status).toBe(200);
            expect(response.body.donation.status).toBe("Accepted");
            expect(response.body.message).toBe("Donation Accepted successfully");
            expect(mockedUpdateDonationStatus).toHaveBeenCalledWith(pendingDonation._id.toString(), "Accepted");
        });
        it('should return 200 and the updated donation with status "Rejected"', async () => {
            const updatedDonation = { ...pendingDonation, status: "Rejected" };
            mockedUpdateDonationStatus.mockResolvedValue(updatedDonation);
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/donations/${pendingDonation._id}/status`)
                .send({ status: "Rejected" });
            expect(response.status).toBe(200);
            expect(response.body.donation.status).toBe("Rejected");
            expect(response.body.message).toBe("Donation Rejected successfully");
            expect(mockedUpdateDonationStatus).toHaveBeenCalledWith(pendingDonation._id.toString(), "Rejected");
        });
        it("should return 400 if status is invalid", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/donations/${pendingDonation._id}/status`)
                .send({ status: "Pending" });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe("Invalid status value");
            expect(mockedUpdateDonationStatus).not.toHaveBeenCalled();
        });
        it("should return 500 if the service fails (e.g., donation not found)", async () => {
            mockedUpdateDonationStatus.mockRejectedValue(new Error("Donation not found"));
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/donations/${pendingDonation._id}/status`)
                .send({ status: "Accepted" });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Donation not found");
        });
        it("should return 500 if the donation is already processed", async () => {
            mockedUpdateDonationStatus.mockRejectedValue(new Error("Donation is already Accepted"));
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/donations/${pendingDonation._id}/status`)
                .send({ status: "Accepted" });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("Donation is already Accepted");
        });
    });
});
