"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationTemplate = getNotificationTemplate;
const renderTemplate_1 = require("./renderTemplate");
const setting_model_1 = __importDefault(require("../models/setting.model"));
async function getNotificationTemplate(key, placeholders, fallback) {
    const settings = await setting_model_1.default.findOne();
    if (!settings || !settings.notificationTemplates) {
        console.error("ERROR: Settings or notificationTemplates not found.");
        return fallback;
    }
    const template = settings.notificationTemplates.get(key);
    if (template) {
        console.log(`Template for key "${key}" found! Rendering...`);
        return {
            subject: (0, renderTemplate_1.renderTemplate)(template.emailSubject || fallback.subject, placeholders),
            body: (0, renderTemplate_1.renderTemplate)(template.emailBody || fallback.body, placeholders),
            whatsapp: template.whatsappMessage
                ? (0, renderTemplate_1.renderTemplate)(template.whatsappMessage, placeholders)
                : fallback.whatsapp,
        };
    }
    console.warn(`WARNING: Template for key "${key}" not found. Using fallback.`);
    return fallback;
}
