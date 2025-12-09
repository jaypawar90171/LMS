# Role & Permission Management

This document describes the Role & Permission Management module of the Library Management System.

## Overview

The Role & Permission Management module allows administrators to:

1. Create, update, and delete roles
2. Assign permissions to roles
3. Assign roles to users
4. View and compare roles
5. View role statistics

## Roles

A role is a collection of permissions that can be assigned to users. Each user can have multiple roles.

### Default Roles

The system comes with the following default roles:

1. **superAdmin** - Has all permissions
2. **librarian** - Can manage library operations
3. **inventoryManager** - Can manage inventory
4. **employee** - Basic employee role
5. **familyMember** - Basic family member role

Default roles cannot be deleted but can be modified (except for critical permissions of superAdmin).

## Permissions

Permissions are grouped by module and define what actions a user can perform.

### Permission Groups

1. **userManagement** - User-related permissions
2. **roleManagement** - Role-related permissions
3. **inventoryManagement** - Inventory-related permissions
4. **libraryOperations** - Library operations permissions
5. **fineManagement** - Fine-related permissions
6. **reminderManagement** - Reminder-related permissions
7. **reports** - Report-related permissions
8. **settings** - System settings permissions
9. **dashboard** - Dashboard-related permissions

## API Endpoints

### Role Management

- **GET /api/admin/roles** - List all roles
- **GET /api/admin/roles/:roleId** - Get role details
- **POST /api/admin/roles** - Create a new role
- **PUT /api/admin/roles/:roleId** - Update a role
- **DELETE /api/admin/roles/:roleId** - Delete a role
- **GET /api/admin/permissions** - List all available permissions

### Advanced Role Operations

- **POST /api/admin/roles/clone** - Clone an existing role
- **POST /api/admin/roles/compare** - Compare multiple roles
- **GET /api/admin/roles/statistics** - Get role statistics

### Role Assignment

- **POST /api/admin/roles/assign** - Assign a role to multiple users
- **POST /api/admin/roles/remove** - Remove a role from multiple users
- **GET /api/admin/roles/:roleId/users** - Get users with a specific role

## Usage Examples

### Creating a New Role

```json
POST /api/admin/roles
{
  "name": "seniorLibrarian",
  "description": "Senior librarian with additional permissions",
  "permissions": [
    "canViewUser",
    "canCreateUser",
    "canViewItem",
    "canCreateItem",
    "canEditItem",
    "canIssueItem",
    "canReturnItem",
    "canExtendPeriod",
    "canViewReports"
  ]
}
```

### Cloning a Role

```json
POST /api/admin/roles/clone
{
  "sourceRoleId": "60d21b4667d0d8992e610c85",
  "name": "juniorLibrarian",
  "description": "Junior librarian with limited permissions"
}
```

### Comparing Roles

```json
POST /api/admin/roles/compare
{
  "roleIds": [
    "60d21b4667d0d8992e610c85",
    "60d21b4667d0d8992e610c86"
  ]
}
```

### Assigning Roles to Users

```json
POST /api/admin/roles/assign
{
  "roleId": "60d21b4667d0d8992e610c85",
  "userIds": [
    "60d21b4667d0d8992e610c90",
    "60d21b4667d0d8992e610c91"
  ]
}
```

## Best Practices

1. **Principle of Least Privilege** - Assign only the permissions that are necessary for a user to perform their job
2. **Role-Based Access Control** - Use roles to group permissions rather than assigning permissions directly to users
3. **Regular Audits** - Regularly review role assignments and permissions
4. **Documentation** - Document the purpose of each custom role
5. **Testing** - Test role permissions before deploying to production