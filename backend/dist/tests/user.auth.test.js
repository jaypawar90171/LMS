"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../index");
const user_model_1 = __importDefault(require("../models/user.model"));
const role_model_1 = __importDefault(require("../models/role.model"));
const issuedItem_model_1 = __importDefault(require("../models/issuedItem.model"));
const item_model_1 = __importDefault(require("../models/item.model"));
const category_model_1 = __importDefault(require("../models/category.model"));
const queue_model_1 = __importDefault(require("../models/queue.model"));
const notificationService_1 = require("../utility/notificationService");
const activity_service_1 = require("../services/activity.service");
jest.mock("../validations/auth.validation", () => ({
    registrationSchema: { parse: jest.fn((data) => data) },
    loginSchema: { parse: jest.fn((data) => data) },
}));
jest.mock("../config/emailService", () => ({
    sendEmail: jest.fn().mockResolvedValue(true),
}));
jest.mock("../config/whatsapp", () => ({
    sendWhatsAppMessage: jest.fn().mockResolvedValue(true),
}));
jest.mock("../utility/notificationService", () => ({
    NotificationService: {
        createNotification: jest.fn().mockResolvedValue(true),
    },
}));
jest.mock("../services/activity.service", () => ({
    logActivity: jest.fn().mockResolvedValue(true),
}));
jest.mock("../middleware/auth.middleware", () => ({
    authUser: jest.fn((req, res, next) => {
        next();
    }),
}));
const mockAuthUser = (user) => {
    jest.requireMock("../middleware/auth.middleware").authUser.mockImplementation((req, res, next) => {
        req.user = user;
        next();
    });
};
const unmockAuthUser = () => {
    jest.requireMock("../middleware/auth.middleware").authUser.mockImplementation((req, res, next) => {
        next();
    });
};
describe("User API - Auth & Dashboard", () => {
    let employeeRole;
    let familyRole;
    let testUser;
    let hashedPassword;
    beforeAll(async () => {
        [employeeRole, familyRole] = await role_model_1.default.insertMany([
            { roleName: "employee", description: "Employee Role" },
            { roleName: "familyMember", description: "Family Member Role" },
        ]);
    });
    beforeEach(async () => {
        jest.clearAllMocks();
        unmockAuthUser();
        testUser = await user_model_1.default.create({
            _id: new mongoose_1.default.Types.ObjectId(),
            fullName: "Test User",
            email: "test@example.com",
            username: "testuser",
            password: "password123",
            status: "Active",
            roles: [employeeRole._id],
            passwordResetRequired: false,
        });
        testUser = testUser.toObject();
        testUser.id = testUser._id.toString();
    });
    afterEach(async () => {
        await user_model_1.default.deleteMany({});
        await issuedItem_model_1.default.deleteMany({});
        await item_model_1.default.deleteMany({});
        await category_model_1.default.deleteMany({});
        await queue_model_1.default.deleteMany({});
    });
    afterAll(async () => {
        await role_model_1.default.deleteMany({});
    });
    /* ========================= AUTH ========================= */
    describe("POST /auth/register", () => {
        const registrationData = {
            fullName: "New Employee",
            email: "newemp@example.com",
            userName: "newemp",
            password: "password123",
            role: "employee",
            emp_id: "E123",
        };
        it("should return 201 on successful registration", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/user/auth/register")
                .send(registrationData);
            expect(response.status).toBe(201);
            expect(response.body.message).toContain("pending admin approval");
            expect(response.body.userId).toBeDefined();
            const userInDb = await user_model_1.default.findOne({ email: registrationData.email });
            expect(userInDb).not.toBeNull();
            expect(userInDb?.status).toBe("Inactive");
            expect(userInDb?.employeeId).toBe("E123");
            expect(notificationService_1.NotificationService.createNotification).toHaveBeenCalled();
            expect(activity_service_1.logActivity).toHaveBeenCalled();
        });
        it("should return 409 if email already exists", async () => {
            await user_model_1.default.create({
                fullName: "Existing User",
                email: registrationData.email,
                username: "existinguser",
                password: "hashedPassword",
                status: "Active",
                roles: [employeeRole._id],
            });
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/user/auth/register")
                .send(registrationData);
            expect(response.status).toBe(409);
            expect(response.body.error).toContain("already exists");
        });
        it("should return 404 if the specified role (employee/familyMember) does not exist in DB", async () => {
            await role_model_1.default.deleteOne({ _id: employeeRole._id });
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/user/auth/register")
                .send(registrationData);
            expect(response.status).toBe(404);
            expect(response.body.error).toContain("Role 'employee' not found");
        });
        it("should return 400 for validation errors (e.g., missing email)", async () => {
            jest.requireMock("../validations/auth.validation").registrationSchema
                .parse.mockImplementationOnce(() => {
                throw { name: "ZodError", errors: [{ message: "Email required" }] };
            });
            const { email, ...badData } = registrationData;
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/user/auth/register")
                .send(badData);
            expect(response.status).toBe(400);
        });
    });
    describe("POST /auth/login", () => {
        const loginCredentials = {
            email: "test@example.com",
            password: "password123",
        };
        it("should return 201, user data, and token on successful login for active user", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/user/auth/login")
                .send(loginCredentials);
            expect(response.status).toBe(201);
            expect(response.body.message).toBe("Login successful.");
            expect(response.body.user.email).toBe(loginCredentials.email);
            expect(response.body.user.id).toBe(testUser._id.toString());
            expect(response.body.token).toBeDefined();
            const userInDb = await user_model_1.default.findById(testUser._id);
            expect(userInDb?.lastLogin).toBeDefined();
            expect(activity_service_1.logActivity).toHaveBeenCalled();
        });
        it("should return 403 if user status is not Active", async () => {
            await user_model_1.default.findByIdAndUpdate(testUser._id, { status: "Inactive" });
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/user/auth/login")
                .send(loginCredentials);
            expect(response.status).toBe(403);
            expect(response.body.error).toContain("account is not active");
        });
        it("should return 201 with passwordChangeRequired true if flag is set", async () => {
            await user_model_1.default.findByIdAndUpdate(testUser._id, {
                passwordResetRequired: true,
            });
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/user/auth/login")
                .send(loginCredentials);
            expect(response.status).toBe(201);
            expect(response.body.passwordChangeRequired).toBe(true);
            expect(response.body.message).toContain("must change your password");
            expect(response.body.token).toBeDefined();
        });
        it("should return 404 if email is not found", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/user/auth/login")
                .send({ ...loginCredentials, email: "wrong@example.com" });
            expect(response.status).toBe(404);
            expect(response.body.error).toContain("not found");
        });
        it("should return 404 if password does not match", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/user/auth/login")
                .send({ ...loginCredentials, password: "wrongpassword" });
            expect(response.status).toBe(404);
            expect(response.body.error).toContain("password not match");
        });
    });
    describe("POST /auth/forgot-password", () => {
        it("should return 403 if email does not exist", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/user/auth/forgot-password")
                .send({ email: "nosuchuser@example.com" });
            expect(response.status).toBe(403);
            expect(response.body.error).toBe("Email does not exist");
        });
    });
    describe("POST /auth/reset-password/:id/:token", () => {
        let validToken;
        beforeEach(() => {
            const secret = process.env.SECRET_KEY + hashedPassword;
            validToken = jsonwebtoken_1.default.sign({ id: testUser._id, email: testUser.email }, secret, { expiresIn: "1h" });
        });
        it("should return 400 if passwords do not match", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .post(`/api/user/auth/reset-password/${testUser._id}/${validToken}`)
                .send({ newPassword: "new", confirmPassword: "different" });
            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Passwords do not match.");
        });
    });
    /* ========================= DASHBOARD ========================= */
    describe("GET /dashboard/:userId", () => {
        let otherUser;
        beforeEach(async () => {
            mockAuthUser(testUser);
            otherUser = await user_model_1.default.create({
                fullName: "Other User",
                email: "other@e.com",
                username: "other",
                password: "p",
                roles: [employeeRole._id],
            });
        });
        it("should return 200 and dashboard data for the logged-in user", async () => {
            const category = await category_model_1.default.create({ name: "Books" });
            const item = await item_model_1.default.create({
                title: "Book 1",
                categoryId: category._id,
                price: "10",
                quantity: 1,
                availableCopies: 0,
                barcode: "B1",
            });
            await issuedItem_model_1.default.create({
                userId: testUser._id,
                itemId: item._id,
                status: "Issued",
                dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            });
            await queue_model_1.default.create({
                itemId: item._id,
                queueMembers: [
                    { userId: testUser._id, position: 1, status: "waiting" },
                ],
            });
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/user/dashboard/${testUser._id}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.issuedItems.current).toHaveLength(1);
            expect(response.body.data.queuedItems).toHaveLength(1);
            expect(response.body.data.newArrivals).toBeDefined();
        });
        it("should return 401 Unauthorized if no user is logged in", async () => {
            unmockAuthUser();
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/user/dashboard/${testUser._id}`);
            expect(response.status).toBe(401);
        });
        it("should return 400 if userId in params is invalid", async () => {
            const response = await (0, supertest_1.default)(index_1.app).get("/api/user/dashboard/invalid-id");
            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Invalid userId");
        });
    });
});
