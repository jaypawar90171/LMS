import { Document, Types, Mongoose } from "mongoose";
import { INotificationPreference } from "./user.interface";

export interface Ipermission extends Document {
  _id: string;
  permissionKey: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Irole {
  _id: string;
  roleName: string;
  description?: string;
  permissions: string[] | Ipermission[];
  immutable: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUser {
  id: string;
  fullName: string;
  email: string;
  username: string;
  password: string;
  roles: string[] | Irole[];
  permissions: string[] | Ipermission[];
  status: "Active" | "Inactive" | "Locked";
  employeeId?: string;
  associatedEmployeeId?: Types.ObjectId;

  phoneNumber?: string;
  dateOfBirth?: Date;
  address?: string;
  lastLogin?: Date;
  accountLockedUntil?: Date;
  profile?: string;

  passwordResetRequired?: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;

  notificationPreference?: INotificationPreference;

  rememberMe?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}
