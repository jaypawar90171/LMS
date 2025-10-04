import mongoose from "mongoose";

export interface Permission {
  _id: string;
  permissionKey: string;
  description: string;
}

export interface Irole extends Document {
  _id?: string;
  roleName: string;
  description?: string;
  permissions: Permission[];
  immutable: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
