"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const role_model_1 = __importDefault(require("./role.model"));
const addressSchema = new mongoose_1.Schema({
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true },
}, { _id: false });
const userSchema = new mongoose_1.default.Schema({
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
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Role",
        },
    ],
    permissions: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Permission",
        },
    ],
    status: {
        type: String,
        enum: ["Active", "Inactive", "Locked"],
        default: "Inactive",
    },
    employeeId: {
        type: String,
        unique: true,
        sparse: true,
    },
    phoneNumber: String,
    dateOfBirth: Date,
    address: addressSchema,
    lastLogin: {
        type: Date,
        default: null,
    },
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
}, { timestamps: true });
//hash the password before saving it the database
userSchema.pre("save", async function (next) {
    try {
        if (this.isModified("password")) {
            const salt = await bcrypt_1.default.genSalt(10);
            this.password = await bcrypt_1.default.hash(this.password, salt);
        }
        if (this.roles && this.roles.length > 0) {
            const roles = await role_model_1.default.find({ _id: { $in: this.roles } });
            const alwaysActiveRoles = ["Super Admin", "Admin", "Librarian"];
            const hasAlwaysActiveRole = roles.some((role) => alwaysActiveRoles.includes(role.roleName));
            if (hasAlwaysActiveRole) {
                this.status = "Active";
            }
        }
        next();
    }
    catch (error) {
        next(error);
    }
});
//compare the password with the password that is already in the database
userSchema.methods.comparePassword = async function (userPassword) {
    return await bcrypt_1.default.compare(userPassword, this.password);
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
const User = mongoose_1.default.model("User", userSchema);
exports.default = User;
