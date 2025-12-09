const User = require('../models/user.model');
const Role = require('../models/role.model');

class PermissionService {
  /**
   * Get all effective permissions for a user
   * @param {string} userId - User ID
   * @returns {Array} Array of permission names
   */
  static async getUserPermissions(userId) {
    try {
      const user = await User.findById(userId).populate('roles');
      if (!user) {
        throw new Error('User not found');
      }

      // Get permissions from all user roles
      const rolePermissions = new Set();
      user.roles.forEach(role => {
        role.permissions.forEach(permission => {
          rolePermissions.add(permission);
        });
      });

      // Add granted permissions
      const grantedPermissions = user.permissionOverrides?.granted || [];
      grantedPermissions.forEach(permission => {
        rolePermissions.add(permission);
      });

      // Remove revoked permissions
      const revokedPermissions = user.permissionOverrides?.revoked || [];
      revokedPermissions.forEach(permission => {
        rolePermissions.delete(permission);
      });

      return Array.from(rolePermissions);
    } catch (error) {
      console.error('Error getting user permissions:', error);
      throw error;
    }
  }

  /**
   * Check if user has a specific permission
   * @param {string} userId - User ID
   * @param {string} permission - Permission name
   * @returns {boolean} True if user has permission
   */
  static async hasPermission(userId, permission) {
    try {
      const permissions = await this.getUserPermissions(userId);
      return permissions.includes(permission);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Grant additional permissions to a user
   * @param {string} userId - User ID
   * @param {Array} permissions - Array of permission names to grant
   */
  static async grantPermissions(userId, permissions) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.permissionOverrides) {
        user.permissionOverrides = { granted: [], revoked: [] };
      }

      // Add new permissions to granted list (avoid duplicates)
      permissions.forEach(permission => {
        if (!user.permissionOverrides.granted.includes(permission)) {
          user.permissionOverrides.granted.push(permission);
        }
        // Remove from revoked list if it exists there
        const revokedIndex = user.permissionOverrides.revoked.indexOf(permission);
        if (revokedIndex > -1) {
          user.permissionOverrides.revoked.splice(revokedIndex, 1);
        }
      });

      await user.save();
      return user;
    } catch (error) {
      console.error('Error granting permissions:', error);
      throw error;
    }
  }

  /**
   * Revoke permissions from a user
   * @param {string} userId - User ID
   * @param {Array} permissions - Array of permission names to revoke
   */
  static async revokePermissions(userId, permissions) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.permissionOverrides) {
        user.permissionOverrides = { granted: [], revoked: [] };
      }

      // Add permissions to revoked list (avoid duplicates)
      permissions.forEach(permission => {
        if (!user.permissionOverrides.revoked.includes(permission)) {
          user.permissionOverrides.revoked.push(permission);
        }
        // Remove from granted list if it exists there
        const grantedIndex = user.permissionOverrides.granted.indexOf(permission);
        if (grantedIndex > -1) {
          user.permissionOverrides.granted.splice(grantedIndex, 1);
        }
      });

      await user.save();
      return user;
    } catch (error) {
      console.error('Error revoking permissions:', error);
      throw error;
    }
  }

  /**
   * Get user's permission breakdown (role-based vs overrides)
   * @param {string} userId - User ID
   * @returns {Object} Permission breakdown
   */
  static async getUserPermissionBreakdown(userId) {
    try {
      const user = await User.findById(userId).populate('roles');
      if (!user) {
        throw new Error('User not found');
      }

      const rolePermissions = new Set();
      const rolePermissionsByRole = {};

      user.roles.forEach(role => {
        rolePermissionsByRole[role.name] = role.permissions;
        role.permissions.forEach(permission => {
          rolePermissions.add(permission);
        });
      });

      const grantedPermissions = user.permissionOverrides?.granted || [];
      const revokedPermissions = user.permissionOverrides?.revoked || [];

      // Calculate effective permissions
      const effectivePermissions = new Set(rolePermissions);
      grantedPermissions.forEach(p => effectivePermissions.add(p));
      revokedPermissions.forEach(p => effectivePermissions.delete(p));

      return {
        rolePermissions: Array.from(rolePermissions),
        rolePermissionsByRole,
        grantedPermissions,
        revokedPermissions,
        effectivePermissions: Array.from(effectivePermissions)
      };
    } catch (error) {
      console.error('Error getting permission breakdown:', error);
      throw error;
    }
  }
}

module.exports = PermissionService;