import { Document, Types } from "mongoose";

export interface INewItemRequest extends Document {
  userId: Types.ObjectId; 
  name: string; 
  description: string; 
  categoryId?: Types.ObjectId;
  categoryName: string;
  isCustomCategory: boolean;
  subCategoryId?: Types.ObjectId;
  subCategoryName?: string; 
  reason: string; 
  quantity: number; 
  status: "pending" | "approved" | "rejected"; 
  requestedAt: Date; 
  processedAt?: Date; 
  processedBy?: Types.ObjectId; 
}