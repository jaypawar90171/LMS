import mongoose, { Types, Schema } from "mongoose";
import bcrypt from "bcrypt";
import { IUser, INotificationPreference } from "../interfaces/user.interface";

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
        ref: "Roles",
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
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

//compare the password with the password that is already in the database
userSchema.methods.comparePassword = async function (userPassword: string) {
  return await bcrypt.compare(userPassword, this.password);
};

//check if the roles is employee it should also include the empoyeeId
// userSchema.pre("validate", function (next) {
//   if (this.roles && this.roles.includes() && !this.employeeId) {
//     return next(new Error("employeeId is required for Employee role"));
//   }
//   next();
// });

const User = mongoose.model<IUser>("User", userSchema);
export default User;
