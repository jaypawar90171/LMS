"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = __importDefault(require("../models/user.model"));
const role_model_1 = __importDefault(require("../models/role.model"));
const fine_model_1 = __importDefault(require("../models/fine.model"));
const item_model_1 = __importDefault(require("../models/item.model"));
const issuedItem_model_1 = __importDefault(require("../models/issuedItem.model"));
const index_1 = require("../index");
jest.mock("../validations/auth.validation", () => ({
    createUserSchema: { parse: jest.fn((data) => data) },
    updateUserSchema: { parse: jest.fn((data) => data) },
}));
jest.mock("../middleware/auth.middleware", () => ({
    authUser: (req, res, next) => {
        req.user = {
            id: new mongoose_1.default.Types.ObjectId().toString(),
            email: "admin@example.com",
            roles: ["admin"],
        };
        next();
    },
}));
describe("User Management API (/api/admin/users)", () => {
    let testUser;
    let testRole;
    beforeEach(async () => {
        testRole = await role_model_1.default.create({
            roleName: "Student",
            description: "Student role",
            permissions: [],
        });
        testUser = await user_model_1.default.create({
            fullName: "Sample User",
            email: "sample@example.com",
            username: "sampleuser",
            password: "password123",
            status: "Active",
            roles: [testRole._id],
        });
    });
    afterEach(async () => {
        jest.clearAllMocks();
        await user_model_1.default.deleteMany({});
        await role_model_1.default.deleteMany({});
        await fine_model_1.default.deleteMany({});
        await item_model_1.default.deleteMany({});
    });
    /* ========================= PUT /users/:userId/status ========================= */
    describe("PUT /users/:userId/status", () => {
        it('should return 200 and update user status to "Inactive"', async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/users/${testUser._id}/status`)
                .send({ status: "Inactive" });
            expect(response.status).toBe(200);
            expect(response.body.user.status).toBe("Inactive");
            const userInDb = await user_model_1.default.findById(testUser._id);
            expect(userInDb?.status).toBe("Inactive");
        });
        it('should return 200 and update user status to "Active"', async () => {
            await user_model_1.default.findByIdAndUpdate(testUser._id, { status: "Inactive" });
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/users/${testUser._id}/status`)
                .send({ status: "Active" });
            expect(response.status).toBe(200);
            expect(response.body.user.status).toBe("Active");
            expect(require("../config/emailService").sendEmail).toHaveBeenCalled();
            expect(require("../config/whatsapp").sendWhatsAppMessage).not.toHaveBeenCalled();
        });
        it("should return 400 if status is invalid", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/users/${testUser._id}/status`)
                .send({ status: "Pending" }); // Invalid status
            expect(response.status).toBe(400);
            expect(response.body.error).toContain("Invalid status value");
        });
        it("should return 400 if userId is not a valid ObjectId", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .put("/api/admin/users/invalid-id/status")
                .send({ status: "Active" });
            expect(response.status).toBe(400);
            expect(response.body.error).toContain("Invalid user ID format");
        });
        it("should return 404 if user ID does not exist", async () => {
            const validObjectId = new mongoose_1.default.Types.ObjectId().toString();
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/users/${validObjectId}/status`)
                .send({ status: "Active" });
            expect(response.status).toBe(404);
            expect(response.body.error).toContain("User not found");
        });
        it("should return 400 if deactivating a user with outstanding fines", async () => {
            await fine_model_1.default.create({
                userId: testUser._id,
                itemId: new mongoose_1.default.Types.ObjectId(),
                reason: "Overdue",
                amountIncurred: 10,
                outstandingAmount: 10,
                status: "Outstanding",
            });
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/users/${testUser._id}/status`)
                .send({ status: "Inactive" });
            expect(response.status).toBe(400);
            expect(response.body.error).toContain("outstanding unpaid fines");
        });
        it("should return 400 if deactivating a user with issued items", async () => {
            await issuedItem_model_1.default.create({
                userId: testUser._id,
                itemId: new mongoose_1.default.Types.ObjectId(),
                status: "Issued",
                issuedDate: new Date(),
                dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
                issuedBy: new mongoose_1.default.Types.ObjectId(),
            });
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/users/${testUser._id}/status`)
                .send({ status: "Inactive" });
            expect(response.status).toBe(400);
            expect(response.body.error).toContain("issued items are not yet returned");
        });
    });
    /* ========================= GET /users ========================= */
    describe("GET /users", () => {
        it("should return 200 and a paginated list of users", async () => {
            const response = await (0, supertest_1.default)(index_1.app).get("/api/admin/users?page=1&limit=5");
            expect(response.status).toBe(200);
            expect(response.body.users).toHaveLength(1);
            expect(response.body.users[0].email).toBe("sample@example.com");
            expect(response.body.users[0].password).toBeUndefined();
            expect(response.body.pagination.totalUsers).toBe(1);
            expect(response.body.pagination.totalPages).toBe(1);
        });
    });
    /* ========================= POST /users ========================= */
    describe("POST /users", () => {
        const newUser = {
            fullName: "New User",
            email: "new@example.com",
            username: "newuser",
            password: "password123",
            relationshipType: "Employee",
            employeeId: "E12345",
            assignedRoles: [],
        };
        it("should return 201 and the newly created user", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/admin/users")
                .send(newUser);
            expect(response.status).toBe(201);
            expect(response.body.user.email).toBe("new@example.com");
            expect(response.body.user.status).toBe("Inactive");
            expect(response.body.user.passwordResetRequired).toBe(true);
            expect(require("../config/emailService").sendEmail).toHaveBeenCalled();
        });
        it("should return 409 if email already exists", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/admin/users")
                .send({ ...newUser, email: "sample@example.com" });
            expect(response.status).toBe(409);
            expect(response.body.error).toContain("email or username already exists");
        });
        it("should return 409 if employeeId already exists", async () => {
            await user_model_1.default.create({
                ...newUser,
                email: "another@example.com",
                username: "another",
            });
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/admin/users")
                .send({ ...newUser, email: "final@example.com", username: "final" });
            expect(response.status).toBe(409);
            expect(response.body.error).toContain("Employee ID already exists");
        });
        it('should return 400 if relationshipType is "Employee" but employeeId is missing', async () => {
            const { employeeId, ...badUser } = newUser;
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/admin/users")
                .send({ ...badUser, email: "test2@example.com", username: "test2" });
            expect(response.status).toBe(400);
            expect(response.body.error).toContain("Employee ID is required");
        });
    });
    /* ========================= GET /users/:userId ========================= */
    describe("GET /users/:userId", () => {
        it("should return 200 and the user details", async () => {
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/admin/users/${testUser._id}`);
            expect(response.status).toBe(200);
            expect(response.body.user.email).toBe(testUser.email);
        });
        it("should return 404 if user ID does not exist", async () => {
            const validObjectId = new mongoose_1.default.Types.ObjectId().toString();
            const response = await (0, supertest_1.default)(index_1.app).get(`/api/admin/users/${validObjectId}`);
            const nullResponse = await (0, supertest_1.default)(index_1.app).get(`/api/admin/users/${validObjectId}`);
            expect(nullResponse.status).toBe(200);
            expect(nullResponse.body.user).toBeNull();
        });
    });
    /* ========================= PUT /users/:userId ========================= */
    describe("PUT /users/:userId", () => {
        it("should return 200 and the updated user data", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/users/${testUser._id}`)
                .send({ fullName: "Updated Name", assignedRoles: [testRole._id] });
            expect(response.status).toBe(200);
            expect(response.body.user.fullName).toBe("Updated Name");
            const userInDb = await user_model_1.default.findById(testUser._id);
            expect(userInDb?.fullName).toBe("Updated Name");
        });
        it("should return 400 if userId is invalid", async () => {
            const response = await (0, supertest_1.default)(index_1.app)
                .put("/api/admin/users/invalid-id")
                .send({ fullName: "Updated Name" });
            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Invalid userId");
        });
        it("should return 404 if user ID does not exist", async () => {
            const validObjectId = new mongoose_1.default.Types.ObjectId().toString();
            const response = await (0, supertest_1.default)(index_1.app)
                .put(`/api/admin/users/${validObjectId}`)
                .send({ fullName: "Updated Name" });
            expect(response.status).toBe(404);
            expect(response.body.error).toBe("User not found");
        });
    });
    /* ========================= PUT /users/:userId/reset-password ========================= */
    describe("PUT /users/:userId/reset-password", () => {
        it("should return 200 and set passwordResetRequired to true", async () => {
            await user_model_1.default.findByIdAndUpdate(testUser._id, {
                passwordResetRequired: false,
            });
            const response = await (0, supertest_1.default)(index_1.app).put(`/api/admin/users/${testUser._id}/reset-password`);
            expect(response.status).toBe(200);
            expect(response.body.user.passwordResetRequired).toBe(true);
            const userInDb = await user_model_1.default.findById(testUser._id);
            expect(userInDb?.passwordResetRequired).toBe(true);
        });
        it("should return 404 if user ID does not exist", async () => {
            const validObjectId = new mongoose_1.default.Types.ObjectId().toString();
            const response = await (0, supertest_1.default)(index_1.app).put(`/api/admin/users/${validObjectId}/reset-password`);
            expect(response.status).toBe(404);
            expect(response.body.error).toBe("User not found.");
        });
    });
    /* ========================= DELETE /users/:userId ========================= */
    describe("DELETE /users/:userId", () => {
        it("should return 200 and delete the user", async () => {
            const response = await (0, supertest_1.default)(index_1.app).delete(`/api/admin/users/${testUser._id}`);
            expect(response.status).toBe(200);
            expect(response.body.message).toBe("User deleted successfully.");
            const userInDb = await user_model_1.default.findById(testUser._id);
            expect(userInDb).toBeNull();
        });
        it("should return 400 if userId is invalid", async () => {
            const response = await (0, supertest_1.default)(index_1.app).delete("/api/admin/users/invalid-id");
            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Invalid user ID format.");
        });
        it("should return 404 if user ID does not exist", async () => {
            const validObjectId = new mongoose_1.default.Types.ObjectId().toString();
            const response = await (0, supertest_1.default)(index_1.app).delete(`/api/admin/users/${validObjectId}`);
            expect(response.status).toBe(404);
            expect(response.body.error).toBe("User not found.");
        });
        it("should return 400 if user has outstanding fines", async () => {
            await fine_model_1.default.create({
                userId: testUser._id,
                itemId: new mongoose_1.default.Types.ObjectId(),
                reason: "Overdue",
                amountIncurred: 10,
                outstandingAmount: 10,
                status: "Outstanding",
            });
            const response = await (0, supertest_1.default)(index_1.app).delete(`/api/admin/users/${testUser._id}`);
            expect(response.status).toBe(400);
            expect(response.body.error).toContain("outstanding unpaid fines");
        });
    });
});
