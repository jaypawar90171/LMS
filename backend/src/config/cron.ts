import cron from "node-cron";
import https from "https"; 

cron.schedule("*/14 * * * *", () => {
  console.log("Running a scheduled health check every 14 minutes...");

  const req = https.get("https://lms-backend1-q5ah.onrender.com/", (res) => { 
    if (res.statusCode === 200) {
      console.log("Server ping successful (Status: 200)");
    } else {
      console.log(`Server ping failed with status code: ${res.statusCode}`);
    }
  });
  req.on("error", (e) => {
    console.error("Error while sending ping request:", e.message);
  });
});

export const initializeCronJob = () => {
  console.log("Cron jobs have been initialized.");
};