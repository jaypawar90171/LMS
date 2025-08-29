import mongoose, { Schema } from "mongoose";
import { ISystemSettings } from "../interfaces/systemSettings.interface";

const systemSettingsSchema = new Schema<ISystemSettings>(
  {
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
      of: new Schema(
        {
          emailSubject: String,
          emailBody: String,
          whatsappMessage: String,
        },
        { _id: false }
      ),
    },
  },
  { timestamps: true }
);
