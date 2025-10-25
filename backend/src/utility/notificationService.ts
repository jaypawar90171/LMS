import Notification from "../models/notofication.modal";
import { Types } from "mongoose";

export interface CreateNotificationParams {
  recipientId: string | Types.ObjectId;
  title: string;
  message: string;
  level: "Info" | "Success" | "Warning" | "Danger";
  type: "user_registered" | "item_requested" | "donation_submitted" | "item_overdue" | "system_alert" | "force_password_reset" | "fine_created" | "fine_updated" | "fine_deleted" | "fine_payment_recorded" | "fine_waived";
  metadata?: any;
  expiresInDays?: number;
}

export class NotificationService {
  static async createNotification(params: CreateNotificationParams) {
    const {
      recipientId,
      title,
      message,
      level,
      type,
      metadata = {},
      expiresInDays
    } = params;

    const notificationData: any = {
      recipientId: new Types.ObjectId(recipientId),
      title,
      message: { content: message },
      level,
      type,
      metadata,
      read: false,
    };

    
  if (expiresInDays) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      notificationData.expiresAt = expiresAt;
    }

    const notification = new Notification(notificationData);
    await notification.save();

    return notification;
  }

  static async getAdminNotifications(filters: {
    startDate?: Date;
    endDate?: Date;
    type?: string;
    level?: string;
    read?: boolean;
    page?: number;
    limit?: number;
  }) {
    const {
      startDate,
      endDate,
      type,
      level,
      read,
      page = 1,
      limit = 20
    } = filters;

    const query: any = {};

    
  if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    
  if (type) query.type = type;
    if (level) query.level = level;
    if (read !== undefined) query.read = read;

    const skip = (page - 1) * limit;

    const notifications = await Notification.find(query)
      .populate('recipientId', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Notification.countDocuments(query);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async markAsRead(notificationId: string) {
    return await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );
  }

  static async markAllAsRead(recipientId: string) {
    return await Notification.updateMany(
      { recipientId: new Types.ObjectId(recipientId), read: false },
      { read: true }
    );
  }

  static async getUnreadCount(recipientId: string) {
    return await Notification.countDocuments({
      recipientId: new Types.ObjectId(recipientId),
      read: false
    });
  }

  static async deleteNotification(notificationId: string) {
    return await Notification.findByIdAndDelete(notificationId);
  }

  static async cleanupExpiredNotifications() {
    return await Notification.deleteMany({
      expiresAt: { $lte: new Date() }
    });
  }
}