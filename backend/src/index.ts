import express, { Request, Response } from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import connect from "./config/db";
import UserRoutes from "./routes/user.routes";
import AdminRoutes from "./routes/admin.routes";
import rateLimiter from "./middleware/rateLimiter";
import { startCronJobs } from "./config/cronJobs";
import { initializeCronJob } from "./config/cron";

dotenv.config();
connect();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);
app.set("view engine", "ejs");
startCronJobs();
initializeCronJob();

app.get("/", (req: Request, res: Response) => {
  res.send("hello");
});

app.use("/api/user", UserRoutes);
app.use("/api/admin", AdminRoutes);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export {app};
