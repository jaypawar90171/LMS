import mongoose from "mongoose";
import "dotenv/config";

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("Database Connected...!!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connect;
