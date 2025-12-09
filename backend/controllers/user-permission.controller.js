const User = require('../models/user.model');
const Permission = require('../models/permission.model');

// Get user's effective permissions (role + overrides)
exports.getUserEffectivePermissions = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('roles');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get all permissions from roles
    const rolePermissions = new Set();
    user.roles.forEach(role => {
      role.permissions.forEach(permission => {
        rolePermissions.add(permission);
      });
    });

    // Apply user-specific overrides
    const effectivePermissions = new Set(rolePermissions);
    
    // Add granted permissions
    if (user.permissionOverrides?.granted) {
      user.permissionOverrides.granted.forEach(permission => {
        effectivePermissions.add(permission);
      });
    }
    
    // Remove revoked permissions
    if (user.permissionOverrides?.revoked) {
      user.permissionOverrides.revoked.forEach(permission => {
        effectivePermissions.delete(permission);
      });
    }

    res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        rolePermissions: Array.from(rolePermissions),
        grantedPermissions: user.permissionOverrides?.granted || [],
        revokedPermissions: user.permissionOverrides?.revoked || [],
        effectivePermissions: Array.from(effectivePermissions)
      }
    });
  } catch (error) {
    console.error('Get user effective permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user permissions'
    });
  }
};

// Update user permission overrides
exports.updateUserPermissions = async (req, res) => {
  try {
    const { granted = [], revoked = [] } = req.body;
    
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate permissions exist
    const allPermissions = await Permission.find({ isActive: true }).select('name');
    const validPermissions = allPermissions.map(p => p.name);
    
    const invalidGranted = granted.filter(p => !validPermissions.includes(p));
    const invalidRevoked = revoked.filter(p => !validPermissions.includes(p));
    
    if (invalidGranted.length > 0 || invalidRevoked.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid permissions provided',
        invalidPermissions: [...invalidGranted, ...invalidRevoked]
      });
    }

    // Update permission overrides
    user.permissionOverrides = {
      granted: [...new Set(granted)], // Remove duplicates
      revoked: [...new Set(revoked)]  // Remove duplicates
    };
    
    user.updatedBy = req.user._id;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User permissions updated successfully',
      data: {
        userId: user._id,
        permissionOverrides: user.permissionOverrides
      }
    });
  } catch (error) {
    console.error('Update user permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user permissions'
    });
  }
};

// Grant specific permission to user
exports.grantPermissionToUser = async (req, res) => {
  try {
    const { permission } = req.body;
    
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate permission exists
    const permissionExists = await Permission.findOne({ name: permission, isActive: true });
    if (!permissionExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid permission'
      });
    }

    // Initialize permissionOverrides if not exists
    if (!user.permissionOverrides) {
      user.permissionOverrides = { granted: [], revoked: [] };
    }

    // Add to granted if not already there
    if (!user.permissionOverrides.granted.includes(permission)) {
      user.permissionOverrides.granted.push(permission);
    }

    // Remove from revoked if exists there
    user.permissionOverrides.revoked = user.permissionOverrides.revoked.filter(p => p !== permission);

    user.updatedBy = req.user._id;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Permission granted successfully',
      data: {
        userId: user._id,
        permission,
        permissionOverrides: user.permissionOverrides
      }
    });
  } catch (error) {
    console.error('Grant permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error granting permission'
    });
  }
};

// Revoke specific permission from user
exports.revokePermissionFromUser = async (req, res) => {
  try {
    const { permission } = req.body;
    
    const user = await User.findById(req.params.userId).populate('roles');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has this permission through roles
    const hasPermissionThroughRole = user.roles.some(role => 
      role.permissions.includes(permission)
    );

    // Initialize permissionOverrides if not exists
    if (!user.permissionOverrides) {
      user.permissionOverrides = { granted: [], revoked: [] };
    }

    // If user has permission through role, add to revoked
    if (hasPermissionThroughRole) {
      if (!user.permissionOverrides.revoked.includes(permission)) {
        user.permissionOverrides.revoked.push(permission);
      }
    }

    // Remove from granted if exists there
    user.permissionOverrides.granted = user.permissionOverrides.granted.filter(p => p !== permission);

    user.updatedBy = req.user._id;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Permission revoked successfully',
      data: {
        userId: user._id,
        permission,
        permissionOverrides: user.permissionOverrides
      }
    });
  } catch (error) {
    console.error('Revoke permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error revoking permission'
    });
  }
};