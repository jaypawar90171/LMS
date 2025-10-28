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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const notificationSchema = new mongoose_1.Schema({
    recipientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        content: {
            type: String,
            required: true,
        },
    },
    level: {
        type: String,
        enum: ["Info", "Success", "Warning", "Danger"],
        required: true,
    },
    type: {
        type: String,
        enum: [
            "user_registered",
            "item_requested",
            "donation_submitted",
            "item_overdue",
            "system_alert",
            "force_password_reset",
            "fine_created", "fine_updated", "fine_deleted", "fine_payment_recorded", "fine_waived", "user_activated", "user_deactivated"
        ],
        required: true,
    },
    read: {
        type: Boolean,
        default: false,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    expiresAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});
// TTL index for auto-deleting expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const Notification = mongoose_1.default.model("Notification", notificationSchema);
exports.default = Notification;
