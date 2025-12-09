# Library Operations

This document describes the Library Operations module of the Library Management System.

## Overview

The Library Operations module allows administrators to:

1. Issue items to users
2. Process item returns
3. Extend due dates for borrowed items
4. Manage item queues
5. Track transactions
6. Handle fines for overdue, damaged, or lost items

## Transaction Statuses

Transactions can have the following statuses:

1. **Pending** - Request is pending approval
2. **Issued** - Item is currently issued to a user
3. **Returned** - Item has been returned
4. **Overdue** - Item is past its due date

## Request Types

Requests can be of the following types:

1. **Borrow** - Request to borrow an item
2. **Reserve** - Request to reserve an item for future borrowing
3. **Extend** - Request to extend the due date of a borrowed item

## Request Statuses

Requests can have the following statuses:

1. **Pending** - Request is waiting for approval
2. **Approved** - Request has been approved but not yet fulfilled
3. **Rejected** - Request has been rejected
4. **Cancelled** - Request has been cancelled by the user or administrator
5. **Fulfilled** - Request has been fulfilled (item issued or due date extended)

## Fine Reasons

Fines can be created for the following reasons:

1. **Overdue** - Item returned after due date
2. **Damaged** - Item returned in damaged condition
3. **Lost** - Item not returned and marked as lost
4. **Manual** - Fine manually created by administrator

## Fine Statuses

Fines can have the following statuses:

1. **Outstanding** - Fine has not been paid
2. **Partial Paid** - Fine has been partially paid
3. **Paid** - Fine has been fully paid
4. **Waived** - Fine has been waived by administrator

## API Endpoints

### Item Operations

- **POST /api/admin/operations/issue** - Issues an item to a user
- **POST /api/admin/operations/return** - Processes the return of an issued item
- **PATCH /api/admin/operations/extend** - Extends the due date for an issued item

### Transaction Management

- **GET /api/admin/operations/transactions** - Lists all transactions with filtering

### Request Management

- **GET /api/admin/operations/requests** - Lists all pending item requests
- **PATCH /api/admin/operations/requests/:requestId** - Approves or rejects a pending request

### Queue Management

- **GET /api/admin/operations/queues** - Lists all items with active queues
- **GET /api/admin/operations/queues/:itemId** - Retrieves queue details for a specific item
- **POST /api/admin/operations/queues** - Adds a user to an item's queue
- **DELETE /api/admin/operations/queues/:itemId/users/:userId** - Removes a user from an item's queue
- **POST /api/admin/operations/queues/:itemId/allocate** - Manually allocates an item to a specific user in the queue

## Usage Examples

### Issuing an Item

```json
POST /api/admin/operations/issue
{
  "itemId": "60d21b4667d0d8992e610c90",
  "userId": "60d21b4667d0d8992e610c85",
  "dueDate": "2023-07-15T00:00:00.000Z",
  "notes": "Special permission to borrow for extended period"
}
```

### Returning an Item

```json
POST /api/admin/operations/return
{
  "itemId": "60d21b4667d0d8992e610c90",
  "userId": "60d21b4667d0d8992e610c85",
  "condition": "Good",
  "isDamaged": false,
  "isLost": false,
  "notes": "Returned in good condition"
}
```

### Extending a Due Date

```json
PATCH /api/admin/operations/extend
{
  "itemId": "60d21b4667d0d8992e610c90",
  "userId": "60d21b4667d0d8992e610c85",
  "newDueDate": "2023-07-30T00:00:00.000Z",
  "reason": "User requested extension for research purposes"
}
```

### Adding a User to Queue

```json
POST /api/admin/operations/queues
{
  "itemId": "60d21b4667d0d8992e610c90",
  "userId": "60d21b4667d0d8992e610c85",
  "priority": 2,
  "notes": "Urgent request for research project"
}
```

### Allocating an Item to a User in Queue

```json
POST /api/admin/operations/queues/60d21b4667d0d8992e610c90/allocate
{
  "userId": "60d21b4667d0d8992e610c85",
  "reason": "Priority allocation for faculty member"
}
```

## Best Practices

1. **Regular Due Date Checks** - Regularly check for overdue items and notify users
2. **Queue Management** - Maintain fair queue processing with appropriate priorities
3. **Fine Policies** - Establish clear fine policies and communicate them to users
4. **Return Inspections** - Inspect returned items for damage before accepting returns
5. **Extension Limits** - Set reasonable limits on the number of extensions allowed