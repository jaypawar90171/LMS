const User = require('../models/user.model');
const Role = require('../models/role.model');

// Test endpoint to check user permissions
exports.checkPermissions = async (req, res) => {
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
      if (typeof role === 'object' && role !== null && role._id) {
        userPermissions.push(...role.permissions);
        roleDetails.push({
          id: role._id,
          name: role.name,
          permissions: role.permissions
        });
      } else {
        const roleDoc = await Role.findById(role);
        if (roleDoc) {
          userPermissions.push(...roleDoc.permissions);
          roleDetails.push({
            id: roleDoc._id,
            name: roleDoc.name,
            permissions: roleDoc.permissions
          });
        }
      }
    }

    const uniquePermissions = [...new Set(userPermissions)];

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          status: user.status
        },
        roles: roleDetails,
        permissions: uniquePermissions,
        permissionCheck: {
          canViewItem: uniquePermissions.includes('canViewItem'),
          canCreateItem: uniquePermissions.includes('canCreateItem'),
          canEditItem: uniquePermissions.includes('canEditItem'),
          canDeleteItem: uniquePermissions.includes('canDeleteItem')
        }
      }
    });
  } catch (error) {
    console.error('Check permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Test endpoint that requires canViewItem permission
exports.testInventoryPermission = async (req, res) => {
  res.json({
    success: true,
    message: 'You have inventory view permission!',
    timestamp: new Date().toISOString()
  });
};