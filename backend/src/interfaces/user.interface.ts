import { Document, Types } from "mongoose";

export interface INotificationPreference {
  email: boolean;
  whatsApp: boolean;
}

export interface IUser extends Document {
  fullName: string;
  email: string;
  username: string;
  password: string;
  roles: Types.ObjectId[]; // references "Roles"
  status?: "Active" | "Inactive" | "Locked";

  employeeId?: string;
  associatedEmployeeId?: Types.ObjectId; // references "Users"

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
