import mongoose, { Schema, Document, Types } from "mongoose";

export interface IQueueMember {
  userId: Types.ObjectId;
  position: number;
  dateJoined: Date;
}

export interface IQueue extends Document {
  itemId: Types.ObjectId;
  queueMembers: IQueueMember[];
}
