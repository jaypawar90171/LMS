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
const systemSettingsSchema = new mongoose_1.Schema({
    libraryName: {
        type: String,
        required: true,
    },
    contactEmail: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
    },
    address: {
        type: String,
        required: true,
    },
    operationalHours: {
        type: String,
        required: true,
    },
    borrowingLimits: {
        maxConcurrentIssuedItems: { type: Number, required: true },
        maxConcurrentQueues: { type: Number, required: true },
        maxPeriodExtensions: { type: Number, required: true },
        extensionPeriodDays: { type: Number, required: true },
    },
    fineRates: {
        overdueFineRatePerDay: { type: Number, required: true },
        lostItemBaseFine: { type: Number, required: true },
        damagedItemBaseFine: { type: Number, required: true },
        fineGracePeriodDays: { type: Number, required: true },
    },
    notificationChannels: {
        email: {
            enabled: { type: Boolean, default: false },
            smtpServer: { type: String },
            port: { type: Number },
            username: { type: String },
            password: { type: String },
        },
        whatsapp: {
            enabled: { type: Boolean, default: false },
            provider: { type: String },
            apiKey: { type: String },
            phoneNumber: { type: String },
        },
    },
    notificationTemplates: {
        type: Map,
        of: new mongoose_1.Schema({
            emailSubject: String,
            emailBody: String,
            whatsappMessage: String,
        }, { _id: false }),
    },
}, { timestamps: true });
const Setting = mongoose_1.default.model("Setting", systemSettingsSchema);
exports.default = Setting;
