import { Document, Types } from "mongoose";

export interface INotificationPreference {
  email: boolean;
  whatsApp: boolean;
}

export interface IPermission {
  _id: string;
  permissionKey: string;
  description?: string;
}

export interface IUser extends Document {
  _id: string;
  fullName: string;
  email: string;
  username: string;
  password: string;
  roles: Types.ObjectId[];
  permissions: Types.ObjectId[];
  status?: "Active" | "Inactive" | "Locked";

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
