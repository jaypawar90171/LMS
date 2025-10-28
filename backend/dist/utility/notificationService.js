"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const notofication_modal_1 = __importDefault(require("../models/notofication.modal"));
const mongoose_1 = require("mongoose");
class NotificationService {
    static async createNotification(params) {
        const { recipientId, title, message, level, type, metadata = {}, expiresInDays } = params;
        const notificationData = {
            recipientId: new mongoose_1.Types.ObjectId(recipientId),
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
        const notification = new notofication_modal_1.default(notificationData);
        await notification.save();
        return notification;
    }
    static async getAdminNotifications(filters) {
        const { startDate, endDate, type, level, read, page = 1, limit = 20 } = filters;
        const query = {};
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate)
                query.createdAt.$gte = startDate;
            if (endDate)
                query.createdAt.$lte = endDate;
        }
        if (type)
            query.type = type;
        if (level)
            query.level = level;
        if (read !== undefined)
            query.read = read;
        const skip = (page - 1) * limit;
        const notifications = await notofication_modal_1.default.find(query)
            .populate('recipientId', 'fullName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        const total = await notofication_modal_1.default.countDocuments(query);
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
    static async markAsRead(notificationId) {
        return await notofication_modal_1.default.findByIdAndUpdate(notificationId, { read: true }, { new: true });
    }
    static async markAllAsRead(recipientId) {
        return await notofication_modal_1.default.updateMany({ recipientId: new mongoose_1.Types.ObjectId(recipientId), read: false }, { read: true });
    }
    static async getUnreadCount(recipientId) {
        return await notofication_modal_1.default.countDocuments({
            recipientId: new mongoose_1.Types.ObjectId(recipientId),
            read: false
        });
    }
    static async deleteNotification(notificationId) {
        return await notofication_modal_1.default.findByIdAndDelete(notificationId);
    }
    static async cleanupExpiredNotifications() {
        return await notofication_modal_1.default.deleteMany({
            expiresAt: { $lte: new Date() }
        });
    }
}
exports.NotificationService = NotificationService;
