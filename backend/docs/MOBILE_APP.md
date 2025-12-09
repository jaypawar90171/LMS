# Mobile App Backend

This document describes the Mobile App backend of the Library Management System.

## Overview

The Mobile App backend provides API endpoints for the mobile application, allowing users to:

1. Authenticate and manage their profile
2. Browse and search for available items
3. Request items for borrowing
4. View their current and past transactions
5. View their fines
6. Receive and manage notifications
7. Submit donation offers

## API Endpoints

### Authentication

- **POST /api/mobile/auth/login** - Authenticates mobile app users
- **Request:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "deviceId": "device-uuid-123"
  }
  ```

### User Profile

- **GET /api/mobile/profile** - Retrieves user profile information
- **PUT /api/mobile/profile** - Updates user profile information
- **Request:**
  ```json
  {
    "phoneNumber": "+1234567890",
    "address": "123 Main St, City, Country"
  }
  ```

### Items

- **GET /api/mobile/items** - Lists available items for mobile app users
- **Query params:** category, search, page, limit
- **GET /api/mobile/items/:itemId** - Retrieves detailed information for a specific item

### Requests

- **POST /api/mobile/requests** - Creates a new item request
- **Request:**
  ```json
  {
    "itemId": "60d21b4667d0d8992e610c90",
    "requestType": "Borrow",
    "notes": "Need this for my research project"
  }
  ```
- **GET /api/mobile/requests** - Lists user's current and past requests
- **Query params:** status, page, limit

### Transactions

- **GET /api/mobile/transactions** - Lists user's current and past transactions
- **Query params:** status, page, limit

### Fines

- **GET /api/mobile/fines** - Lists user's current and past fines
- **Query params:** status, page, limit

### Notifications

- **GET /api/mobile/notifications** - Retrieves user's notifications
- **Query params:** read, page, limit
- **PATCH /api/mobile/notifications/:notificationId** - Marks a notification as read
- **Request:**
  ```json
  {
    "read": true
  }
  ```

### Donations

- **POST /api/mobile/donations** - Creates a new donation offer
- **Request:**
  ```json
  {
    "itemName": "Introduction to Computer Science",
    "description": "A comprehensive introduction to computer science principles",
    "condition": "Good",
    "availableDate": "2023-07-15T00:00:00.000Z"
  }
  ```
- **GET /api/mobile/donations** - Lists user's donation offers

## Authentication

The mobile app uses JWT (JSON Web Token) for authentication. The token is returned upon successful login and should be included in the Authorization header of subsequent requests:

```
Authorization: Bearer <token>
```

The mobile app tokens have a longer expiry (30 days) compared to the admin tokens.

## Notification Types

The system sends the following types of notifications to mobile users:

1. **DueDate** - Reminders about approaching due dates
2. **Overdue** - Notifications about overdue items
3. **Fine** - Notifications about fines
4. **Request** - Updates about item requests
5. **Transaction** - Information about transactions
6. **System** - General system notifications

## User-Specific Item Information

When retrieving items, the API includes user-specific information:

1. **userHasRequested** - Whether the user has already requested this item
2. **userHasBorrowed** - Whether the user is currently borrowing this item
3. **queueLength** - Number of users in the queue for this item
4. **estimatedWaitTime** - Estimated wait time for the item

## Transaction Status Information

When retrieving transactions, the API includes additional status information:

1. **dueStatus** - Status of the due date (Returned, Overdue, DueSoon, Active)
2. **daysRemaining** - Number of days remaining until due date
3. **daysOverdue** - Number of days the item is overdue

## Fine Summary

When retrieving fines, the API includes a summary of the user's fines:

1. **totalAmount** - Total amount of all fines
2. **paidAmount** - Amount already paid
3. **waivedAmount** - Amount waived
4. **outstandingAmount** - Amount still outstanding

## Borrowing Limits

The system enforces borrowing limits for mobile users:

1. **maxConcurrentItems** - Maximum number of items a user can borrow at once
2. **maxConcurrentQueues** - Maximum number of items a user can have in queue

## Best Practices

1. **Token Management** - Store the token securely on the mobile device
2. **Error Handling** - Handle API errors gracefully in the mobile app
3. **Offline Support** - Implement offline support for critical features
4. **Notification Handling** - Process notifications appropriately based on type
5. **Regular Updates** - Check for new notifications and updates regularly