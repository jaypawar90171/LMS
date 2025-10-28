"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./config/db"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const rateLimiter_1 = __importDefault(require("./middleware/rateLimiter"));
const cronJobs_1 = require("./config/cronJobs");
const cron_1 = require("./config/cron");
dotenv_1.default.config();
(0, db_1.default)();
const app = (0, express_1.default)();
exports.app = app;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(rateLimiter_1.default);
app.set("view engine", "ejs");
(0, cronJobs_1.startCronJobs)();
(0, cron_1.initializeCronJob)();
app.get("/", (req, res) => {
    res.send("hello");
});
app.use("/api/user", user_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
