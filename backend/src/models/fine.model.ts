// fine.model.ts

import mongoose, { Schema } from "mongoose";
import { IFine } from "../interfaces/fine.interface"; // Make sure the path to your interface is correct

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
      default: 0, // This is the cumulative amount paid
    },
    outstandingAmount: {
      type: Number,
      required: true,
    },
    paymentDetails: [
      {
        paymentMethod: {
          type: String,
          enum: ["Cash", "Card", "Online Transfer"],
          required: true,
        },
        transactionId: {
          type: String,
          required: false,
        },
        paymentDate: {
          type: Date,
          default: Date.now,
        },
        notes: {
          type: String,
          required: false,
        },
        recordedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
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
      enum: ["Outstanding", "Paid", "Waived"],
      default: "Outstanding",
    },
  },
  { timestamps: true }
);

const Fine = mongoose.model<IFine>("Fine", fineSchema);
export default Fine;
