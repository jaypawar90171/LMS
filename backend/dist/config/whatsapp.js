"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWhatsAppMessage = void 0;
const twilio_1 = __importDefault(require("twilio"));
require("dotenv/config");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_WHATSAPP_NUMBER;
if (!accountSid || !authToken || !twilioPhoneNumber) {
    console.error("Twilio credentials are not set in environment variables.");
}
const client = (0, twilio_1.default)(accountSid, authToken);
/**
 * Sends a WhatsApp message to a specified phone number.
 * @param toPhoneNumber
 * @param messageBody
 */
const sendWhatsAppMessage = async (toPhoneNumber, messageBody) => {
    try {
        const message = await client.messages.create({
            from: `whatsapp:${twilioPhoneNumber}`,
            body: messageBody,
            to: `whatsapp:${toPhoneNumber}`,
        });
        console.log(`WhatsApp message sent successfully to ${toPhoneNumber}, SID: ${message.sid}`);
    }
    catch (error) {
        console.error(`Failed to send WhatsApp message to ${toPhoneNumber}:`, error);
    }
};
exports.sendWhatsAppMessage = sendWhatsAppMessage;
