/**
 * HTML template for password reset emails
 */

const getPasswordResetTemplate = (resetUrl) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 20px;
    }
    .header {
      background-color: #4a69bd;
      color: white;
      padding: 10px;
      text-align: center;
      border-radius: 5px 5px 0 0;
      margin: -20px -20px 20px;
    }
    .button {
      display: inline-block;
      background-color: #4a69bd;
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #777;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Password Reset Request</h2>
    </div>
    
    <p>Hello,</p>
    
    <p>You are receiving this email because you (or someone else) has requested to reset your password for your Library Management System account.</p>
    
    <p>Please click the button below to reset your password. This link is valid for 30 minutes.</p>
    
    <p style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </p>
    
    <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
    
    <p>If you're having trouble clicking the button, copy and paste the URL below into your web browser:</p>
    
    <p style="word-break: break-all;">${resetUrl}</p>
    
    <div class="footer">
      <p>This is an automated email from the Library Management System. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = getPasswordResetTemplate;