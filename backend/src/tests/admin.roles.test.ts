import request from "supertest";
import mongoose from "mongoose";
import User from "../models/user.model";
import Role from "../models/role.model";
import { Permission } from "../models/permission.model";
import { app } from "../index";
import { RoleSchema } from "../validations/auth.validation";

jest.mock("../validations/auth.validation", () => ({
  RoleSchema: {
    parse: jest.fn((data) => data),
  },
}));

jest.mock("../middleware/auth.middleware", () => ({
  authUser: (req: any, res: any, next: any) => {
    req.user = {
      id: new mongoose.Types.ObjectId().toString(),
      email: "admin@example.com",
    };
    next();
  },
}));

describe("Roles & Permissions API (/api/admin/roles, /api/admin/permissions)", () => {
  let testRole: any;
  let viewUsersPermission: any;
  let manageUsersPermission: any;

  beforeEach(async () => {
    [viewUsersPermission, manageUsersPermission] = await Permission.insertMany([
      { permissionKey: "admin:viewAllUsers", description: "View all users" },
      { permissionKey: "admin:manageUsers", description: "Manage all users" },
    ]);

    testRole = await Role.create({
      roleName: "Librarian",
      description: "Librarian role",
      permissions: [viewUsersPermission._id],
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await Permission.deleteMany({});
  });

  /* ========================= GET /permissions ========================= */
  describe("GET /permissions", () => {
    it("should return 200 and a list of all available permissions", async () => {
      const response = await request(app).get("/api/admin/permissions");

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].permissionKey).toBe("admin:viewAllUsers");
    });

    it("should return 404 if no permissions are found", async () => {
      await Permission.deleteMany({});

      const response = await request(app).get("/api/admin/permissions");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("No permissions found.");
    });
  });

  /* ========================= GET /roles ========================= */
  describe("GET /roles", () => {
    it("should return 200 and a list of all roles with populated permissions", async () => {
      const response = await request(app).get("/api/admin/roles");

      expect(response.status).toBe(200);
      expect(response.body.roles).toHaveLength(1);
      expect(response.body.roles[0].roleName).toBe("Librarian");
      expect(response.body.roles[0].permissions).toBeInstanceOf(Array);
      expect(response.body.roles[0].permissions[0].permissionKey).toBe(
        "admin:viewAllUsers"
      );
    });

    it("should return 404 if no roles are found", async () => {
      await Role.deleteMany({});
      const response = await request(app).get("/api/admin/roles");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("No roles found.");
    });
  });

  /* ========================= POST /roles ========================= */
  describe("POST /roles", () => {
    const newRoleData = {
      roleName: "Student",
      description: "Student role",
      permissions: ["admin:viewAllUsers", "admin:manageUsers"],
    };

    it("should return 200 and the newly created role", async () => {
      const response = await request(app)
        .post("/api/admin/roles")
        .send(newRoleData);

      expect(response.status).toBe(200);
      expect(response.body.role.roleName).toBe("Student");

      const roleInDb = await Role.findById(response.body.role._id);
      expect(roleInDb?.permissions).toHaveLength(2);
    });

    it("should return 400 if roleName is missing", async () => {
      (RoleSchema.parse as jest.Mock).mockImplementationOnce(() => {
        throw {
          name: "ZodError",
          errors: [{ message: "Role name is required" }],
        };
      });

      const { roleName, ...badData } = newRoleData;
      const response = await request(app)
        .post("/api/admin/roles")
        .send(badData);

      const serviceLevelResponse = await request(app)
        .post("/api/admin/roles")
        .send({ description: "No name", permissions: ["admin:viewAllUsers"] });

      expect(serviceLevelResponse.status).toBe(400);
    });

    it("should return 400 if one or more permission keys are invalid", async () => {
      const response = await request(app)
        .post("/api/admin/roles")
        .send({
          ...newRoleData,
          permissions: ["admin:viewAllUsers", "invalid:permission"],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("One or more permissions not found.");
    });

    it("should return 409 if a role with that name already exists", async () => {
      const response = await request(app)
        .post("/api/admin/roles")
        .send({ ...newRoleData, roleName: "Librarian" }); // Duplicate name

      expect(response.status).toBe(409);
      expect(response.body.error).toContain("already exists");
    });
  });

  /* ========================= PUT /roles/:roleId ========================= */
  describe("PUT /roles/:roleId", () => {
    it("should return 200 and the updated role when changing permissions", async () => {
      const updateData = {
        permissions: ["admin:viewAllUsers", "admin:manageUsers"],
      };

      const response = await request(app)
        .put(`/api/admin/roles/${testRole._id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.permissions).toHaveLength(2);
      const receivedKeys = response.body.data.permissions.map(
        (p: any) => p.permissionKey
      );
      expect(receivedKeys).toContain("admin:manageUsers");
      expect(receivedKeys).toContain("admin:viewAllUsers");
    });

    it("should return 400 if roleId is not a valid ObjectId", async () => {
      const response = await request(app)
        .put("/api/admin/roles/invalid-id")
        .send({ description: "New Desc" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid userId");
    });

    it("should return 400 if one or more permission keys are invalid", async () => {
      const response = await request(app)
        .put(`/api/admin/roles/${testRole._id}`)
        .send({ permissions: ["invalid:key"] });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("One or more permissions not found.");
    });

    it("should return 404 if the role ID does not exist", async () => {
      const validObjectId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .put(`/api/admin/roles/${validObjectId}`)
        .send({ description: "New Desc" });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Role not found.");
    });
  });

  /* ========================= DELETE /roles/:roleId ========================= */
  describe("DELETE /roles/:roleId", () => {
    it("should return 200 and a success message", async () => {
      const response = await request(app).delete(
        `/api/admin/roles/${testRole._id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Role deleted successfully");

      const roleInDb = await Role.findById(testRole._id);
      expect(roleInDb).toBeNull();
    });

    it("should return 400 if roleId is not a valid ObjectId", async () => {
      const response = await request(app).delete("/api/admin/roles/invalid-id");

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid userId");
    });

    it("should return 404 if the role ID does not exist", async () => {
      const validObjectId = new mongoose.Types.ObjectId().toString();
      const response = await request(app).delete(
        `/api/admin/roles/${validObjectId}`
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Role not found.");
    });

    it("should return 400 if the role is currently assigned to any users", async () => {
      await User.create({
        fullName: "Role User",
        email: "roleuser@example.com",
        username: "roleuser",
        password: "password123",
        roles: [testRole._id],
      });

      const response = await request(app).delete(
        `/api/admin/roles/${testRole._id}`
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toContain(
        "Cannot delete this role. It is currently assigned to"
      );

      const roleInDb = await Role.findById(testRole._id);
      expect(roleInDb).not.toBeNull();
      expect(roleInDb?.roleName).toBe("Librarian");
    });
  });
});
