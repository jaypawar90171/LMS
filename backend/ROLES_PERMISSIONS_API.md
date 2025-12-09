# Roles & Permissions API Documentation

## Overview
Complete backend API implementation for Roles & Permissions management in the Library Management System.

## API Endpoints

### 1. Get All Roles
**GET** `/api/admin/roles`
- **Permission Required:** `canViewRole`
- **Description:** Retrieves list of all roles with user counts
- **Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "roleId",
      "name": "Super Admin",
      "description": "Full system access",
      "userCount": 1
    }
  ]
}
```

### 2. Get Role Details
**GET** `/api/admin/roles/:roleId`
- **Permission Required:** `canViewRole`
- **Description:** Retrieves detailed role information with permissions
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": "roleId",
    "name": "Super Admin",
    "description": "Full system access",
    "permissions": ["canViewUser", "canCreateUser"],
    "userCount": 1
  }
}
```

### 3. Create New Role
**POST** `/api/admin/roles`
- **Permission Required:** `canCreateRole`
- **Description:** Creates a new role with specified permissions
- **Request Body:**
```json
{
  "name": "Custom Role",
  "description": "Custom role description",
  "permissions": ["canViewUser", "canCreateUser"]
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Role 'Custom Role' created successfully!",
  "data": {
    "id": "newRoleId",
    "name": "Custom Role",
    "description": "Custom role description",
    "permissions": ["canViewUser", "canCreateUser"]
  }
}
```

### 4. Update Role Permissions
**PUT** `/api/admin/roles/:roleId`
- **Permission Required:** `canEditRolePermissions`
- **Description:** Updates role name, description, and permissions
- **Request Body:**
```json
{
  "name": "Updated Role Name",
  "description": "Updated description",
  "permissions": ["canViewUser", "canEditUser"]
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Permissions for role 'Updated Role Name' updated successfully!",
  "data": {
    "id": "roleId",
    "name": "Updated Role Name",
    "description": "Updated description",
    "permissions": ["canViewUser", "canEditUser"]
  }
}
```

### 5. Delete Role
**DELETE** `/api/admin/roles/:roleId`
- **Permission Required:** `canDeleteRole`
- **Description:** Deletes a role (only if no users are assigned)
- **Response (Success):**
```json
{
  "success": true,
  "message": "Role 'Role Name' deleted successfully."
}
```
- **Response (Conflict - Users Assigned):**
```json
{
  "success": false,
  "message": "Cannot delete role 'Role Name'. There are 5 users currently assigned to this role. Please reassign these users before attempting to delete the role."
}
```

### 6. Get All Permissions
**GET** `/api/admin/permissions`
- **Permission Required:** `canManagePermissions`
- **Description:** Retrieves all system permissions grouped by module
- **Response:**
```json
{
  "success": true,
  "data": {
    "userManagement": [
      "canViewUser",
      "canCreateUser",
      "canEditUser"
    ],
    "roleManagement": [
      "canViewRole",
      "canCreateRole",
      "canEditRolePermissions",
      "canDeleteRole"
    ]
  }
}
```

### 7. Get Users by Role
**GET** `/api/admin/roles/:roleId/users`
- **Permission Required:** `canViewRole`
- **Description:** Retrieves users assigned to a specific role
- **Query Parameters:** `page`, `limit`
- **Response:**
```json
{
  "success": true,
  "count": 2,
  "total": 2,
  "totalPages": 1,
  "currentPage": 1,
  "data": {
    "role": {
      "id": "roleId",
      "name": "Super Admin",
      "description": "Full system access"
    },
    "users": [
      {
        "id": "userId",
        "fullName": "John Doe",
        "email": "john@example.com",
        "employeeId": "EMP001",
        "phoneNumber": "+1234567890",
        "status": "Active"
      }
    ]
  }
}
```

## Validation Rules

### Client-Side Validation
- **Role Name:** Required, 3-50 characters, alphanumeric/spaces/hyphens only
- **Permissions:** At least one permission must be selected
- **Description:** Optional string

### Server-Side Validation
- **Role Name Uniqueness:** New role names must be unique
- **Permission Validity:** All selected permissions must be valid system permissions
- **Delete Validation:** Role cannot be deleted if users are assigned to it
- **Super Admin Protection:** Critical permissions cannot be removed from Super Admin role

## Error Responses

### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "errors": [
    {
      "msg": "Role name is required",
      "param": "name"
    }
  ]
}
```

### 403 Forbidden - Permission Denied
```json
{
  "success": false,
  "message": "Not authorized to perform this action"
}
```

### 404 Not Found - Role Not Found
```json
{
  "success": false,
  "message": "Role not found"
}
```

### 409 Conflict - Role Name Exists
```json
{
  "success": false,
  "message": "Role name already exists"
}
```

### 409 Conflict - Cannot Delete Role
```json
{
  "success": false,
  "message": "Cannot delete role 'Role Name'. There are 5 users currently assigned to this role. Please reassign these users before attempting to delete the role."
}
```

## Security Features

1. **RBAC Authorization:** All endpoints require specific permissions
2. **Super Admin Protection:** Prevents removal of critical permissions
3. **Default Role Protection:** System roles cannot be deleted
4. **User Assignment Check:** Roles with assigned users cannot be deleted
5. **Input Validation:** Comprehensive validation on all inputs
6. **JWT Authentication:** All endpoints require valid authentication token

## Permission Groups

The system organizes permissions into logical groups:

- **User Management:** User CRUD operations
- **Role Management:** Role and permission management
- **Inventory Management:** Item and category management
- **Library Operations:** Issue, return, queue operations
- **Fine Management:** Fine creation and payment processing
- **Reminder Management:** Notification configuration
- **Donation Management:** Donation processing
- **Reports:** Report generation and export
- **Settings:** System configuration
- **Dashboard:** Dashboard access

## Usage Examples

### Creating a Librarian Role
```bash
POST /api/admin/roles
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Senior Librarian",
  "description": "Senior librarian with extended permissions",
  "permissions": [
    "canViewDashboard",
    "canViewUser",
    "canCreateUser",
    "canEditUser",
    "canViewItem",
    "canCreateItem",
    "canEditItem",
    "canIssueItem",
    "canReturnItem",
    "canViewFines",
    "canRecordFinePayment"
  ]
}
```

### Updating Role Permissions
```bash
PUT /api/admin/roles/60d21b4667d0d8992e610c85
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Senior Librarian",
  "description": "Updated description",
  "permissions": [
    "canViewDashboard",
    "canViewUser",
    "canCreateUser",
    "canEditUser",
    "canViewItem",
    "canCreateItem",
    "canEditItem",
    "canIssueItem",
    "canReturnItem",
    "canExtendPeriod",
    "canViewFines",
    "canRecordFinePayment",
    "canWaiveFine"
  ]
}
```

This API implementation provides complete role and permission management functionality with proper validation, security, and error handling as specified in your requirements.