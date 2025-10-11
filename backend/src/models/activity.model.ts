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
        "USER_DELETED",
        "USER_UPDATED",
        "LOGIN",
        "LOGOUT",
        "PASSWORD_CHANGED",
        "PASSWORD_RESET",
        "ROLE_UPDATED",
        "ROLE_ADDED",
        "ROLE_DELETED",
        "CATEGORY_ADDED", 
        "CATEGORY_UPDATED",
        "CATEGORY_DELETED",
        "BOOK_ADDED",
        "ITEM_REQUESTED",
        "ITEM_APPROVED",
        "ITEM_REJECTED",
        "ITEM_ISSUED",
        "NOTIFICATION",
        "USER_ADDED_TO_QUEUE",
        "USER_REMOVED_TO_QUEUE",
        "ITEM_RETURN_REQUEST",
        "REQUEST_NEW_ITEM",
        "ITEM_DONATION",
        "EXTEND_PERIOD",
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
