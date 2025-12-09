const User = require('../models/user.model');
const Role = require('../models/role.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/config');
const AuditLog = require('../models/auditLog.model');
const NotificationService = require('../services/notification.service');
const crypto = require('crypto');
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (err) {
  console.warn('Nodemailer not installed, email functionality will be disabled');
}

// Mobile app signup
exports.signup = async (req, res) => {
  try {
    const {
  fullName,
  email,
  password,
  phoneNumber,
  dateOfBirth,
  address,
  employeeId,
} = req.body;

console.log('Signup request body:', req.body);

if (!employeeId) {
  return res.status(400).json({ success: false, error: "Employee ID is required" });
}

const formattedAddress = address?.trim() || "";

    // Validate required fields
    if (!fullName || !email || !password || !phoneNumber || !dateOfBirth || !formattedAddress) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateOfBirth)) {
      return res.status(400).json({
        success: false,
        message: 'Date of birth must be in YYYY-MM-DD format'
      });
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Check if employeeId already exists (if provided)
    if (employeeId) {
      const employeeIdExists = await User.findOne({ employeeId });
      if (employeeIdExists) {
        return res.status(409).json({
          success: false,
          message: 'Employee ID already exists'
        });
      }
    }

    // Get default employee role
    const defaultRole = await Role.findOne({ name: { $regex: '^employee$', $options: 'i' } });
    
    if (!defaultRole) {
      return res.status(500).json({
        success: false,
        message: 'Default employee role not found. Please contact administrator.'
      });
    }

    // Create user with pending approval status
    const user = await User.create({
      fullName,
      employeeId,
      email,
      password, // Will be hashed by pre-save hook
      phoneNumber,
      dateOfBirth,
      address: formattedAddress,
      relationshipType: 'Employee',
      roles: [defaultRole._id],
      status: 'Inactive',
      approvalStatus: 'Pending'
    });

    // Log the signup action
    await AuditLog.create({
      userId: user._id,
      actionType: 'create',
      entityType: 'user',
      entityId: user._id,
      details: { selfRegistration: true, isMobile: true },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Send notification to all admins
    try {
      
      const adminRoles = await Role.find({ 
        name: { $regex: 'admin|super', $options: 'i' } 
      });
      
      
      if (adminRoles.length > 0) {
        const adminRoleIds = adminRoles.map(role => role._id);
        const admins = await User.find({ 
          roles: { $in: adminRoleIds }, 
          status: 'Active' 
        });
        
        
        for (const admin of admins) {
          try {
            await NotificationService.sendNotification({
              userId: admin._id,
              title: 'New User Registration',
              message: `${user.fullName.replace(/[<>"'&]/g, '')} (${user.email}) has registered and is waiting for approval.`,
              type: 'UserApproval',
              entityType: 'User',
              entityId: user._id
            });
          } catch (notifError) {
            console.error(`Failed to send notification to admin ${admin.email}:`, notifError);
          }
        }
      } 
    } catch (adminNotifError) {
      console.error('Error in admin notification process:', adminNotifError);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Your account is pending approval by an administrator.',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        employeeId: user.employeeId,
        approvalStatus: user.approvalStatus
      }
    });
  } catch (error) {
    console.error('Mobile signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating account'
    });
  }
};

// Mobile app login
exports.login = async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;
    
    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if account is approved
    if (user.approvalStatus !== 'Approved') {
      let message = 'Account not approved';
      if (user.approvalStatus === 'Pending') {
        message = 'Account is pending approval by administrator';
      } else if (user.approvalStatus === 'Rejected') {
        message = 'Account has been rejected. Please contact administrator.';
      }
      return res.status(403).json({
        success: false,
        message
      });
    }
    
    // Check if user is active
    if (user.status !== 'Active') {
      return res.status(401).json({
        success: false,
        message: 'Your account is not active. Please contact the administrator.'
      });
    }
    
    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      // Increment failed login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.status = 'Locked';
        user.lockedReason = 'Too many failed login attempts';
        user.lockedAt = new Date();
        
        await user.save();
        
        return res.status(401).json({
          success: false,
          message: 'Account locked due to too many failed login attempts. Please contact the administrator.'
        });
      }
      
      await user.save();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Reset failed login attempts on successful login
    user.loginAttempts = 0;
    await user.save();
    
    // Create token payload
    const payload = {
      id: user._id,
      email: user.email,
      roles: user.roles,
      isMobile: true
    };
    
    // Sign token
    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: '30d' // Longer expiry for mobile app
    });
    
    // Log the login action (async)
    setImmediate(() => {
      AuditLog.create({
        userId: user._id,
        actionType: 'login',
        entityType: 'user',
        entityId: user._id,
        details: { deviceId, isMobile: true },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(console.error);
    });
    
    // Return token and user info
    res.status(200).json({
      success: true,
      token,
      requirePasswordChange: user.requirePasswordChange || false,
      message: user.requirePasswordChange ? 
        'Welcome! For security reasons, you must change your password before accessing the app.' : 
        'Login successful',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        roles: user.roles
      }
    });
  } catch (error) {
    console.error('Mobile login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login'
    });
  }
};

