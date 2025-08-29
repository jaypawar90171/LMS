import mongoose, { Schema } from "mongoose";
import { IQueue, IQueueMember } from "../interfaces/queue.interface";

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
  },
  { _id: false } // prevents auto-generating _id for subdocument
);

const queueSchema = new Schema<IQueue>(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    queueMembers: [queueMemberSchema],
  },
  { timestamps: true }
);

const Queue = mongoose.model("Queue", queueSchema);
export default Queue;
