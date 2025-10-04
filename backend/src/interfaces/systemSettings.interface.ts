import mongoose, { Document, Schema } from "mongoose";

export interface INotificationTemplate {
  emailSubject?: string;
  emailBody?: string;
  whatsappMessage?: string;
}

export interface ISystemSettings extends Document {
  libraryName: string;
  contactEmail: string;
  phoneNumber?: string;
  address: string;
  operationalHours: string;
  borrowingLimits: {
    maxConcurrentIssuedItems: number;
    maxConcurrentQueues: number;
    maxPeriodExtensions: number;
    extensionPeriodDays: number;
  };
  fineRates: {
    overdueFineRatePerDay: number;
    lostItemBaseFine: number;
    damagedItemBaseFine: number;
    fineGracePeriodDays: number;
  };
  notificationChannels: {
    email: {
      enabled: boolean;
      smtpServer: string;
      port: number;
      username: string;
      password: string;
    };
    whatsapp: {
      enabled: boolean;
      provider: string;
      apiKey: string;
      phoneNumber: string;
    };
  };
  notificationTemplates?: Map<string, INotificationTemplate>;
}
