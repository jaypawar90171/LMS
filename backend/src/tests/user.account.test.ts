import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { app } from "../index";
import User from "../models/user.model";
import Role from "../models/role.model";
import Fine from "../models/fine.model";
import IssuedItem from "../models/issuedItem.model";
import Donation from "../models/donation.model";
import Category from "../models/category.model";
import * as userService from "../services/user.service";
import { uploadFile } from "../config/upload";
import fs from "fs";

jest.mock("../middleware/auth.middleware", () => ({
  authUser: jest.fn((req, res, next) => next()),
}));

jest.mock("../config/upload", () => ({
  uploadFile: jest.fn(),
  upload: {
    single: jest.fn(() => (req: any, res: any, next: any) => {
      if (req.headers["content-type"]?.includes("multipart/form-data")) {
        req.file = { path: "fake/image.jpg" };
      }
      next();
    }),
  },
}));
jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  unlinkSync: jest.fn(),
}));
jest.mock("../services/activity.service", () => ({
  logActivity: jest.fn().mockResolvedValue(true),
}));

jest.mock("../services/user.service", () => ({
  getAllFinesService: jest.fn(),
  getProfileDetailsService: jest.fn(),
  updateProfileService: jest.fn(),
  updatePasswordService: jest.fn(),
  updateNotificationPreferenceService: jest.fn(),
  getHistoryService: jest.fn(),
  expressDonationInterestService: jest.fn(),
  getMyDonationsService: jest.fn(),
}));

const mockAuthUser = (user: any) => {
  (
    jest.requireMock("../middleware/auth.middleware").authUser as jest.Mock
  ).mockImplementation((req: any, res: any, next: any) => {
    req.user = user;
    next();
  });
};
const unmockAuthUser = () => {
  (
    jest.requireMock("../middleware/auth.middleware").authUser as jest.Mock
  ).mockImplementation((req: any, res: any, next: any) => next());
};

const mockedGetAllFines = userService.getAllFinesService as jest.Mock;
const mockedGetProfile = userService.getProfileDetailsService as jest.Mock;
const mockedUpdateProfile = userService.updateProfileService as jest.Mock;
const mockedUpdatePassword = userService.updatePasswordService as jest.Mock;
const mockedUpdatePrefs =
  userService.updateNotificationPreferenceService as jest.Mock;
const mockedGetHistory = userService.getHistoryService as jest.Mock;
const mockedExpressDonation =
  userService.expressDonationInterestService as jest.Mock;
const mockedGetMyDonations = userService.getMyDonationsService as jest.Mock;
const mockedUploadFile = uploadFile as jest.Mock;

