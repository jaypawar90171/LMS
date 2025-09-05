import mongoose from "mongoose";

export interface IInventoryItem extends Document {
  title: string;
  authorOrCreator?: string;
  isbnOrIdentifier: string;
  description?: string;
  publisherOrManufacturer?: string;
  publicationYear?: number;
  price: mongoose.Types.Decimal128 | number;
  quantity: number;
  availableCopies: number;
  categoryId: mongoose.Types.ObjectId;
  subcategoryId?: mongoose.Types.ObjectId;
  barcode: string;
  defaultReturnPeriod?: number;
  mediaUrl: string;
  status: "Available" | "Issued" | "Lost" | "Damaged";
  createdAt?: Date;
  updatedAt?: Date;
}
