import mongoose, { Schema } from "mongoose";
import { INotification } from "../interfaces/notification.interface";

const notoficationSchema = new Schema<INotification>(
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
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model<INotification>(
  "Notification",
  notoficationSchema
);
export default Notification;
