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
jest.mock("../middleware/auth.middleware", () => ({
    authUser: (req, res, next) => {
        req.user = { id: new mongoose_1.default.Types.ObjectId().toString() };
        next();
    },
}));
jest.mock("../services/admin.service", () => ({
    getInventoryReportService: jest.fn(),
    getFinesReportService: jest.fn(),
    getIssuedReportService: jest.fn(),
    generateInventoryReportPDF: jest.fn(),
    generateFinesReportPDF: jest.fn(),
    generateIssuedItemsReportPDF: jest.fn(),
    getQueueAnalytics: jest.fn(),
    exportQueueAnalytics: jest.fn(),
    exportIssuedItemsReport: jest.fn(),
    getDefaulterReport: jest.fn(),
    sendReminderService: jest.fn(),
    exportDefaulterReport: jest.fn(),
    getAllUsersReport: jest.fn(),
    exportAllUsersReport: jest.fn(),
}));
const mockedGetInventoryReport = adminService.getInventoryReportService;
const mockedGetDefaulterReport = adminService.getDefaulterReport;
const mockedExportDefaulterReport = adminService.exportDefaulterReport;
const mockedGenerateInventoryPDF = adminService.generateInventoryReportPDF;
const mockedSendReminder = adminService.sendReminderService;
const mockedGetAllUsersReport = adminService.getAllUsersReport;
const mockedExportAllUsersReport = adminService.exportAllUsersReport;
describe("Reports & Analytics API", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    /* ========================= JSON Reports ========================= */
    describe("GET /reports/inventory (JSON)", () => {
        it("should return 200 and JSON data from the service", async () => {
            const mockReport = [{ id: "123", title: "Test Book" }];
            mockedGetInventoryReport.mockResolvedValue(mockReport);
            const response = await (0, supertest_1.default)(index_1.app).get("/api/admin/reports/inventory");
            expect(response.status).toBe(200);
            expect(response.body.report).toEqual(mockReport);
            expect(mockedGetInventoryReport).toHaveBeenCalledTimes(1);
        });
        it("should return 500 if the service fails", async () => {
            mockedGetInventoryReport.mockRejectedValue(new Error("Database failure"));
            const response = await (0, supertest_1.default)(index_1.app).get("/api/admin/reports/inventory");
            expect(response.status).toBe(500);
            expect(response.body.message).toContain("Failed to fetch");
        });
    });
    describe("GET /reports/defaulters (JSON)", () => {
        it("should return 200 and data from the service", async () => {
            const mockData = [{ userName: "Defaulter" }];
            mockedGetDefaulterReport.mockResolvedValue(mockData);
            const response = await (0, supertest_1.default)(index_1.app).get("/api/admin/reports/defaulters");
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockData);
            expect(mockedGetDefaulterReport).toHaveBeenCalledTimes(1);
        });
        it("should pass query params to the service", async () => {
            const filters = {
                overdueSince: "2023-01-01",
                categoryId: "cat123",
                roleId: "role123",
            };
            await (0, supertest_1.default)(index_1.app).get("/api/admin/reports/defaulters").query(filters);
            expect(mockedGetDefaulterReport).toHaveBeenCalledWith(filters);
        });
    });
    describe("GET /reports/all-users (JSON)", () => {
        it("should return 200 and data from the service", async () => {
            const mockData = [{ userName: "User One" }];
            mockedGetAllUsersReport.mockResolvedValue(mockData);
            const response = await (0, supertest_1.default)(index_1.app).get("/api/admin/reports/all-users");
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(mockData);
        });
        it("should pass query params to the service", async () => {
            const filters = {
                roleId: "role123",
                status: "active",
                hasOverdue: "true",
            };
            await (0, supertest_1.default)(index_1.app).get("/api/admin/reports/all-users").query(filters);
            expect(mockedGetAllUsersReport).toHaveBeenCalledWith(filters);
        });
    });
    /* ========================= PDF Reports ========================= */
    describe("GET /reports/inventory/pdf", () => {
        it("should return 200, PDF content-type, and call the PDF service", async () => {
            mockedGenerateInventoryPDF.mockImplementation((res) => {
                res.setHeader("Content-Type", "application/pdf");
                res.setHeader("Content-Disposition", "attachment; filename=inventory-report.pdf");
                res.status(200);
                res.end();
                return Promise.resolve();
            });
            const response = await (0, supertest_1.default)(index_1.app).get("/api/admin/reports/inventory/pdf");
            expect(response.status).toBe(200);
            expect(mockedGenerateInventoryPDF).toHaveBeenCalledWith(expect.any(Object));
            expect(mockedGenerateInventoryPDF).toHaveBeenCalledTimes(1);
        }, 10000); // Add 10 second timeout
    });
    /* ========================= CSV/Export Reports ========================= */
    describe("GET /reports/defaulters/export (CSV)", () => {
        it("should return 200, CSV content-type, and CSV data from service", async () => {
            const mockCsvData = "User,Item,Days Overdue\nDefaulter,Book,10";
            mockedExportDefaulterReport.mockResolvedValue(mockCsvData);
            const response = await (0, supertest_1.default)(index_1.app)
                .get("/api/admin/reports/defaulters/export")
                .query({ roleId: "role123" });
            expect(response.status).toBe(200);
            expect(response.headers["content-type"]).toBe("text/csv; charset=utf-8");
            expect(response.headers["content-disposition"]).toContain("defaulter-report");
            expect(response.text).toBe(mockCsvData);
            expect(mockedExportDefaulterReport).toHaveBeenCalledWith({
                roleId: "role123",
            });
        });
    });
    describe("GET /reports/all-users/export (CSV)", () => {
        it("should return 200, CSV content-type, and CSV data from service", async () => {
            const mockCsvData = "User,Status\nUser One,Active";
            mockedExportAllUsersReport.mockResolvedValue(mockCsvData);
            const response = await (0, supertest_1.default)(index_1.app)
                .get("/api/admin/reports/all-users/export")
                .query({ status: "active" });
            expect(response.status).toBe(200);
            expect(response.headers["content-type"]).toBe("text/csv; charset=utf-8");
            expect(response.headers["content-disposition"]).toContain("all-users-report");
            expect(response.text).toBe(mockCsvData);
            expect(mockedExportAllUsersReport).toHaveBeenCalledWith({
                status: "active",
            });
        });
    });
    /* ========================= Action Endpoints ========================= */
    describe("POST /reports/defaulters/send-reminder", () => {
        it("should return 200 and call the sendReminder service with body data", async () => {
            const reminderData = {
                issuedItemId: "issued123",
                userId: "user123",
                itemId: "item123",
            };
            mockedSendReminder.mockResolvedValue({
                emailSent: true,
                whatsappSent: false,
            });
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/admin/reports/defaulters/send-reminder")
                .send(reminderData);
            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Reminder sent successfully");
            expect(response.body.data.emailSent).toBe(true);
            expect(mockedSendReminder).toHaveBeenCalledWith("issued123", "user123", "item123");
        });
        it("should return 500 if the sendReminder service fails", async () => {
            mockedSendReminder.mockRejectedValue(new Error("SMTP server down"));
            const response = await (0, supertest_1.default)(index_1.app)
                .post("/api/admin/reports/defaulters/send-reminder")
                .send({
                issuedItemId: "issued123",
                userId: "user123",
                itemId: "item123",
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe("SMTP server down");
        });
    });
});
