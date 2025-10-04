import { renderTemplate } from "./renderTemplate";
import Setting from "../models/setting.model";

export async function getNotificationTemplate(
  key: string,
  placeholders: Record<string, string>,
  fallback: { subject: string; body: string; whatsapp?: string }
) {
  const settings = await Setting.findOne();

  if (!settings || !settings.notificationTemplates) {
    console.error("🔴 ERROR: Settings or notificationTemplates not found.");
    return fallback;
  }
  
  // Use .get() to retrieve the value from the Map
  const template = settings.notificationTemplates.get(key);

  if (template) {
    console.log(`👍 Template for key "${key}" found! Rendering...`);
    return {
      subject: renderTemplate(template.emailSubject || fallback.subject, placeholders),
      body: renderTemplate(template.emailBody || fallback.body, placeholders),
      whatsapp: template.whatsappMessage
        ? renderTemplate(template.whatsappMessage, placeholders)
        : fallback.whatsapp,
    };
  }
  
  console.warn(`🟡 WARNING: Template for key "${key}" not found. Using fallback.`);
  return fallback;
}