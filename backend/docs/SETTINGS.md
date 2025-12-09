# Settings

This document describes the Settings module of the Library Management System.

## Overview

The Settings module allows administrators to:

1. Configure general system settings
2. Set borrowing limits for users
3. Configure fine rates for overdue, damaged, and lost items
4. Set up notification channels
5. View system audit logs

## Setting Groups

The system has the following setting groups:

1. **General Settings** - Basic system configuration
2. **Borrowing Limits** - Limits for borrowing and queuing
3. **Fine Rates** - Rates for different types of fines
4. **Notification Settings** - Configuration for notification channels

## API Endpoints

### General Settings

- **GET /api/admin/settings/general** - Retrieves general system settings
- **PUT /api/admin/settings/general** - Updates general system settings
- **Request:**
  ```json
  {
    "libraryName": "Library Management System",
    "contactEmail": "library@example.com",
    "phoneNumber": "+1234567890",
    "address": "123 Library Street, City, Country",
    "defaultReturnPeriod": 14,
    "operationalHours": {
      "monday": { "open": "09:00", "close": "18:00" },
      "tuesday": { "open": "09:00", "close": "18:00" },
      "wednesday": { "open": "09:00", "close": "18:00" },
      "thursday": { "open": "09:00", "close": "18:00" },
      "friday": { "open": "09:00", "close": "18:00" },
      "saturday": { "open": "10:00", "close": "16:00" },
      "sunday": { "open": "closed", "close": "closed" }
    }
  }
  ```

### Borrowing Limits

- **GET /api/admin/settings/borrowing-limits** - Retrieves borrowing limitation settings
- **PUT /api/admin/settings/borrowing-limits** - Updates borrowing limitation settings
- **Request:**
  ```json
  {
    "maxConcurrentItems": 5,
    "maxConcurrentQueues": 3,
    "maxPeriodExtensions": 2,
    "extensionPeriodDays": 7
  }
  ```

### Fine Rates

- **GET /api/admin/settings/fine-rates** - Retrieves fine rate configuration
- **PUT /api/admin/settings/fine-rates** - Updates fine rate configuration
- **Request:**
  ```json
  {
    "overdueFineRate": 1.00,
    "lostItemBaseFine": 15.00,
    "damagedItemBaseFine": 10.00,
    "fineGracePeriodDays": 1
  }
  ```

### Notification Settings

- **GET /api/admin/settings/notifications** - Retrieves notification channel settings
- **PUT /api/admin/settings/notifications** - Updates notification channel settings
- **Request:**
  ```json
  {
    "emailEnabled": true,
    "emailSettings": {
      "fromName": "Library Management System",
      "fromEmail": "noreply@library.example.com",
      "smtpHost": "smtp.example.com",
      "smtpPort": 587,
      "smtpSecure": true
    },
    "whatsappEnabled": false,
    "whatsappSettings": {
      "apiKey": "",
      "fromNumber": ""
    },
    "inAppEnabled": true
  }
  ```

### Audit Logs

- **GET /api/admin/settings/audit-log** - Retrieves system audit logs
- **Query params:**
  - `actionType` - Filter by action type
  - `userId` - Filter by user ID
  - `fromDate` - Start date for filtering (ISO format)
  - `toDate` - End date for filtering (ISO format)
  - `page` - Page number for pagination
  - `limit` - Number of records per page

## Permissions

The following permissions are available for settings management:

1. **canConfigureGeneralSettings** - Can view and update general settings
2. **canConfigureBorrowingLimits** - Can view and update borrowing limits
3. **canConfigureFineRates** - Can view and update fine rates
4. **canConfigureNotificationChannels** - Can view and update notification settings
5. **canViewAuditLogs** - Can view system audit logs

## Audit Logging

The system logs the following actions:

1. **login** - User login
2. **logout** - User logout
3. **create** - Entity creation
4. **update** - Entity update
5. **delete** - Entity deletion
6. **issue** - Item issue
7. **return** - Item return
8. **extend** - Due date extension
9. **fine** - Fine creation
10. **payment** - Fine payment
11. **waive** - Fine waiver
12. **settings** - Settings update
13. **queue** - Queue management
14. **donation** - Donation management

## Initialization

The system includes a script to initialize default settings:

```
npm run init-settings
```

This script creates the following default settings:

1. **General Settings**
   - Library name: "Library Management System"
   - Contact email: "library@example.com"
   - Phone number: "+1234567890"
   - Address: "123 Library Street, City, Country"
   - Default return period: 14 days
   - Operational hours: Monday-Friday 9am-6pm, Saturday 10am-4pm, Sunday closed

2. **Borrowing Limits**
   - Maximum concurrent items: 5
   - Maximum concurrent queues: 3
   - Maximum period extensions: 2
   - Extension period days: 7

3. **Fine Rates**
   - Overdue fine rate: $1.00 per day
   - Lost item base fine: $15.00
   - Damaged item base fine: $10.00
   - Fine grace period days: 1

4. **Notification Settings**
   - Email enabled: true
   - WhatsApp enabled: false
   - In-app enabled: true

## Best Practices

1. **Regular Auditing** - Regularly review audit logs to monitor system activity
2. **Fine Tuning** - Adjust borrowing limits and fine rates based on usage patterns
3. **Notification Testing** - Test notification channels regularly to ensure they are working
4. **Documentation** - Document any changes to default settings
5. **Backup** - Backup settings before making significant changes