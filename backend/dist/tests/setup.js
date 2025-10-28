"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongoose_1 = __importDefault(require("mongoose"));
jest.mock("../config/emailService", () => ({
    sendEmail: jest.fn().mockResolvedValue(true),
}));
jest.mock("../config/whatsapp", () => ({
    sendWhatsAppMessage: jest.fn().mockResolvedValue(true),
}));
let mongoServer;
beforeAll(async () => {
    // Start a new in-memory MongoDB server
    await mongoose_1.default.disconnect();
    mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose_1.default.connect(uri);
});
afterEach(async () => {
    const collections = mongoose_1.default.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});
afterAll(async () => {
    await mongoose_1.default.disconnect();
    await mongoServer.stop();
});
