const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/config');
const User = require('../models/user.model');
const Role = require('../models/role.model');

async function initAdminUser() {
  try {
    await mongoose.connect(config.mongoUri);

    // Create Admin role with all permissions
    const adminPermissions = [
      'canViewItem', 'canCreateItem', 'canEditItem', 'canDeleteItem',
      'canUpdateItemStatus', 'canManageCopies', 'canPrintBarcode',
      'canViewUser', 'canCreateUser', 'canEditUser', 'canDeleteUser',
      'canViewRole', 'canCreateRole', 'canEditRole', 'canDeleteRole',
      'canManageRoles', 'canManagePermissions', 'canEditRolePermissions',
      'canViewCategory', 'canCreateCategory', 'canEditCategory', 'canDeleteCategory',
      'canViewTransaction', 'canCreateTransaction', 'canEditTransaction',
      'canIssueItem', 'canReturnItem', 'canExtendPeriod', 'canViewQueue', 'canAllocateItem', 'canRemoveFromQueue',
      'canViewFine', 'canViewFines', 'canCreateFine', 'canEditFine', 'canDeleteFine', 'canWaiveFine', 'canAddManualFine', 'canRecordFinePayment',
      'canViewReports', 'canGenerateReports', 'canExportReports',
      'canViewDashboard', 'canViewAnalytics', 'canViewSettings', 'canEditSettings',
      'canDeactivateUser', 'canResetUserPassword', 'canUnlockUser', 'canApproveUser', 'canRejectUser',
      'canBulkImportUser', 'canExportUser', 'canViewUserActivity', 'canManageUserSessions', 'canImportUser'
    ];

    let adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      adminRole = new Role({
        name: 'Admin',
        description: 'Administrator with full access',
        permissions: adminPermissions
      });
      await adminRole.save();
    } else {
      // Update existing admin role with all permissions
      adminRole.permissions = adminPermissions;
      await adminRole.save();
    }

    // Create admin user
    const adminEmail = 'admin@library.com';
    let adminUser = await User.findOne({ email: adminEmail });
    
    if (!adminUser) {
      adminUser = new User({
        fullName: 'System Administrator',
        email: adminEmail,
        password: 'admin123', // This will be hashed by the pre-save hook
        relationshipType: 'Employee',
        roles: [adminRole._id],
        status: 'Active',
        approvalStatus: 'Approved'
      });
      await adminUser.save();
    } else {
      // Update existing user to have admin role
      if (!adminUser.roles.includes(adminRole._id)) {
        adminUser.roles.push(adminRole._id);
        await adminUser.save();
      } else {
      }
    }

    // Verify the setup
    const verifyUser = await User.findOne({ email: adminEmail }).populate('roles');

  } catch (error) {
    console.error('Error initializing admin user:', error);
  } finally {
    await mongoose.disconnect();
  }
}

initAdminUser();