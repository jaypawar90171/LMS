// cronJobs.ts
import cron from "node-cron";
import { checkExpiredNotifications } from "../services/admin.service";

// Run every hour to check for expired notifications
cron.schedule("0 * * * *", async () => {
  console.log("Checking for expired queue notifications...");
  try {
    await checkExpiredNotifications();
    console.log("Expired notifications check completed");
  } catch (error) {
    console.error("Error checking expired notifications:", error);
  }
});

export const startCronJobs = () => {
  console.log("Cron jobs started");
};
