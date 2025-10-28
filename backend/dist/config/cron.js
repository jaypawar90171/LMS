"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeCronJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const http_1 = __importDefault(require("http"));
node_cron_1.default.schedule("*/14 * * * *", () => {
    console.log("Running a scheduled health check every 14 minutes...");
    try {
        const req = http_1.default.get("https://lms-backend1-q5ah.onrender.com/", (res) => {
            if (res.statusCode === 200) {
                console.log("Server ping successful (Status: 200)");
            }
            else {
                console.log(`Server ping failed with status code: ${res.statusCode}`);
            }
        });
        req.on("error", (e) => {
            console.error("Error while sending ping request:", e.message);
        });
    }
    catch (error) {
        console.error("An unexpected error occurred within the cron job:", error);
    }
});
const initializeCronJob = () => {
    console.log("Cron jobs have been initialized.");
};
exports.initializeCronJob = initializeCronJob;
