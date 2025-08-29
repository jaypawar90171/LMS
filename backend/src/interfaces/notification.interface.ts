import { Document, Types } from "mongoose";

export interface INotification extends Document {
  recipientId: Types.ObjectId; 
  title: string;              
  message: {
    content: string;          
  };
  level: "Info" | "Success" | "Warning" | "Danger";
}
