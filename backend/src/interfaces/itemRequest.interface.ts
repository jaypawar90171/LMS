import { Document, Types } from "mongoose";

export interface IItemRequest extends Document {
  userId: Types.ObjectId; 
  title: string;
  authorOrCreator?: string; 
  itemType: Types.ObjectId; 
  reasonForRequest: string;
  status: "Pending" | "Approved" | "Rejected";
}
