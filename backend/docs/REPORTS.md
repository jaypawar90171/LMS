# Reports

This document describes the Reports module of the Library Management System.

## Overview

The Reports module allows administrators to:

1. Generate various reports for analysis and decision-making
2. Filter reports based on different criteria
3. Export reports in different formats (JSON, CSV)
4. View statistics and trends

## Report Types

The system provides the following report types:

1. **Defaulters Report** - Users with overdue items
2. **Queue Report** - Items with active queues
3. **Allocation Report** - Item allocation patterns by admin users
4. **Fines Report** - Fine collection and outstanding amounts
5. **Inventory Report** - Inventory status and availability
6. **Activity Report** - System activity logs

## API Endpoints

### Defaulters Report

- **GET /api/admin/reports/defaulters** - Generates report of users with overdue items
- **Query params:**
  - `fromDate` - Start date for filtering (ISO format)
  - `toDate` - End date for filtering (ISO format)
  - `itemType` - Filter by item type (Book, Course, Toy)
  - `userRole` - Filter by user role
  - `format` - Output format (json, csv)

### Queue Report

- **GET /api/admin/reports/queue** - Generates report on item queue statistics
- **Query params:**
  - `itemType` - Filter by item type (Book, Course, Toy)
  - `category` - Filter by category ID
  - `minQueueLength` - Minimum queue length
  - `maxQueueLength` - Maximum queue length
  - `format` - Output format (json, csv)

### Allocation Report

- **GET /api/admin/reports/allocation** - Generates report on item allocation patterns
- **Query params:**
  - `adminUser` - Filter by admin user ID
  - `itemStatus` - Filter by item status (Issued, Overdue, Returned)
  - `returnStatus` - Filter by return status (Returned, NotReturned)
  - `fromDate` - Start date for filtering (ISO format)
  - `toDate` - End date for filtering (ISO format)
  - `format` - Output format (json, csv)

### Fines Report

- **GET /api/admin/reports/fines** - Generates report on fine collection and outstanding amounts
- **Query params:**
  - `status` - Filter by fine status (Outstanding, Partial Paid, Paid, Waived)
  - `reason` - Filter by fine reason (Overdue, Damaged, Lost, Manual)
  - `userRole` - Filter by user role
  - `fromDate` - Start date for filtering (ISO format)
  - `toDate` - End date for filtering (ISO format)
  - `format` - Output format (json, csv)

### Inventory Report

- **GET /api/admin/reports/inventory** - Generates inventory status report
- **Query params:**
  - `category` - Filter by category ID
  - `status` - Filter by item status
  - `format` - Output format (json, csv)

### Activity Report

- **GET /api/admin/reports/activity** - Generates system activity log report
- **Query params:**
  - `actionType` - Filter by action type
  - `userId` - Filter by user ID
  - `fromDate` - Start date for filtering (ISO format)
  - `toDate` - End date for filtering (ISO format)
  - `page` - Page number for pagination
  - `limit` - Number of records per page
  - `format` - Output format (json, csv)

## Permissions

The following permissions are available for report management:

1. **canViewReports** - Can view reports
2. **canExportReports** - Can export reports in different formats
3. **canScheduleReports** - Can schedule automatic report generation
4. **canShareReports** - Can share reports with other users

## Report Formats

Reports can be generated in the following formats:

1. **JSON** - Default format for API responses
2. **CSV** - Comma-separated values for spreadsheet applications

## Usage Examples

### Generating a Defaulters Report

```
GET /api/admin/reports/defaulters?fromDate=2023-01-01&toDate=2023-06-30&itemType=Book&format=json
```

### Generating a Queue Report

```
GET /api/admin/reports/queue?minQueueLength=3&category=60d21b4667d0d8992e610c85&format=csv
```

### Generating a Fines Report

```
GET /api/admin/reports/fines?status=Outstanding&reason=Overdue&fromDate=2023-01-01&format=json
```

## Best Practices

1. **Regular Reporting** - Generate reports regularly to monitor library operations
2. **Data Analysis** - Use reports to identify trends and make data-driven decisions
3. **Filtering** - Use appropriate filters to focus on relevant data
4. **Export for Records** - Export important reports for record-keeping
5. **Performance Consideration** - For large datasets, use pagination and specific filters to improve performance