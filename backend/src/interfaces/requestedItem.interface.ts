import { Document, Types } from "mongoose";

export interface INewItemRequest extends Document {
  userId: Types.ObjectId; // The user making the request
  name: string; // Name of the requested item
  description: string; // Description of the item
  category: string; // e.g., "Book", "Magazine", "Equipment"
  subCategory?: string; // e.g., "Fiction", "Science", "Laptop Charger"
  reason: string; // Justification for the request
  quantity: number; // How many items are being requested
  status: "pending" | "approved" | "rejected"; // Request status
  requestedAt: Date; // Timestamp for when the request was made
  processedAt?: Date; // Optional: Timestamp for when the request was processed
  processedBy?: Types.ObjectId; // Optional: The admin/librarian who processed it
}