"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCronJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const admin_service_1 = require("../services/admin.service");
// Run every hour to check for expired notifications
node_cron_1.default.schedule("0 * * * *", async () => {
    console.log("Checking for expired queue notifications...");
    try {
        await (0, admin_service_1.checkExpiredNotifications)();
        console.log("Expired notifications check completed");
    }
    catch (error) {
        console.error("Error checking expired notifications:", error);
    }
});
const startCronJobs = () => {
    console.log("Cron jobs started");
};
exports.startCronJobs = startCronJobs;
