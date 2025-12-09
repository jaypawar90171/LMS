const User = require('../models/user.model');
const Role = require('../models/role.model');

// Check if user has specific permission
exports.hasPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id).populate('roles');
      
      if (!user || !user.roles.length) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const userPermissions = user.roles.flatMap(role => role.permissions);
      const hasAccess = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      req.userPermissions = userPermissions;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
};

// Get user permissions for UI rendering
exports.getUserPermissions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('roles', 'name permissions')
      .select('-password');

    const permissions = user.roles.flatMap(role => role.permissions);
    const roleNames = user.roles.map(role => role.name);

    res.json({
      success: true,
      data: {
        userId: user._id,
        roles: roleNames,
        permissions: [...new Set(permissions)]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get permissions'
    });
  }
};