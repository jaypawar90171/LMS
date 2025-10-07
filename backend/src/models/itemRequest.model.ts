import mongoose, { mongo, Schema } from "mongoose";
import { IIssueRequest } from "../interfaces/itemRequest.interface";

const issueRequestSchema = new Schema<IIssueRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    itemId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const IssueRequest = mongoose.model<IIssueRequest>(
  "IssueRequest",
  issueRequestSchema
);
export default IssueRequest;
