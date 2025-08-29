import mongoose from "mongoose";

export interface Irole extends Document {
  roleName: string;
  description?: string;
  permissions: mongoose.Types.ObjectId[];
  immutable: boolean;
}