import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import * as adminService from "../services/admin.service";
import { loginSchema } from "../validations/auth.validation";
import { app } from "../index";

// Mock the validation middleware to just pass data through
jest.mock("../validations/auth.validation", () => ({
  loginSchema: {
    parse: jest.fn((data) => data),
  },
}));

const loginServiceSpy = jest.spyOn(adminService, "loginService");
const forgotPasswordServiceSpy = jest.spyOn(
  adminService,
  "forgotPasswordService"
);
const resetPasswordServiceSpy = jest.spyOn(
  adminService,
  "resetPasswordService"
);

describe("Auth API (/api/admin/auth)", () => {
  let testUser: any;
  let hashedPassword: any;

  // Before each test in this suite, create a sample user
  beforeEach(async () => {
    const createdUser = await User.create({
      fullName: "Test User",
      email: "test@example.com",
      username: "testuser",
      password: "password123",
      status: "Active",
      roles: [],
      permissions: [],
    });

    const userInDb = await User.findById(createdUser._id)
      .select("+password")
      .exec();

    if (!userInDb) {
      throw new Error("Test user was not created successfully");
    }

    hashedPassword = userInDb.password;
    testUser = userInDb.toObject();
  });

  // Clear all mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  /* ========================= POST /auth/login ========================= */

  describe("POST /auth/login", () => {
    it("should return 200, user data, and tokens with valid credentials", async () => {
      const loginData = {
        email: "test@example.com",
        password: "password123",
        rememberMe: false,
      };

      const response = await request(app)
        .post("/api/admin/auth/login")
        .send(loginData);

      // 1. Check response status and body
      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();

      // 2. Check that the service was called correctly
      expect(loginServiceSpy).toHaveBeenCalledWith(loginData);

      // 3. Check side effects (e.g., lastLogin was updated)
      const userInDb = await User.findById(testUser._id);
      expect(userInDb?.lastLogin).toBeDefined();
    });

    it("should return 400 if email is missing (ZodError)", async () => {
      // We need to re-mock the schema parse to throw an error
      (loginSchema.parse as jest.Mock).mockImplementationOnce(() => {
        throw {
          name: "ZodError",
          errors: [{ message: "Email is required" }],
        };
      });

      const response = await request(app)
        .post("/api/admin/auth/login")
        .send({ password: "password123" });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContain("Email is required");
    });

    it("should return 404 if the user email is not found", async () => {
      const response = await request(app)
        .post("/api/admin/auth/login")
        .send({ email: "wrong@example.com", password: "password123" });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain("not found");
    });

    it("should return 404 if the password does not match", async () => {
      const response = await request(app)
        .post("/api/admin/auth/login")
        .send({ email: "test@example.com", password: "wrongpassword" });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain("password not match");
    });
  });
  /* ========================= POST /auth/reset-password/:id/:token ========================= */

  describe("POST /auth/reset-password/:id/:token", () => {
    let validToken: string;

    beforeEach(() => {
      const secret = process.env.SECRET_KEY + hashedPassword;
      validToken = jwt.sign(
        { id: testUser._id, email: testUser.email },
        secret,
        { expiresIn: "1h" }
      );
    });

    it("should return 200 and reset the password with a valid token", async () => {
      const response = await request(app)
        .post(`/api/admin/auth/reset-password/${testUser._id}/${validToken}`)
        .send({
          newPassword: "newPassword123",
          confirmPassword: "newPassword123",
        });

      expect(response.status).toBe(200);
      expect(response.text).toContain('var status = ""verified""');

      expect(resetPasswordServiceSpy).toHaveBeenCalled();

      const updatedUser = await User.findById(testUser._id)
        .select("+password")
        .exec();
      const isMatch = await bcrypt.compare(
        "newPassword123",
        updatedUser!.password!
      );
      expect(isMatch).toBe(true);
    });

    it("should return 400 if passwords do not match", async () => {
      const response = await request(app)
        .post(`/api/admin/auth/reset-password/${testUser._id}/${validToken}`)
        .send({ newPassword: "newPassword123", confirmPassword: "DIFFERENT" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Passwords do not match.");
    });

    it("should return 400 if the token is invalid", async () => {
      const response = await request(app)
        .post(`/api/admin/auth/reset-password/${testUser._id}/INVALID_TOKEN`)
        .send({
          newPassword: "newPassword123",
          confirmPassword: "newPassword123",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("invalid or expired");
    });
  });
});
