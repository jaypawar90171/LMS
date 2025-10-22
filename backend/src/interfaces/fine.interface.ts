import { Schema, model, Document, Types } from "mongoose";

export interface IPaymentDetail {
  amountPaid: number;
  paymentMethod: "Cash" | "Card" | "Online Transfer";
  transactionId?: string;
  paymentDate: Date;
  notes?: string;
  recordedBy?: Types.ObjectId;
}

export interface IFine extends Document {
  userId: Types.ObjectId;
  itemId: Types.ObjectId;
  reason: "Overdue" | "Damaged" | string | "Lost Item";
  amountIncurred: number;
  amountPaid: number;
  outstandingAmount: number;

  paymentDetails: IPaymentDetail[];

  dateIncurred: Date;
  dateSettled?: Date | null;
  status: "Outstanding" | "Paid" | "Waived";
  managedByAdminId?: Types.ObjectId;
  waiverReason?: string;
}
