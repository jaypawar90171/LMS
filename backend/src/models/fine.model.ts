import mongoose, { Schema } from "mongoose";
import { IFine } from "../interfaces/fine.interface";

const fineSchema = new Schema<IFine>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    itemId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    reason: {
      type: String,
      enum: ["Overdue", "Damaged"],
      required: true,
    },
    amountIncurred: {
      type: Number,
      required: true,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    outstandingAmount: {
      type: Number,
      required: true,
    },
    paymentDetails: {
      paymentMethod: {
        type: String,
        enum: ["Cash", "Card"],
        required: false,
      },
      transactionId: {
        type: String,
        required: false,
      },
    },
    dateIncurred: {
      type: Date,
      default: Date.now,
    },
    dateSettled: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["Outstanding", "Paid"],
      default: "Outstanding",
    },
    managedByAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

const Fine = mongoose.model<IFine>("Fine", fineSchema);
export default Fine;
