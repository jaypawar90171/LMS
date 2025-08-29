import { mongo, Schema } from "mongoose";
import mongoose from "mongoose";
import { IInventoryItem } from "../interfaces/inventoryItems.interface";

const itemSchema = new mongoose.Schema<IInventoryItem>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    authorOrCreator: {
      type: String,
    },
    isbnOrIdentifier: {
      type: String,
      unique: true,
      required: true,
    },
    description: {
      type: String,
    },
    publisherOrManufacturer: {
      type: String,
    },
    publicationYear: {
      type: Number,
    },
    price: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    availableCopies: {
      type: Number,
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subcategoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    barcode: {
      type: String,
      unique: true,
      required: true,
    },
    defaultReturnPeriod: {
      type: Number,
    },
    mediaUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Available", "Issued", "Lost", "Damaged"],
      default: "Available",
    },
  },
  { timestamps: true }
);

const InventoryItem = mongoose.model("InventoryItem", itemSchema);
export default InventoryItem;
