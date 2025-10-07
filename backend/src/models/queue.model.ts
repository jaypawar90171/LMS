import mongoose, { Schema } from "mongoose";
import { IQueue, IQueueMember } from "../interfaces/queue.interface";
import { ref } from "process";
import { string } from "zod";

const queueMemberSchema = new Schema<IQueueMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    position: {
      type: Number,
      required: true,
    },
    dateJoined: {
      type: Date,
      default: Date.now,
    },
    notifiedAt: {
      type: Date,
      default: null,
    },
    notificationExpires: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["waiting", "notified", "skipped", "issued"],
    },
  },
  { _id: false } // prevents auto-generating _id for subdocument
);

const queueSchema = new Schema<IQueue>(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
      unique: true,
    },
    queueMembers: [queueMemberSchema],
    currentNotifiedUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isProcessing: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

queueSchema.index({ itemId: 1 });
queueSchema.index({ "queueMembers.status": 1 });
queueSchema.index({ "queueMembers.notificationExpires": 1 });

const Queue = mongoose.model("Queue", queueSchema);
export default Queue;
