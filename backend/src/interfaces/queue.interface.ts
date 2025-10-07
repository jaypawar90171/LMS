import mongoose, { Schema, Document, Types } from "mongoose";

export interface IQueueMember {
  userId: Types.ObjectId;
  position: number;
  dateJoined: Date;
  notifiedAt?: Date;
  notificationExpires?: Date;
  status: "waiting" | "notified" | "skipped" | "issued";
}

export interface IQueue extends Document {
  itemId: Types.ObjectId;
  queueMembers: IQueueMember[];
  currentNotifiedUser?: Types.ObjectId | null;
  isProcessing: Boolean;
  createdAt: Date;
  updatedAt: Date;
}
