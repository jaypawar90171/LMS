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
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
const adminService = __importStar(require("../services/admin.service"));
const auth_validation_1 = require("../validations/auth.validation");
const index_1 = require("../index");
// Mock the validation middleware to just pass data through
jest.mock("../validations/auth.validation", () => ({
    loginSchema: {
        parse: jest.fn((data) => data),
    },
}));
const loginServiceSpy = jest.spyOn(adminService, "loginService");
const forgotPasswordServiceSpy = jest.spyOn(adminService, "forgotPasswordService");
const resetPasswordServiceSpy = jest.spyOn(adminService, "resetPasswordService");
describe("Auth API (/api/admin/auth)", () => {
    let testUser;
    let hashedPassword;
    // Before each test in this suite, create a sample user
    beforeEach(async () => {
        const createdUser = await user_model_1.default.create({
            fullName: "Test User",
            email: "test@example.com",
            username: "testuser",
            password: "password123",
            status: "Active",
            roles: [],
            permissions: [],
        });
        const userInDb = await user_model_1.default.findById(createdUser._id)
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
            const response = await (0, supertest_1.default)(index_1.app)
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
            const userInDb = await user_model_1.default.findById(testUser._id);
            expect(userInDb?.lastLogin).toBeDefined();
        });
        it("should return 400 if email is missing (ZodError)", async () => {
            // We need to re-mock the schema parse to throw an error
            auth_validation_1.loginSchema.parse.mockImplementationOnce(() => {
                throw {
                    name: "ZodError",
                    errors: [{ message: "Email is required" }],
                };
            });
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/admin/auth/login")
                .send({ password: "password123" });
            expect(response.status).toBe(400);
            expect(response.body.errors).toContain("Email is required");
        });
        it("should return 404 if the user email is not found", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/admin/auth/login")
                .send({ email: "wrong@example.com", password: "password123" });
            expect(response.status).toBe(404);
            expect(response.body.error).toContain("not found");
        });
        it("should return 404 if the password does not match", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/admin/auth/login")
                .send({ email: "test@example.com", password: "wrongpassword" });
            expect(response.status).toBe(404);
            expect(response.body.error).toContain("password not match");
        });
    });
    /* ========================= POST /auth/reset-password/:id/:token ========================= */
    describe("POST /auth/reset-password/:id/:token", () => {
        let validToken;
        beforeEach(() => {
            const secret = process.env.SECRET_KEY + hashedPassword;
            validToken = jsonwebtoken_1.default.sign({ id: testUser._id, email: testUser.email }, secret, { expiresIn: "1h" });
        });
        it("should return 200 and reset the password with a valid token", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .post(`/api/admin/auth/reset-password/${testUser._id}/${validToken}`)
                .send({
                newPassword: "newPassword123",
                confirmPassword: "newPassword123",
            });
            expect(response.status).toBe(200);
            expect(response.text).toContain('var status = ""verified""');
            expect(resetPasswordServiceSpy).toHaveBeenCalled();
            const updatedUser = await user_model_1.default.findById(testUser._id)
                .select("+password")
                .exec();
            const isMatch = await bcrypt_1.default.compare("newPassword123", updatedUser.password);
            expect(isMatch).toBe(true);
        });
        it("should return 400 if passwords do not match", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .post(`/api/admin/auth/reset-password/${testUser._id}/${validToken}`)
                .send({ newPassword: "newPassword123", confirmPassword: "DIFFERENT" });
            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Passwords do not match.");
        });
        it("should return 400 if the token is invalid", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
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
