import mongoose, { Schema, Document, Types } from "mongoose";

export interface IIssuedItem extends Document {
  itemId: Types.ObjectId;
  userId: Types.ObjectId;
  issuedDate: Date;
  dueDate: Date;
  issuedBy: Types.ObjectId;
  returnedTo?: Types.ObjectId | null;
  returnDate?: Date | null;
  status: "Issued" | "Returned";
  extensionCount: number;
  maxExtensionAllowed: number;
  fineId: Types.ObjectId;
}
