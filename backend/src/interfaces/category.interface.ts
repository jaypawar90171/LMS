import { Document, Types } from "mongoose";

export interface Icategory extends Document {
  name: string;
  description?: string;
  parentCategoryId?: Types.ObjectId | null; // null for top-level categories
  defaultReturnPeriod?: number;
}
