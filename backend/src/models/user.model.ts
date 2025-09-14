import mongoose, { Types, Schema, ObjectId } from "mongoose";
import bcrypt from "bcrypt";
import { IUser, INotificationPreference } from "../interfaces/user.interface";
import Role from "./role.model";

const userSchema = new mongoose.Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false, //not return in response by default
    },
    roles: [
      {
        type: Schema.Types.ObjectId,
        ref: "Role",
      },
    ],
    status: {
      type: String,
      enum: ["Active", "Inactive", "Locked"],
      default: "Inactive",
    },
    employeeId: {
      type: String,
    },
    associatedEmployeeId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
    },
    phoneNumber: String,
    dateOfBirth: Date,
    address: String,
    lastLogin: Date,
    accountLockedUntil: Date,
    profile: String,
    passwordResetRequired: {
      type: Boolean,
      default: false,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    notificationPreference: {
      email: {
        type: Boolean,
        default: true,
      },
      whatsApp: {
        type: Boolean,
        default: true,
      },
    },
    rememberMe: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

//hash the password before saving it the database
userSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password")) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }

    if (this.roles && this.roles.length > 0) {
      const roles = await Role.find({ _id: { $in: this.roles } });

      const alwaysActiveRoles = ["Admin", "Librarian", "SuperAdmin"];
      const hasAlwaysActiveRole = roles.some((role) =>
        alwaysActiveRoles.includes(role.roleName)
      );

      if (hasAlwaysActiveRole) {
        this.status = "Active";
      }
    }
    next();
  } catch (error) {
    next(error as any);
  }
});

//compare the password with the password that is already in the database
userSchema.methods.comparePassword = async function (userPassword: string) {
  return await bcrypt.compare(userPassword, this.password);
};

// check if the roles is employee it should also include the empoyeeId
// const EMPLOYEE_ROLE_ID = new mongoose.Types.ObjectId(
//   "68b5a390c3a9af30dbdf3be8"
// );
// userSchema.pre("validate", function (next) {
//   if (this.roles && this.roles.includes(EMPLOYEE_ROLE_ID) && !this.employeeId) {
//     return next(new Error("employeeId is required for Employee role"));
//   }
//   next();
// });

const User = mongoose.model<IUser>("User", userSchema);
export default User;
