import mongoose, { Schema, Document, Types, PopulatedDoc } from "mongoose";
import { IInventoryItem } from "./inventoryItems.interface";
import { IUser } from "./user.interface";
import { IFine } from "./fine.interface";

export interface IIssuedItem extends Document {
  itemId: PopulatedDoc<IInventoryItem & Document>;
  userId: PopulatedDoc<IUser & Document>;
  issuedDate: Date;
  dueDate: Date;
  issuedBy: PopulatedDoc<IUser & Document>;
  returnedTo?: PopulatedDoc<IUser & Document> | null;
  returnDate?: Date | null;
  status: "Issued" | "Returned";
  extensionCount: number;
  maxExtensionAllowed: number;
  fineId?: PopulatedDoc<IFine & Document> | null;
}
