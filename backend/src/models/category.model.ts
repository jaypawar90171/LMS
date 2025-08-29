import mongoose, { Schema } from "mongoose";
import { Icategory } from "../interfaces/category.interface";

const categorySchema = new mongoose.Schema<Icategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    parentCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    defaultReturnPeriod: {
      type: Number,
      default: 20,
    },
  },
  { timestamps: true }
);

const Category = mongoose.model<Icategory>("Category", categorySchema);
export default Category;
