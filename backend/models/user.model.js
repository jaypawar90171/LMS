const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    employeeId: {
      type: String,
      trim: true,
      sparse: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    address: {
      type: String,
    },
    relationshipType: {
      type: String,
      enum: ["Employee", "Family Member"],  
      required: true,
    },
    employeeReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
      },
    ],
    // User-specific permission overrides
    permissionOverrides: {
      granted: [
        {
          type: String, // Additional permissions granted to this user
        },
      ],
      revoked: [
        {
          type: String, // Permissions revoked from this user (even if role has them)
        },
      ],
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Locked"],
      default: "Active",
    },
    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Approved",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    lastLogin: {
      type: Date,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    refreshToken: String,
    requirePasswordChange: {
      type: Boolean,
      default: false,
    },
    notificationSettings: {
      pushNotifications: {
        type: Boolean,
        default: true,
      },
      emailNotifications: {
        type: Boolean,
        default: false,
      },
      reminderNotifications: {
        type: Boolean,
        default: true,
      },
    },
    profileImage: {
      url: { type: String, default: null },
      publicId: { type: String },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash password
userSchema.pre("save", async function (next) {
  const user = this;

  // Only hash the password if it's modified or new
  if (!user.isModified("password")) return next();

  try {
    // Check if password is already hashed (bcrypt hash format validation)
    if (
      user.password &&
      /^\$2[aby]?\$\d{1,2}\$[./A-Za-z0-9]{53}$/.test(user.password)
    ) {
      return next();
    }

    // Generate salt
    const salt = await bcrypt.genSalt(12);
    // Hash password
    const hashedPassword = await bcrypt.hash(user.password, salt);

    user.password = hashedPassword;
    next();
  } catch (error) {
    console.error("Pre-save hook: Error hashing password:", error);
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if account is locked
userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

const User = mongoose.model("User", userSchema);

module.exports = User;
