import { Document, Types } from "mongoose";

export interface IIssueRequest extends Document {
  userId: Types.ObjectId;
  itemId: Types.ObjectId;
  status: "pending" | "approved" | "rejected";
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: Types.ObjectId;
}
