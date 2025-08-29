import mongoose, { Schema } from "mongoose";
import { IActivity } from "../interfaces/activity.interface";

const activitySchema = new Schema<IActivity>(
  {
    actor: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
      },
      role: {
        type: String,
      },
    },
    actionType: {
      type: String,
      required: true,
      enum: [
        "USER_CREATED",
        "ROLE_UPDATED",
        "BOOK_ADDED",
        "ITEM_REQUESTED",
        "ITEM_APPROVED",
        "ITEM_REJECTED",
        "SYSTEM_SETTING_UPDATED",
        "other",
      ],
    },
    target: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
      },
      role: {
        type: String,
      },
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

const Activity  = mongoose.model<IActivity>("Activity", activitySchema);
export default Activity;
