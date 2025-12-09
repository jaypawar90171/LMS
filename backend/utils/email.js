const nodemailer = require('nodemailer');
const config = require('../config/config');

const sendEmail = async (options) => {
  try {
    // Check if we're in development mode and should use mock email
    const useMockEmail = config.env === 'development' && process.env.USE_MOCK_EMAIL === 'true';
    
    if (useMockEmail) {
      
      return;
    }
    
    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      auth: {
        user: config.email.user,
        pass: config.email.pass
      },
      // For development - ignore TLS certificate errors
      ...(config.env === 'development' && { tls: { rejectUnauthorized: false } })
    });

    // Define email options
    const mailOptions = {
      from: config.email.from,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = sendEmail;