describe("User API - Account Management", () => {
  let testUser: any;
  let hashedPassword = "hashedPassword";

  beforeAll(async () => {
    await Role.updateOne(
      { roleName: "employee" },
      { $set: { roleName: "employee" } },
      { upsert: true }
    );
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    unmockAuthUser();

    const roles = await Role.find({ roleName: "employee" });
    hashedPassword = await bcrypt.hash("currentPassword123", 10);
    testUser = await User.create({
      _id: new mongoose.Types.ObjectId(),
      fullName: "Account User",
      email: "account@example.com",
      username: "accountuser",
      password: hashedPassword,
      status: "Active",
      roles: roles.map((r) => r._id),
      notificationPreference: { email: true, whatsApp: false },
    });
    testUser = testUser.toObject();
    testUser.id = testUser._id.toString();

    mockAuthUser(testUser);
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Fine.deleteMany({});
    await IssuedItem.deleteMany({});
    await Donation.deleteMany({});
    await Category.deleteMany({});
  });

  afterAll(async () => {
    await Role.deleteMany({});
  });

  /* ========================= GET /account/fines ========================= */
  describe("GET /account/fines", () => {
    it("should return 200 and the user's fines", async () => {
      const mockFines = [{ id: "fine123", reason: "Overdue", outstanding: 10 }];
      mockedGetAllFines.mockResolvedValue({ fines: mockFines });

      const response = await request(app).get("/api/user/account/fines");

      expect(response.status).toBe(200);
      expect(response.body.data.fines).toEqual(mockFines);
      expect(mockedGetAllFines).toHaveBeenCalledWith(testUser.id);
    });

    it("should return 200 and an empty array if user has no fines", async () => {
      mockedGetAllFines.mockResolvedValue({ fines: [] });

      const response = await request(app).get("/api/user/account/fines");

      expect(response.status).toBe(200);
      expect(response.body.data.fines).toEqual([]);
    });

    it("should return 401 Unauthorized if user not logged in", async () => {
      unmockAuthUser();
      const response = await request(app).get("/api/user/account/fines");
      expect(response.status).toBe(401);
    });
  });

  /* ========================= GET /account/profile ========================= */
  describe("GET /account/profile", () => {
    it("should return 200 and the user's profile details", async () => {
      const mockProfile = {
        fullName: testUser.fullName,
        email: testUser.email,
      };
      mockedGetProfile.mockResolvedValue(mockProfile);

      const response = await request(app).get("/api/user/account/profile");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockProfile);
      expect(mockedGetProfile).toHaveBeenCalledWith(testUser.id);
    });

    it("should return 404 if the user profile is not found (edge case)", async () => {
      mockedGetProfile.mockRejectedValue({
        statusCode: 404,
        message: "User not found",
      });

      const response = await request(app).get("/api/user/account/profile");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("User not found");
    });

    it("should return 401 Unauthorized if user not logged in", async () => {
      unmockAuthUser();
      const response = await request(app).get("/api/user/account/profile");
      expect(response.status).toBe(401);
    });
  });

  /* ========================= PUT /account/profile ========================= */
  describe("PUT /account/profile", () => {
    it("should return 200 and the updated profile data", async () => {
      const updateData = {
        fullName: "Updated Name",
        phoneNumber: "1234567890",
      };
      const mockUpdatedUser = { ...testUser, ...updateData };
      mockedUpdateProfile.mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .put("/api/user/account/profile")
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.fullName).toBe("Updated Name");
      expect(response.body.data.phoneNumber).toBe("1234567890");
      expect(mockedUpdateProfile).toHaveBeenCalledWith(testUser.id, updateData);
    });

    it("should return 404 if the user is not found during update", async () => {
      mockedUpdateProfile.mockRejectedValue({
        statusCode: 404,
        message: "User not found",
      });
      const response = await request(app)
        .put("/api/user/account/profile")
        .send({ fullName: "Ghost" });
      expect(response.status).toBe(404);
      expect(response.body.error).toBe("User not found");
    });

    it("should return 401 Unauthorized if user not logged in", async () => {
      unmockAuthUser();
      const response = await request(app)
        .put("/api/user/account/profile")
        .send({ fullName: "Update Attempt" });
      expect(response.status).toBe(401);
    });
  });

  /* ========================= PUT /account/password ========================= */
  describe("PUT /account/password", () => {
    it("should return 200 on successful password update", async () => {
      mockedUpdatePassword.mockResolvedValue(true);

      const response = await request(app)
        .put("/api/user/account/password")
        .send({
          currentPassword: "currentPassword123",
          newPassword: "newStrongPassword456",
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Password updated successfully");
      expect(mockedUpdatePassword).toHaveBeenCalledWith(
        testUser.id,
        "currentPassword123",
        "newStrongPassword456"
      );
    });

    it("should return 400 if currentPassword is missing", async () => {
      const response = await request(app)
        .put("/api/user/account/password")
        .send({ newPassword: "newPassword" });
      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        "currentPassword and newPassword are required"
      );
    });

    it("should return 400 if newPassword is missing", async () => {
      const response = await request(app)
        .put("/api/user/account/password")
        .send({ currentPassword: "currentPassword" });
      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        "currentPassword and newPassword are required"
      );
    });

    it("should return 401 if currentPassword is incorrect", async () => {
      mockedUpdatePassword.mockRejectedValue({
        statusCode: 401,
        message: "Current password is incorrect",
      });
      const response = await request(app)
        .put("/api/user/account/password")
        .send({ currentPassword: "wrongPassword", newPassword: "newPassword" });
      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Current password is incorrect");
    });

    it("should return 404 if user not found", async () => {
      mockedUpdatePassword.mockRejectedValue({
        statusCode: 404,
        message: "User not found",
      });
      const response = await request(app)
        .put("/api/user/account/password")
        .send({
          currentPassword: "currentPassword",
          newPassword: "newPassword",
        });
      expect(response.status).toBe(404);
      expect(response.body.error).toBe("User not found");
    });

    it("should return 401 Unauthorized if user not logged in", async () => {
      unmockAuthUser();
      const response = await request(app)
        .put("/api/user/account/password")
        .send({ currentPassword: "a", newPassword: "b" });
      expect(response.status).toBe(401);
    });
  });

  /* ========================= PUT /account/notifications ========================= */
  describe("PUT /account/notifications (Preferences)", () => {
    it("should return 200 and the updated preferences", async () => {
      const newPrefs = { email: false, whatsApp: true };
      mockedUpdatePrefs.mockResolvedValue({
        ...testUser,
        notificationPreference: newPrefs,
      });

      const response = await request(app)
        .put("/api/user/account/notifications")
        .send(newPrefs);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(newPrefs);
      expect(mockedUpdatePrefs).toHaveBeenCalledWith(testUser.id, newPrefs);
    });

    it("should handle partial updates (e.g., only updating email pref)", async () => {
      const partialUpdate = { email: false };
      const expectedPrefs = { email: false, whatsApp: false };
      mockedUpdatePrefs.mockResolvedValue({
        ...testUser,
        notificationPreference: expectedPrefs,
      });

      const response = await request(app)
        .put("/api/user/account/notifications")
        .send(partialUpdate);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(expectedPrefs);
      expect(mockedUpdatePrefs).toHaveBeenCalledWith(
        testUser.id,
        partialUpdate
      );
    });

    it("should return 404 if user not found", async () => {
      mockedUpdatePrefs.mockRejectedValue({
        statusCode: 404,
        message: "User not found",
      });
      const response = await request(app)
        .put("/api/user/account/notifications")
        .send({ email: true });
      expect(response.status).toBe(404);
      expect(response.body.error).toBe("User not found");
    });

    it("should return 401 Unauthorized if user not logged in", async () => {
      unmockAuthUser();
      const response = await request(app)
        .put("/api/user/account/notifications")
        .send({ email: true });
      expect(response.status).toBe(401);
    });
  });

  /* ========================= GET /history ========================= */
  describe("GET /history", () => {
    it("should return 200 and the user's history data", async () => {
      const mockHistory = {
        recentlyBorrowed: [],
        returnedItems: [],
        fines: [],
      };
      mockedGetHistory.mockResolvedValue(mockHistory);

      const response = await request(app).get("/api/user/history");

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockHistory);
      expect(mockedGetHistory).toHaveBeenCalledWith(testUser.id);
    });

    it("should return 401 Unauthorized if user not logged in", async () => {
      unmockAuthUser();
      const response = await request(app).get("/api/user/history");
      expect(response.status).toBe(401);
    });
  });

  /* ========================= POST /items/donations/express-interest ========================= */
  describe("POST /items/donations/express-interest", () => {
    let donationCategory: any;
    beforeEach(async () => {
      donationCategory = await Category.create({ name: "Books" });
    });

    it("should return 201 and the created donation record", async () => {
      const donationData = {
        itemType: donationCategory._id.toString(),
        title: "Donating my old textbook",
        description: "Barely used",
        duration: 0,
        preferredContactMethod: "Email",
      };
      const mockDonationResult = {
        ...donationData,
        _id: "donation123",
        status: "Pending",
      };
      mockedExpressDonation.mockResolvedValue(mockDonationResult);

      const response = await request(app)
        .post("/api/user/items/donations/express-interest")
        .send(donationData);

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(mockDonationResult);
      expect(mockedExpressDonation).toHaveBeenCalledWith(
        testUser.id,
        donationData
      );
    });

    it("should return 400 if title is missing", async () => {
      mockedExpressDonation.mockRejectedValue({
        statusCode: 400,
        message: "Title is required",
      });
      const { title, ...badData } = {
        itemType: donationCategory._id.toString(),
        title: "",
        duration: 0,
      };
      const response = await request(app)
        .post("/api/user/items/donations/express-interest")
        .send(badData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Title is required");
    });

    it("should return 400 if itemType (category) is invalid", async () => {
      mockedExpressDonation.mockRejectedValue({
        statusCode: 400,
        message: "Invalid category/item type",
      });
      const response = await request(app)
        .post("/api/user/items/donations/express-interest")
        .send({ itemType: "invalidCategory", title: "Test", duration: 0 });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid category/item type");
    });

    it("should return 401 Unauthorized if user not logged in", async () => {
      unmockAuthUser();
      const response = await request(app)
        .post("/api/user/items/donations/express-interest")
        .send({ itemType: donationCategory._id, title: "Test" });
      expect(response.status).toBe(401);
    });
  });

  /* ========================= GET /items/donations/my-donations ========================= */
  describe("GET /items/donations/my-donations", () => {
    it("should return 200 and the user's list of donations", async () => {
      const mockDonations = [{ _id: "d1", title: "My Donation" }];
      mockedGetMyDonations.mockResolvedValue({
        success: true,
        data: mockDonations,
        count: 1,
      });

      const response = await request(app).get(
        "/api/user/items/donations/my-donations"
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockDonations);
      expect(response.body.count).toBe(1);
      expect(mockedGetMyDonations).toHaveBeenCalledWith(testUser.id);
    });

    it("should return 200 and an empty list if user has no donations", async () => {
      mockedGetMyDonations.mockResolvedValue({
        success: true,
        data: [],
        count: 0,
      });
      const response = await request(app).get(
        "/api/user/items/donations/my-donations"
      );
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it("should return 401 Unauthorized if user not logged in", async () => {
      unmockAuthUser();
      const response = await request(app).get(
        "/api/user/items/donations/my-donations"
      );
      expect(response.status).toBe(401);
    });
  });

  /* ========================= POST /upload/image ========================= */
  describe("POST /upload/image", () => {
    it("should return 200 and the uploaded image URL", async () => {
      mockedUploadFile.mockResolvedValue({
        secure_url: "http://cloudinary.com/new_image.jpg",
        public_id: "pub123",
      });

      const response = await request(app)
        .post("/api/user/upload/image")
        .set("Content-Type", "multipart/form-data");

      expect(response.status).toBe(200);
      expect(response.body.data.url).toBe(
        "http://cloudinary.com/new_image.jpg"
      );
      expect(response.body.data.publicId).toBe("pub123");
      expect(mockedUploadFile).toHaveBeenCalledWith("fake/image.jpg");
      expect(jest.requireMock("fs").unlinkSync).toHaveBeenCalledWith(
        "fake/image.jpg"
      );
    });

    it("should return 400 if no image file is provided", async () => {
      const response = await request(app)
        .post("/api/user/upload/image")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("No image file provided");
    });

    it("should return 500 if Cloudinary upload fails", async () => {
      mockedUploadFile.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/user/upload/image")
        .set("Content-Type", "multipart/form-data");

      expect(response.status).toBe(500);
      expect(response.body.message).toBe(
        "Failed to upload image to Cloudinary"
      );
    });

    it("should return 401 Unauthorized if user not logged in", async () => {
      unmockAuthUser();
      const response = await request(app).post("/api/user/upload/image");
      expect(response.status).toBe(401);
    });
  });
});
