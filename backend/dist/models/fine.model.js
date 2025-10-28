"use strict";
// fine.model.ts
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
const fineSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    itemId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "InventoryItem",
        required: true,
    },
    reason: {
        type: String,
        enum: ["Overdue", "Damaged", "Lost item"],
        required: true,
    },
    amountIncurred: {
        type: Number,
        required: true,
    },
    amountPaid: {
        type: Number,
        default: 0,
    },
    outstandingAmount: {
        type: Number,
        required: true,
    },
    paymentDetails: [
        {
            amountPaid: {
                type: Number,
                required: true,
            },
            paymentMethod: {
                type: String,
                enum: ["Cash", "Card", "Online Transfer"],
                required: true,
            },
            transactionId: {
                type: String,
                required: false,
            },
            paymentDate: {
                type: Date,
                default: Date.now,
            },
            notes: {
                type: String,
                required: false,
            },
            recordedBy: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "User",
            },
        },
    ],
    dateIncurred: {
        type: Date,
        default: Date.now,
    },
    dateSettled: {
        type: Date,
        default: null,
    },
    status: {
        type: String,
        enum: ["Outstanding", "Paid", "Waived"],
        default: "Outstanding",
    },
    waiverReason: {
        type: String,
        required: false,
    },
}, { timestamps: true });
const Fine = mongoose_1.default.model("Fine", fineSchema);
exports.default = Fine;
