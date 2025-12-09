const Permission = require('../models/permission.model');

// Get all permissions
exports.getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find({ isActive: true }).sort({ category: 1, name: 1 });
    
    // Group permissions by category
    const groupedPermissions = {};
    permissions.forEach(permission => {
      if (!groupedPermissions[permission.category]) {
        groupedPermissions[permission.category] = [];
      }
      groupedPermissions[permission.category].push({
        name: permission.name,
        description: permission.description
      });
    });
    
    res.status(200).json({
      success: true,
      data: groupedPermissions
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving permissions'
    });
  }
};

// Get user permissions (for frontend auth)
exports.getUserPermissions = async (req, res) => {
  try {
    const User = require('../models/user.model');
    const Role = require('../models/role.model');
    
    const user = await User.findById(req.user._id).populate('roles');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get all permissions from user's roles
    const permissions = new Set();
    user.roles.forEach(role => {
      role.permissions.forEach(permission => {
        permissions.add(permission);
      });
    });
    
    res.json({
      success: true,
      data: {
        userId: user._id,
        roles: user.roles.map(role => role.name),
        permissions: Array.from(permissions)
      }
    });
  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get permissions'
    });
  }
};