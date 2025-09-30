import mongoose, { Document, Schema, Types} from "mongoose";

export interface IDonation extends Document {
  userId: mongoose.Types.ObjectId;
  itemType: Types.ObjectId;
  title: string;
  description?: string;
  photos?: string[];
  duration: number;
  preferredContactMethod: "Email" | "whatsApp";
  status: "Pending" | "Accepted" | "Rejected";
}