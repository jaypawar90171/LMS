import mongoose from "mongoose";
import { Ipermission } from "../interfaces/permission.interface";

const permissionSchema = new mongoose.Schema<Ipermission>(
  {
    permissionKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Permission = mongoose.model<Ipermission>("Permission", permissionSchema);
export default Permission;