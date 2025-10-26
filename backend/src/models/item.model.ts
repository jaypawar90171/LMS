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
      sparse: true, //allows multiple null values
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
    size: {
      type: String,
      enum: ["XS", "S", "M", "L", "XL", "XXL"],
    },
    color: { type: String },
    genderType: {
      type: String,
      enum: ["Men", "Women", "Unisex", "Kids"],
    },
    warrantyPeriod: { type: String },
    features: [{ type: String }],
    dimensions: { type: String },
    usageType: { type: String },
    usage: { type: String },
    ageGroup: {
      type: String,
      enum: ["0-3", "4-7", "8-12", "13+"],
    },
    powerSource: { type: String },
  },
  { timestamps: true }
);

const InventoryItem = mongoose.model("InventoryItem", itemSchema);
export default InventoryItem;
