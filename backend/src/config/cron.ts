import cron from "node-cron";
import http from "http";

cron.schedule("*/14 * * * *", () => {
  console.log("Running a scheduled health check every 14 minutes...");
  try {
    const req = http.get("http://localhost:30000", (res) => {
      if (res.statusCode === 200) {
        console.log("Server ping successful (Status: 200)");
      } else {
        console.log(`Server ping failed with status code: ${res.statusCode}`);
      }
    });

    req.on("error", (e) => {
      console.error("Error while sending ping request:", e.message);
    });
  } catch (error) {
    console.error("An unexpected error occurred within the cron job:", error);
  }
});

export const initializeCronJob = () => {
  console.log("Cron jobs have been initialized.");
};
