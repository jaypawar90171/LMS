import request from "supertest";
import mongoose from "mongoose";
import { app } from "../index";
import User from "../models/user.model";
import Role from "../models/role.model";
import InventoryItem from "../models/item.model";
import Category from "../models/category.model";
import IssuedItem from "../models/issuedItem.model";
import Queue from "../models/queue.model";
import * as userService from "../services/user.service";

jest.mock("../validations/auth.validation", () => ({
  itemRequestUpdateSchema: { parse: jest.fn((data) => data) },
}));

jest.mock("../middleware/auth.middleware", () => ({
  authUser: jest.fn((req, res, next) => next()),
}));

jest.mock("../services/user.service", () => ({
  getCategoriesService: jest.fn(),
  getCategoryItemsService: jest.fn(),
  getItemService: jest.fn(),
  createIssueRequestService: jest.fn(),
  getNewArrivalsService: jest.fn(),
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

const mockedGetCategories = userService.getCategoriesService as jest.Mock;
const mockedGetCategoryItems = userService.getCategoryItemsService as jest.Mock;
const mockedGetItem = userService.getItemService as jest.Mock;
const mockedCreateIssueRequest =
  userService.createIssueRequestService as jest.Mock;
const mockedGetNewArrivals = userService.getNewArrivalsService as jest.Mock;

describe("User API - Inventory & Requests", () => {
  let testUser: any;
  let bookCategory: any;
  let availableItem: any;
  let unavailableItem: any;

  beforeAll(async () => {
    await Role.insertMany([
      { roleName: "employee", description: "Employee Role" },
    ]);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    unmockAuthUser();

    const roles = await Role.find({});
    testUser = await User.create({
      _id: new mongoose.Types.ObjectId(),
      fullName: "Inventory User",
      email: "inv@example.com",
      username: "invuser",
      password: "password123",
      status: "Active",
      roles: roles.map((r) => r._id),
    });
    testUser = testUser.toObject();
    testUser.id = testUser._id.toString();

    bookCategory = await Category.create({
      name: "Books",
      description: "Fiction",
    });
    availableItem = await InventoryItem.create({
      title: "Available Novel",
      categoryId: bookCategory._id,
      price: "15.00",
      quantity: 5,
      availableCopies: 1,
      status: "Available",
      barcode: "AV123",
    });
    unavailableItem = await InventoryItem.create({
      title: "Unavailable Textbook",
      categoryId: bookCategory._id,
      price: "50.00",
      quantity: 2,
      availableCopies: 0,
      status: "Issued",
      barcode: "UNAV456",
    });

    mockAuthUser(testUser);
  });

  afterEach(async () => {
    await User.deleteMany({});
    await InventoryItem.deleteMany({});
    await Category.deleteMany({});
    await IssuedItem.deleteMany({});
    await Queue.deleteMany({});
  });

  afterAll(async () => {
    await Role.deleteMany({});
  });

  /* ========================= GET /inventory/categories ========================= */
  describe("GET /inventory/categories", () => {
    it("should return 200 and a list of categories", async () => {
      const mockCategories = [
        { _id: "68f8d489ed280f904b854997", name: "Books" },
      ];
      mockedGetCategories.mockResolvedValue(mockCategories);

      const response = await request(app).get("/api/user/inventory/categories");

      expect(response.status).toBe(200);
      expect(response.body.message).toContain("fetched successfully");
      expect(response.body.data).toEqual(mockCategories);
      expect(mockedGetCategories).toHaveBeenCalledTimes(1);
    });

    it("should return 404 if no categories are found", async () => {
      mockedGetCategories.mockRejectedValue({
        statusCode: 404,
        message: "No categories found",
      });

      const response = await request(app).get("/api/user/inventory/categories");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("No categories found");
    });

    it("should return 401 Unauthorized if user is not logged in", async () => {
      unmockAuthUser();
      const response = await request(app).get("/api/user/inventory/categories");
      expect(response.status).toBe(401);
    });
  });

  /* ========================= GET /inventory/categories/items/:categoryId ========================= */
  describe("GET /inventory/categories/items/:categoryId", () => {
    it("should return 200 and items for a valid categoryId", async () => {
      const mockItems = [availableItem.toObject(), unavailableItem.toObject()];
      mockedGetCategoryItems.mockResolvedValue(mockItems);

      const response = await request(app).get(
        `/api/user/inventory/categories/items/${bookCategory._id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(mockedGetCategoryItems).toHaveBeenCalledWith(
        bookCategory._id.toString()
      );
    });

    it("should return 400 if categoryId is invalid", async () => {
      const response = await request(app).get(
        "/api/user/inventory/categories/items/invalid-id"
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid categoryId");
    });

    it("should return 404 if category is not found", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      mockedGetCategoryItems.mockRejectedValue({
        statusCode: 404,
        message: "No categories found",
      });

      const response = await request(app).get(
        `/api/user/inventory/categories/items/${fakeId}`
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("No categories found");
    });

    it("should return 404 if category exists but has no items", async () => {
      const emptyCategory = await Category.create({ name: "Empty" });
      mockedGetCategoryItems.mockRejectedValue({
        statusCode: 404,
        message: "No items found for this category",
      });

      const response = await request(app).get(
        `/api/user/inventory/categories/items/${emptyCategory._id}`
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("No items found for this category");
    });

    it("should return 401 Unauthorized if user is not logged in", async () => {
      unmockAuthUser();
      const response = await request(app).get(
        `/api/user/inventory/categories/items/${bookCategory._id}`
      );
      expect(response.status).toBe(401);
    });
  });

  /* ========================= GET /inventory/categories/:itemId ========================= */
  describe("GET /inventory/categories/:itemId (Get Specific Item)", () => {
    it("should return 200 and the specific item details", async () => {
      const mockItemData = availableItem.toObject();
      mockedGetItem.mockResolvedValue(mockItemData);

      const response = await request(app).get(
        `/api/user/inventory/categories/${availableItem._id}`
      );

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe(availableItem.title);
      expect(mockedGetItem).toHaveBeenCalledWith(availableItem._id.toString());
    });

    it("should return 400 if itemId is invalid", async () => {
      const response = await request(app).get(
        "/api/user/inventory/categories/invalid-id"
      );
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid itemId");
    });

    it("should return 404 if item is not found", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      mockedGetItem.mockRejectedValue({
        statusCode: 404,
        message: "No items found for this category",
      });

      const response = await request(app).get(
        `/api/user/inventory/categories/${fakeId}`
      );
      expect(response.status).toBe(404);
      expect(response.body.error).toBe("No items found for this category");
    });

    it("should return 401 Unauthorized if user is not logged in", async () => {
      unmockAuthUser();
      const response = await request(app).get(
        `/api/user/inventory/categories/${availableItem._id}`
      );
      expect(response.status).toBe(401);
    });
  });

  /* ========================= POST /issue-requests ========================= */
  describe("POST /issue-requests", () => {
    it("should return 201 and issue item immediately if available", async () => {
      const mockResult = {
        message: "Item issued successfully",
        type: "immediate",
        issuedItem: {
          _id: "issued123",
          itemTitle: availableItem.title,
          dueDate: new Date(),
        },
      };
      mockedCreateIssueRequest.mockResolvedValue(mockResult);

      const response = await request(app)
        .post("/api/user/issue-requests")
        .send({ itemId: availableItem._id.toString() });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe(mockResult.message);
      expect(response.body.data.type).toBe("immediate");
      expect(response.body.data.issuedItem).toBeDefined();
      expect(mockedCreateIssueRequest).toHaveBeenCalledWith(
        testUser.id,
        availableItem._id.toString()
      );
    });

    it("should return 201 and add user to queue if item is unavailable", async () => {
      const mockResult = {
        message:
          "Item is currently unavailable. You have been added to the queue...",
        type: "queued",
        queuePosition: 1,
      };
      mockedCreateIssueRequest.mockResolvedValue(mockResult);

      const response = await request(app)
        .post("/api/user/issue-requests")
        .send({ itemId: unavailableItem._id.toString() });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain("added to the queue");
      expect(response.body.data.type).toBe("queued");
      expect(response.body.data.queuePosition).toBe(1);
      expect(mockedCreateIssueRequest).toHaveBeenCalledWith(
        testUser.id,
        unavailableItem._id.toString()
      );
    });

    it("should return 400 if itemId is missing", async () => {
      const response = await request(app)
        .post("/api/user/issue-requests")
        .send({}); // Missing itemId
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Item ID is required");
    });

    it("should return 404 if item does not exist", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      mockedCreateIssueRequest.mockRejectedValue({
        statusCode: 404,
        message: "Item not found",
      });

      const response = await request(app)
        .post("/api/user/issue-requests")
        .send({ itemId: fakeId });
      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Item not found");
    });

    it("should return 400 if user is ineligible (e.g., overdue items)", async () => {
      mockedCreateIssueRequest.mockRejectedValue({
        statusCode: 400,
        message: "User has 1 overdue item(s)",
      });

      const response = await request(app)
        .post("/api/user/issue-requests")
        .send({ itemId: availableItem._id.toString() });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("User has 1 overdue item(s)");
    });

    it("should return 401 Unauthorized if user is not logged in", async () => {
      unmockAuthUser();
      const response = await request(app)
        .post("/api/user/issue-requests")
        .send({ itemId: availableItem._id.toString() });
      expect(response.status).toBe(401);
    });
  });

  /* ========================= GET /items/new-arrivals ========================= */
  describe("GET /items/new-arrivals", () => {
    it("should return 200 and a list of new arrival items", async () => {
      const mockArrivals = JSON.parse(
        JSON.stringify([availableItem.toObject()])
      );
      mockedGetNewArrivals.mockResolvedValue(mockArrivals);

      const response = await request(app).get("/api/user/items/new-arrivals");

      expect(response.status).toBe(200);
      expect(response.body.items).toEqual(mockArrivals);
      expect(mockedGetNewArrivals).toHaveBeenCalledTimes(1);
    });

    it("should return 401 Unauthorized if user is not logged in", async () => {
      unmockAuthUser();
      const response = await request(app).get("/api/user/items/new-arrivals");
      expect(response.status).toBe(401);
    });
  });

  /* ========================= GET /search/items ========================= */
  describe("GET /search/items", () => {
    it("should return 200 and items matching the query", async () => {
      const response = await request(app)
        .get("/api/user/search/items")
        .query({ query: "Novel" });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe("Available Novel");
    });

    it("should return 200 and items matching the category", async () => {
      const response = await request(app)
        .get("/api/user/search/items")
        .query({ category: bookCategory._id.toString() });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });

    it("should return 200 and items matching the status", async () => {
      const response = await request(app)
        .get("/api/user/search/items")
        .query({ status: "Issued" });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe("Unavailable Textbook");
    });

    it("should return 200 and items matching multiple filters", async () => {
      const response = await request(app)
        .get("/api/user/search/items")
        .query({ query: "Available", status: "Available" });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe("Available Novel");
    });

    it("should return 200 and an empty array if no items match", async () => {
      const response = await request(app)
        .get("/api/user/search/items")
        .query({ query: "NonExistent" });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });

    it("should return 401 Unauthorized if user is not logged in", async () => {
      unmockAuthUser();
      const response = await request(app)
        .get("/api/user/search/items")
        .query({ query: "Novel" });
      expect(response.status).toBe(401);
    });
  });
});
