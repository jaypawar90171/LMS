import mongoose, { mongo, Schema } from "mongoose";
import { IItemRequest } from "../interfaces/itemRequest.interface";

const itemRequestSchema: Schema = new Schema<IItemRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    authorOrCreator: {
      type: String,
      trim: true,
    },
    itemType: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    reasonForRequest: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

const ItemRequest = mongoose.model<IItemRequest>(
  "ItemRequest",
  itemRequestSchema
);

export default ItemRequest;
