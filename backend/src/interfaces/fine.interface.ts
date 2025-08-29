import { Schema, model, Document, Types } from "mongoose";

export interface IFine extends Document {
  userId: Types.ObjectId;
  itemId: Types.ObjectId;
  reason: "Overdue" | "Damaged" | string;
  amountIncurred: number;
  amountPaid: number;
  outstandingAmount: number;

  paymentDetails?: {
    paymentMethod: "Cash" | "Card" | string;
    transactionId?: string;
  };

  dateIncurred: Date;
  dateSettled?: Date | null;
  status: "Outstanding" | "Paid" | string;
  managedByAdminId?: Types.ObjectId;
}
