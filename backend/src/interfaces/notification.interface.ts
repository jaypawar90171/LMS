import { Document, Types } from "mongoose";

export interface INotification extends Document {
  recipientId: Types.ObjectId;
  title: string;
  message: {
    content: string;
  };
  level: "Info" | "Success" | "Warning" | "Danger";
  type:
    | "user_registered"
    | "item_requested"
    | "donation_submitted"
    | "item_overdue"
    | "system_alert";
  read: boolean;
  metadata?: {
    userId?: string;
    itemId?: string;
    donationId?: string;
    queueId?: string;
    [key: string]: any;
  };
  expiresAt?: Date;
}
