const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/user.model');
const Token = require('../models/token.model');
const Role = require('../models/role.model');
const sendEmail = require('../utils/email');
const config = require('../config/config');
const { ActivityLogger } = require('../utils/activity-logger'); 

// Helper function to generate tokens
const generateTokens = async (user, ipAddress) => {
  // Create JWT token
  const token = jwt.sign(
    { id: user._id, roles: user.roles.map(role => typeof role === 'object' ? role._id : role) },
    config.jwtSecret,
    { expiresIn: config.jwtExpiry }
  );

  // Create refresh token
  const refreshToken = crypto.randomBytes(40).toString('hex');
  
  // Save refresh token to database
  await Token.create({
    userId: user._id,
    token: refreshToken,
    type: 'refresh',
    expires: new Date(Date.now() + parseInt(config.refreshTokenExpiry) * 24 * 60 * 1000),
    createdByIp: ipAddress
  });

  return { token, refreshToken };
};

// Login controller
exports.login = async (req, res) => {
  try {
    const { emailOrUsername, password, rememberMe } = req.body;
    
    // Find user by email or employeeId
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername },
        { employeeId: emailOrUsername }
      ]
    }).populate('roles');
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email or employee ID'
      });
    }
    
      
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    
    // If password doesn't match, return error
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }
    
    // Update last login time
    user.lastLogin = Date.now();
    await user.save();
    
    // Log login activity (async)
    setImmediate(() => {
      ActivityLogger.login(user._id, req.ip, req.get('User-Agent')).catch(console.error);
    });
    
    // Generate tokens
    const { token, refreshToken } = await generateTokens(user, req.ip);
    
    // Get user roles and permissions
    const roles = user.roles.map(role => role.name);
    
    // Send response
    res.status(200).json({
      success: true,
      token,
      refreshToken: rememberMe ? refreshToken : null,
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: roles.length > 0 ? roles[0] : 'Administrator',
        roles
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login'
    });
  }
};

// Forgot password controller
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    // Return error if email doesn't exist
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token and save to user
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    
    await user.save();
    
    // Create reset URL - use frontend URL if available
    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    // Get HTML template for password reset email
    const getPasswordResetTemplate = require('../utils/email-templates/password-reset');
    const htmlContent = getPasswordResetTemplate(resetUrl);
    
    // Plain text version as fallback
    const message = `
      You are receiving this email because you (or someone else) has requested to reset your password.
      Please click on the following link to reset your password:
      ${resetUrl}
      If you did not request this, please ignore this email and your password will remain unchanged.
    `;
    
    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        message,
        html: htmlContent
      });
      
      res.status(200).json({
        success: true,
        message: 'Password reset link sent.'
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // If in development, return the token for testing
      if (config.env === 'development') {
        return res.status(200).json({
          success: true,
          message: 'Email sending failed, but in development mode. Use this token for testing:',
          resetToken,
          resetUrl
        });
      }
      
      // In production, revert the user changes and return error
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      throw new Error('Failed to send email');
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reset link. Please try again later.'
    });
  }
};

// Validate reset token controller
exports.validateResetToken = async (req, res) => {
  try {
    const { token } = req.query;
    
    // Hash token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset link is invalid or has expired. Please request a new password reset.'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Password reset link is valid. You can now reset your password.'
    });
  } catch (error) {
    console.error('Validate reset token error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while validating the token.'
    });
  }
};

// Reset password controller
exports.resetPassword = async (req, res) => {
  try {
    const { token, password, newPassword } = req.body;
    const passwordToUse = password || newPassword;
    
    // Hash token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset link is invalid or has expired. Please request a new password reset.'
      });
    }
    
    // Update password
    user.password = passwordToUse;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while resetting your password.'
    });
  }
};

// Logout controller
exports.logout = async (req, res) => {
  try {
    
    const { refreshToken } = req.body;
    
    // Log logout activity (async)
    if (req.user) {
      setImmediate(() => {
        ActivityLogger.logout(req.user._id, req.ip).catch(console.error);
      });
    }
    
    // If refresh token exists, revoke it
    if (refreshToken) {
      const token = await Token.findOne({ token: refreshToken, type: 'refresh' });
      
      if (token) {
        token.revoked = true;
        token.revokedByIp = req.ip;
        await token.save();
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during logout.'
    });
  }
};