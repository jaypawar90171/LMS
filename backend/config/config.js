const dotenv = require('dotenv');
const path = require('path');

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
dotenv.config({ path: path.resolve(__dirname, '..', envFile) });

// Default configuration
const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  basePath: process.env.BASE_PATH || '',
  // mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/library-management',
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
  jwtExpiry: process.env.JWT_EXPIRY || '24h',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret_here',
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  email: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER || 'your_email@example.com',
    pass: process.env.EMAIL_PASS || 'your_email_password',
    from: process.env.EMAIL_FROM || 'noreply@library-management.com'
  }
};

module.exports = config;