const Role = require('../models/role.model');
const User = require('../models/user.model');
const PermissionService = require('../services/permission.service');

// Get all roles
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    
    // Get user count for each role
    const rolesWithUserCount = await Promise.all(
      roles.map(async (role) => {
        const userCount = await User.countDocuments({ roles: role._id });
        return {
          id: role._id,
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          updatedAt: role.updatedAt,
          createdAt: role.createdAt,
          userCount
        };
      })
    );
    
    res.status(200).json({
      success: true,
      count: rolesWithUserCount.length,
      data: rolesWithUserCount
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving roles'
    });
  }
};

// Get role by ID
exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.roleId);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Get user count for this role
    const userCount = await User.countDocuments({ roles: role._id });
    
    res.status(200).json({
      success: true,
      data: {
        id: role._id,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        updatedAt: role.updatedAt,
        createdAt: role.createdAt,
        userCount
      }
    });
  } catch (error) {
    console.error('Get role by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving role'
    });
  }
};

// Create new role
exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    // Check if role name already exists
    const roleExists = await Role.findOne({ name });
    if (roleExists) {
      return res.status(409).json({
        success: false,
        message: 'Role name already exists'
      });
    }
    
    // Create role
    const role = await Role.create({
      name,
      description,
      permissions
    });
    
    res.status(201).json({
      success: true,
      message: `Role '${role.name}' created successfully!`,
      data: {
        id: role._id,
        name: role.name,
        description: role.description,
        permissions: role.permissions
      }
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating role'
    });
  }
};

// Update role
exports.updateRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    
    // Find role
    const role = await Role.findById(req.params.roleId);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Check if role name already exists (if changed)
    if (name !== role.name) {
      const roleExists = await Role.findOne({ name });
      if (roleExists) {
        return res.status(409).json({
          success: false,
          message: 'Role name already exists'
        });
      }
    }
    
    // Super Admin lockout protection
    if (role.name === 'superAdmin') {
      // Ensure critical permissions are not removed
      const criticalPermissions = [
        'canViewRole',
        'canCreateRole',
        'canEditRolePermissions',
        'canDeleteRole',
        'canManagePermissions'
      ];
      
      const hasAllCriticalPermissions = criticalPermissions.every(
        permission => permissions.includes(permission)
      );
      
      if (!hasAllCriticalPermissions) {
        return res.status(403).json({
          success: false,
          message: 'Cannot remove critical permissions from Super Admin role'
        });
      }
    }
    
    // Update role
    role.name = name || role.name;
    role.description = description || role.description;
    
    if (permissions && permissions.length > 0) {
      role.permissions = permissions;
    }
    
    await role.save();
    
    res.status(200).json({
      success: true,
      message: `Permissions for role '${role.name}' updated successfully!`,
      data: {
        id: role._id,
        name: role.name,
        description: role.description,
        permissions: role.permissions
      }
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating role'
    });
  }
};

// Compare roles
exports.compareRoles = async (req, res) => {
  try {
    const { roleIds } = req.body;
    
    if (!Array.isArray(roleIds) || roleIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least two role IDs are required for comparison'
      });
    }
    
    // Find roles
    const roles = await Role.find({ _id: { $in: roleIds } });
    
    if (roles.length !== roleIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more roles not found'
      });
    }
    
    // Get all unique permissions across all roles
    const allPermissions = new Set();
    roles.forEach(role => {
      role.permissions.forEach(permission => {
        allPermissions.add(permission);
      });
    });
    
    // Create comparison matrix
    const comparisonMatrix = {};
    Array.from(allPermissions).forEach(permission => {
      comparisonMatrix[permission] = {};
      roles.forEach(role => {
        comparisonMatrix[permission][role._id] = role.permissions.includes(permission);
      });
    });
    
    res.status(200).json({
      success: true,
      data: {
        roles: roles.map(role => ({
          id: role._id,
          name: role.name,
          description: role.description
        })),
        comparisonMatrix
      }
    });
  } catch (error) {
    console.error('Compare roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error comparing roles'
    });
  }
};

// Clone role
exports.cloneRole = async (req, res) => {
  try {
    const { sourceRoleId, name, description } = req.body;
    
    // Find source role
    const sourceRole = await Role.findById(sourceRoleId);
    
    if (!sourceRole) {
      return res.status(404).json({
        success: false,
        message: 'Source role not found'
      });
    }
    
    // Check if role name already exists
    const roleExists = await Role.findOne({ name });
    if (roleExists) {
      return res.status(409).json({
        success: false,
        message: 'Role name already exists'
      });
    }
    
    // Create new role with permissions from source role
    const newRole = await Role.create({
      name,
      description: description || `Clone of ${sourceRole.name}`,
      permissions: sourceRole.permissions
    });
    
    res.status(201).json({
      success: true,
      message: 'Role cloned successfully',
      data: {
        id: newRole._id,
        name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions,
        sourceRole: {
          id: sourceRole._id,
          name: sourceRole.name
        }
      }
    });
  } catch (error) {
    console.error('Clone role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cloning role'
    });
  }
};

