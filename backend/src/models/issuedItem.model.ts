import mongoose, { Schema, Types } from "mongoose";
import { IIssuedItem } from "../interfaces/issuedItems.interface";

const issuedItemSchema = new mongoose.Schema<IIssuedItem>(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    issuedDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: false,
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: new Types.ObjectId("68b5a390c3a9af30dbdf3be7"),
    },
    returnedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null, 
    },
    returnDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["Issued", "Returned"],
      default: "Issued",
    },
    extensionCount: {
      type: Number,
      default: 0,
    },
    maxExtensionAllowed: {
      type: Number,
      default: 2,
    },
    fineId: {
      type: Schema.Types.ObjectId,
      ref: "Fine",
      default: null,
    },
  },
  { timestamps: true }
);

const IssuedItem = mongoose.model<IIssuedItem>("IssuedItem", issuedItemSchema);
export default IssuedItem;
