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
const activitySchema = new mongoose_1.Schema({
    actor: {
        userId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
        },
        role: {
            type: String,
        },
    },
    actionType: {
        type: String,
        required: true,
        enum: [
            "USER_CREATED",
            "USER_DELETED",
            "USER_UPDATED",
            "LOGIN",
            "LOGOUT",
            "PASSWORD_CHANGED",
            "PASSWORD_RESET",
            "ROLE_UPDATED",
            "ROLE_ADDED",
            "ROLE_DELETED",
            "CATEGORY_ADDED",
            "CATEGORY_UPDATED",
            "CATEGORY_DELETED",
            "BOOK_ADDED",
            "ITEM_REQUESTED",
            "ITEM_APPROVED",
            "ITEM_REJECTED",
            "ITEM_ISSUED",
            "NOTIFICATION",
            "USER_ADDED_TO_QUEUE",
            "USER_REMOVED_TO_QUEUE",
            "ITEM_RETURN_REQUEST",
            "REQUEST_NEW_ITEM",
            "ITEM_DONATION",
            "EXTEND_PERIOD",
            "SYSTEM_SETTING_UPDATED",
            "other",
        ],
    },
    target: {
        userId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
        },
        role: {
            type: String,
        },
    },
    description: {
        type: String,
        required: true,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
    },
}, { timestamps: true });
const Activity = mongoose_1.default.model("Activity", activitySchema);
exports.default = Activity;
