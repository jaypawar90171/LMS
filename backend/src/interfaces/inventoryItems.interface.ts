import mongoose, { Schema, Document, Types, PopulatedDoc } from "mongoose";
import { Icategory } from "./category.interface";

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
  categoryId: PopulatedDoc<Icategory & Document>;
  subcategoryId?: mongoose.Types.ObjectId;
  barcode: string;
  defaultReturnPeriod?: number;
  mediaUrl: string;
  status: "Available" | "Issued" | "Lost" | "Damaged";
  createdAt?: Date;
  updatedAt?: Date;

  // Category-specific fields
  size?: "XS" | "S" | "M" | "L" | "XL" | "XXL";
  color?: string;
  genderType?: "Men" | "Women" | "Unisex" | "Kids";
  warrantyPeriod?: string;
  features?: string[];
  dimensions?: string;
  usageType?: string;
  usage?: string;
  ageGroup?: "0-3" | "4-7" | "8-12" | "13+";
  powerSource?: string;
}