// Delete role
exports.deleteRole = async (req, res) => {
  try {
    // Find role
    const role = await Role.findById(req.params.roleId);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Check if role is assigned to any users
    const usersWithRole = await User.countDocuments({ roles: role._id });
    
    if (usersWithRole > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete role '${role.name}'. There are ${usersWithRole} users currently assigned to this role. Please reassign these users before attempting to delete the role.`
      });
    }
    
    // Protect default roles
    if (['superAdmin', 'librarian', 'inventoryManager', 'employee', 'familyMember'].includes(role.name)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete default system role'
      });
    }
    
    // Delete role
    await role.deleteOne();
    
    res.status(200).json({
      success: true,
      message: `Role '${role.name}' deleted successfully.`
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting role'
    });
  }
};

// Get role statistics
exports.getRoleStatistics = async (req, res) => {
  try {
    // Get all roles
    const roles = await Role.find();
    
    // Get user counts for each role
    const roleStats = await Promise.all(
      roles.map(async (role) => {
        const userCount = await User.countDocuments({ roles: role._id });
        return {
          id: role._id,
          name: role.name,
          userCount,
          permissionCount: role.permissions.length
        };
      })
    );
    
    // Get total users
    const totalUsers = await User.countDocuments();
    
    // Get users without roles
    const usersWithoutRoles = await User.countDocuments({ roles: { $size: 0 } });
    
    // Get most common role
    const mostCommonRole = roleStats.reduce((prev, current) => 
      (prev.userCount > current.userCount) ? prev : current, { userCount: 0 });
    
    // Get role with most permissions
    const roleWithMostPermissions = roleStats.reduce((prev, current) => 
      (prev.permissionCount > current.permissionCount) ? prev : current, { permissionCount: 0 });
    
    res.status(200).json({
      success: true,
      data: {
        totalRoles: roles.length,
        totalUsers,
        usersWithoutRoles,
        mostCommonRole: mostCommonRole.userCount > 0 ? {
          id: mostCommonRole.id,
          name: mostCommonRole.name,
          userCount: mostCommonRole.userCount,
          percentageOfUsers: ((mostCommonRole.userCount / totalUsers) * 100).toFixed(2)
        } : null,
        roleWithMostPermissions: roleWithMostPermissions.permissionCount > 0 ? {
          id: roleWithMostPermissions.id,
          name: roleWithMostPermissions.name,
          permissionCount: roleWithMostPermissions.permissionCount
        } : null,
        roleStats
      }
    });
  } catch (error) {
    console.error('Get role statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving role statistics'
    });
  }
};

// Get all permissions from the database and group by category
exports.getPermissions = async (req, res) => {
  try {
    const Permission = require('../models/permission.model');
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

// Get users assigned to a role
exports.getUsersByRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Validate role exists
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Find users with this role
    const users = await User.find({ roles: roleId })
      .select('fullName email employeeId phoneNumber status')
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const totalUsers = await User.countDocuments({ roles: roleId });
    
    res.status(200).json({
      success: true,
      count: users.length,
      total: totalUsers,
      totalPages: Math.ceil(totalUsers / parseInt(limit)),
      currentPage: parseInt(page),
      data: {
        role: {
          id: role._id,
          name: role.name,
          description: role.description
        },
        users: users.map(user => ({
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          employeeId: user.employeeId,
          phoneNumber: user.phoneNumber,
          status: user.status
        }))
      }
    });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving users by role'
    });
  }
};

// Get user's effective permissions
exports.getUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const permissions = await PermissionService.getUserPermissions(userId);
    
    res.status(200).json({
      success: true,
      data: {
        userId,
        permissions
      }
    });
  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving user permissions'
    });
  }
};

// Grant additional permissions to user
exports.grantUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;
    
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Permissions array is required'
      });
    }
    
    await PermissionService.grantPermissions(userId, permissions);
    
    res.status(200).json({
      success: true,
      message: 'Permissions granted successfully',
      data: {
        userId,
        grantedPermissions: permissions
      }
    });
  } catch (error) {
    console.error('Grant user permissions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error granting permissions'
    });
  }
};

// Revoke permissions from user
exports.revokeUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;
    
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Permissions array is required'
      });
    }
    
    await PermissionService.revokePermissions(userId, permissions);
    
    res.status(200).json({
      success: true,
      message: 'Permissions revoked successfully',
      data: {
        userId,
        revokedPermissions: permissions
      }
    });
  } catch (error) {
    console.error('Revoke user permissions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error revoking permissions'
    });
  }
};

// Get user's permission breakdown
exports.getUserPermissionBreakdown = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const breakdown = await PermissionService.getUserPermissionBreakdown(userId);
    
    res.status(200).json({
      success: true,
      data: {
        userId,
        ...breakdown
      }
    });
  } catch (error) {
    console.error('Get user permission breakdown error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving permission breakdown'
    });
  }
};