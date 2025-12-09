const Permission = require('../models/permission.model');

const permissions = [
  // Dashboard
  { name: 'canViewDashboard', description: 'View dashboard', category: 'dashboard' },
  { name: 'canViewAnalytics', description: 'View analytics', category: 'dashboard' },
  
  // User Management
  { name: 'canViewUser', description: 'View users', category: 'userManagement' },
  { name: 'canCreateUser', description: 'Create users', category: 'userManagement' },
  { name: 'canEditUser', description: 'Edit users', category: 'userManagement' },
  { name: 'canDeleteUser', description: 'Delete users', category: 'userManagement' },
  { name: 'canDeactivateUser', description: 'Deactivate users', category: 'userManagement' },
  { name: 'canResetUserPassword', description: 'Reset user passwords', category: 'userManagement' },
  { name: 'canUnlockUser', description: 'Unlock users', category: 'userManagement' },
  { name: 'canApproveUser', description: 'Approve users', category: 'userManagement' },
  { name: 'canRejectUser', description: 'Reject users', category: 'userManagement' },
  { name: 'canBulkImportUser', description: 'Bulk import users', category: 'userManagement' },
  { name: 'canExportUser', description: 'Export users', category: 'userManagement' },
  { name: 'canViewUserActivity', description: 'View user activity', category: 'userManagement' },
  { name: 'canManageUserSessions', description: 'Manage user sessions', category: 'userManagement' },
  { name: 'canImportUser', description: 'Import users', category: 'userManagement' },
  
  // Role Management
  { name: 'canManageRoles', description: 'Manage roles', category: 'roleManagement' },
  { name: 'canManagePermissions', description: 'Manage permissions', category: 'roleManagement' },
  { name: 'canViewRole', description: 'View roles', category: 'roleManagement' },
  { name: 'canCreateRole', description: 'Create roles', category: 'roleManagement' },
  { name: 'canEditRolePermissions', description: 'Edit role permissions', category: 'roleManagement' },
  { name: 'canDeleteRole', description: 'Delete roles', category: 'roleManagement' },
  
  // Inventory Management
  { name: 'canViewItem', description: 'View items', category: 'inventoryManagement' },
  { name: 'canCreateItem', description: 'Create items', category: 'inventoryManagement' },
  { name: 'canEditItem', description: 'Edit items', category: 'inventoryManagement' },
  { name: 'canDeleteItem', description: 'Delete items', category: 'inventoryManagement' },
  { name: 'canUpdateItemStatus', description: 'Update item status', category: 'inventoryManagement' },
  { name: 'canManageCopies', description: 'Manage copies', category: 'inventoryManagement' },
  { name: 'canPrintBarcode', description: 'Print barcodes', category: 'inventoryManagement' },
  
  // Category Management
  { name: 'canViewCategory', description: 'View categories', category: 'categoryManagement' },
  { name: 'canCreateCategory', description: 'Create categories', category: 'categoryManagement' },
  { name: 'canEditCategory', description: 'Edit categories', category: 'categoryManagement' },
  { name: 'canDeleteCategory', description: 'Delete categories', category: 'categoryManagement' },
  
  // Transaction Management
  { name: 'canViewTransaction', description: 'View transactions', category: 'transactionManagement' },
  { name: 'canCreateTransaction', description: 'Create transactions', category: 'transactionManagement' },
  { name: 'canEditTransaction', description: 'Edit transactions', category: 'transactionManagement' },
  { name: 'canDeleteTransaction', description: 'Delete transactions', category: 'transactionManagement' },
  { name: 'canManageReturns', description: 'Manage returns', category: 'transactionManagement' },
  
  // Library Operations
  { name: 'canIssueItem', description: 'Issue items', category: 'libraryOperations' },
  { name: 'canReturnItem', description: 'Return items', category: 'libraryOperations' },
  { name: 'canExtendPeriod', description: 'Extend due dates', category: 'libraryOperations' },
  { name: 'canViewQueue', description: 'View queues', category: 'libraryOperations' },
  { name: 'canAllocateItem', description: 'Allocate items', category: 'libraryOperations' },
  { name: 'canRemoveFromQueue', description: 'Remove from queue', category: 'libraryOperations' },
  
  // Fine Management
  { name: 'canViewFine', description: 'View fine', category: 'fineManagement' },
  { name: 'canViewFines', description: 'View fines', category: 'fineManagement' },
  { name: 'canCreateFine', description: 'Create fines', category: 'fineManagement' },
  { name: 'canEditFine', description: 'Edit fines', category: 'fineManagement' },
  { name: 'canDeleteFine', description: 'Delete fines', category: 'fineManagement' },
  { name: 'canWaiveFine', description: 'Waive fines', category: 'fineManagement' },
  { name: 'canAddManualFine', description: 'Add manual fines', category: 'fineManagement' },
  { name: 'canRecordFinePayment', description: 'Record fine payments', category: 'fineManagement' },
  
  // Reports
  { name: 'canViewReports', description: 'View reports', category: 'reports' },
  { name: 'canGenerateReports', description: 'Generate reports', category: 'reports' },
  { name: 'canExportReports', description: 'Export reports', category: 'reports' },
  
  // Settings
  { name: 'canConfigureGeneralSettings', description: 'Configure general settings', category: 'settings' },
  { name: 'canViewSettings', description: 'View settings', category: 'settings' },
  { name: 'canEditSettings', description: 'Edit settings', category: 'settings' },
  
  // Donation Management
  { name: 'canViewDonation', description: 'View donations', category: 'donationManagement' },
  { name: 'canCreateDonation', description: 'Create donations', category: 'donationManagement' },
  { name: 'canEditDonation', description: 'Edit donations', category: 'donationManagement' },
  { name: 'canDeleteDonation', description: 'Delete donations', category: 'donationManagement' },
  
  // Notification Management
  { name: 'canViewNotifications', description: 'View notifications', category: 'notificationManagement' },
  { name: 'canManageNotifications', description: 'Manage notifications', category: 'notificationManagement' },
  
  // Service Management
  { name: 'canViewServices', description: 'View services', category: 'serviceManagement' },
  { name: 'canManageServices', description: 'Manage services', category: 'serviceManagement' },
  { name: 'canAssignServices', description: 'Assign services to users', category: 'serviceManagement' },
  { name: 'canViewUserServices', description: 'View user services', category: 'serviceManagement' },
  { name: 'canManageUserServices', description: 'Manage user services', category: 'serviceManagement' },
  
  // Reminder Management
  { name: 'canConfigureReminders', description: 'Configure reminders', category: 'reminderManagement' }
];

const seedPermissions = async () => {
  try {
    await Permission.deleteMany({});
    await Permission.insertMany(permissions);
    console.log('Permissions seeded successfully');
  } catch (error) {
    console.error('Error seeding permissions:', error);
  }
};

module.exports = { seedPermissions, permissions };