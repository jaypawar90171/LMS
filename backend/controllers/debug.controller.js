const User = require('../models/user.model');
const Role = require('../models/role.model');

// Debug endpoint to check user permissions
exports.checkUserPermissions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('roles');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get all permissions from user's roles
    const userPermissions = [];
    const roleDetails = [];
    
    for (const role of user.roles) {
      if (typeof role === 'object' && role !== null) {
        userPermissions.push(...role.permissions);
        roleDetails.push({
          name: role.name,
          permissions: role.permissions
        });
      } else {
        const roleDoc = await Role.findById(role);
        if (roleDoc) {
          userPermissions.push(...roleDoc.permissions);
          roleDetails.push({
            name: roleDoc.name,
            permissions: roleDoc.permissions
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        userId: user._id,
        fullName: user.fullName,
        email: user.email,
        roles: roleDetails,
        allPermissions: [...new Set(userPermissions)], // Remove duplicates
        hasInventoryViewPermission: userPermissions.includes('canViewItem')
      }
    });
  } catch (error) {
    console.error('Check permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};