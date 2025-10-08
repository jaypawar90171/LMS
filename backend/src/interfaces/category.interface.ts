import { Document, Types } from "mongoose";

export interface Icategory extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  parentCategoryId?: Types.ObjectId | null; 
  defaultReturnPeriod?: number;
}