// Mobile app logout
exports.logout = async (req, res) => {
  try {
    // Log the logout action if user is available
    if (req.user && req.user._id) {
      await AuditLog.create({
        userId: req.user._id,
        actionType: 'logout',
        entityType: 'user',
        entityId: req.user._id,
        details: { isMobile: true },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Mobile logout error:', error);
    // Still return success for logout even if logging fails
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }
};

// Email configuration
const createEmailTransporter = () => {
  // Check if nodemailer is available
  if (!nodemailer) {
    return null;
  }
  
  // Check if mock email is enabled
  if (process.env.USE_MOCK_EMAIL === 'true') {
    return null; // Will trigger console logging fallback
  }
  
  // Use existing email configuration from .env.development
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null; // Will trigger console logging fallback
  }
  
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: parseInt(process.env.EMAIL_PORT) === 465,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    return transporter;
  } catch (error) {
    console.error('Error creating email transporter:', error);
    return null;
  }
};

// Mobile app forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    }

    if (user.status !== 'Active' || user.approvalStatus !== 'Approved') {
      return res.status(200).json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to user
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetTokenExpiry;
    await user.save();

    // Create reset URL for mobile users - use frontend URL with mobile reset path
    const frontendUrl = process.env.FRONTEND_URL || 'https://localhost:8080';
    // Ensure HTTPS is used for security
    const secureUrl = frontendUrl.startsWith('http://') ? frontendUrl.replace('http://', 'https://') : frontendUrl;
    const resetUrl = `${secureUrl}/mobile-reset-password?token=${resetToken}`;

    // Send email or fallback to console logging
    try {
      const transporter = createEmailTransporter();
      
      if (transporter) {
        // Real email sending
        const mailOptions = {
          from: process.env.EMAIL_FROM || 'Library Management System <noreply@library.com>',
          to: user.email,
          subject: 'Password Reset Request',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Password Reset Request</h2>
              <p>Hello ${user.fullName},</p>
              <p>You have requested to reset your password for your Library Management System account.</p>
              <p>Please click the button below to reset your password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
              </div>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you did not request this password reset, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
      } 
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // In development, don't fail - just log the reset URL
      if (!process.env.EMAIL_USER || process.env.NODE_ENV === 'development') {
      
      } else {
        // Clear the reset token if email fails in production
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        
        return res.status(500).json({
          success: false,
          message: 'Error sending reset email. Please try again later.'
        });
      }
    }

    // Log the forgot password action
    await AuditLog.create({
      userId: user._id,
      actionType: 'forgot_password',
      entityType: 'user',
      entityId: user._id,
      details: { isMobile: true },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: 'Password reset link has been sent to your email address.'
    });
  } catch (error) {
    console.error('Mobile forgot password error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error processing forgot password request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mobile app reset password using token
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    if (user.status !== 'Active' || user.approvalStatus !== 'Approved') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active or approved'
      });
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.requirePasswordChange = false;
    await user.save();

    // Log the password reset action
    await AuditLog.create({
      userId: user._id,
      actionType: 'password_reset',
      entityType: 'user',
      entityId: user._id,
      details: { passwordReset: true, isMobile: true },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Mobile reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
};

// Validate reset token
exports.validateResetToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required'
      });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Valid reset token',
      email: user.email
    });
  } catch (error) {
    console.error('Validate reset token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating reset token'
    });
  }
};

// Debug endpoint to check user status (remove in production)
exports.checkUserStatus = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Validate email format to prevent NoSQL injection
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user: {
        email: user.email,
        status: user.status,
        approvalStatus: user.approvalStatus,
        loginAttempts: user.loginAttempts,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0
      }
    });
  } catch (error) {
    console.error('Check user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking user status'
    });
  }
};

// Mobile app refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }
    
    // For mobile apps, we'll use a simple token refresh
    // In production, implement proper refresh token validation
    const payload = {
      id: req.user?._id || 'temp',
      email: req.user?.email || 'temp',
      roles: req.user?.roles || [],
      isMobile: true
    };
    
    const newToken = jwt.sign(payload, config.jwtSecret, {
      expiresIn: '30d'
    });
    
    res.status(200).json({
      success: true,
      token: newToken,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

// Mobile app change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, isFirstLogin } = req.body;
    const userId = req.user._id;
    
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Skip current password validation for first login or when requirePasswordChange is true
    if (!isFirstLogin && !user.requirePasswordChange) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required'
        });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    } 
    user.password = newPassword;
    user.requirePasswordChange = false; // Clear the flag after password change
    await user.save();

    setImmediate(() => {
      AuditLog.create({
        userId: user._id,
        actionType: 'update',
        entityType: 'user',
        entityId: user._id,
        details: { passwordChanged: true, isMobile: true, isFirstLogin: !!isFirstLogin },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(console.error);
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Mobile change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
};