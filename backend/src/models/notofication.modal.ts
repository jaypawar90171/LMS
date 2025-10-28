import mongoose, { Schema } from "mongoose";
import { INotification } from "../interfaces/notification.interface";

const notificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      content: {
        type: String,
        required: true,
      },
    },
    level: {
      type: String,
      enum: ["Info", "Success", "Warning", "Danger"],
      required: true,
    },
    type: {
      type: String,
      enum: [
        "user_registered",
        "item_requested",
        "donation_submitted",
        "item_overdue",
        "system_alert",
        "force_password_reset",
        "fine_created",
        "fine_updated",
        "fine_deleted",
        "fine_payment_recorded",
        "fine_waived",
        "user_activated",
        "user_deactivated",
        "donation_withdrawed",
        "password_changed",
        "notification_preference_updated",
        "profile_updated",
        "item_issued",
        "user_added_to_queue",
        "item return",
        "withdraw_queue",
        "extend_period"
      ],
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index for auto-deleting expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);
export default Notification;
