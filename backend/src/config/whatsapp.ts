import twilio from 'twilio';
import 'dotenv/config'; 

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_WHATSAPP_NUMBER; 

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.error("Twilio credentials are not set in environment variables.");
}

const client = twilio(accountSid, authToken);

/**
 * Sends a WhatsApp message to a specified phone number.
 * @param toPhoneNumber 
 * @param messageBody 
 */
export const sendWhatsAppMessage = async (toPhoneNumber: string, messageBody: string) => {
  try {
    const message = await client.messages.create({
      from: `whatsapp:${twilioPhoneNumber}`,
      body: messageBody,
      to: `whatsapp:${toPhoneNumber}`,
    });
    console.log(`WhatsApp message sent successfully to ${toPhoneNumber}, SID: ${message.sid}`);
  } catch (error) {
    console.error(`Failed to send WhatsApp message to ${toPhoneNumber}:`, error);
  }
};