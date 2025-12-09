const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Role = require('../models/role.model');
const PermissionService = require('../services/permission.service');
const config = require('../config/config');

// Middleware to verify JWT token
exports.protect = async (req, res, next) => {
  try {
    if (req.path === '/logout') {
      return next();
    }
    
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers.authorization) {
      token = req.headers.authorization;
    }
    
    // Handle null string case
    if (token === 'null' || token === 'undefined') {
      token = null;
    }
    
    let decoded;
    try {
      // Always attempt JWT verification to maintain consistent timing
      if (!token) {
        throw new Error('No token provided');
      }
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    // Only fetch user with minimal fields needed
    const user = await User.findById(decoded.id).select('_id email fullName roles status').lean();
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Middleware to check user permissions (now includes user-specific overrides)
exports.authorize = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      // Get user's effective permissions (role + overrides)
      const userPermissions = await PermissionService.getUserPermissions(req.user._id);
      
      // Check if user has all required permissions
      const hasAllPermissions = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );
      
      if (!hasAllPermissions) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to perform this action',
          required: requiredPermissions,
          userPermissions: userPermissions
        });
      }
      
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};