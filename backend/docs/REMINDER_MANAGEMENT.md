# Reminder Management

This document describes the Reminder Management module of the Library Management System.

## Overview

The Reminder Management module allows administrators to:

1. Configure reminder rules for various events
2. Create and manage reminder message templates
3. Send automated reminders to users through different channels
4. Customize timing and content of reminders

## Event Triggers

Reminders can be configured for the following events:

1. **DueDateApproaching** - Sent before an item's due date
2. **ItemOverdue** - Sent when an item becomes overdue
3. **FineCreated** - Sent when a fine is created
4. **FinePaymentDue** - Sent when a fine payment is due
5. **ReservationAvailable** - Sent when a reserved item becomes available
6. **ItemReturned** - Sent when an item is returned

## Reminder Mediums

Reminders can be sent through the following channels:

1. **email** - Email notifications
2. **inApp** - In-app notifications
3. **whatsapp** - WhatsApp messages

## API Endpoints

### Reminder Rules

- **GET /api/admin/reminders/rules** - Lists all configured reminder rules
- **GET /api/admin/reminders/rules/:ruleId** - Gets detailed information about a specific rule
- **POST /api/admin/reminders/rules** - Creates a new reminder rule
- **PUT /api/admin/reminders/rules/:ruleId** - Updates an existing reminder rule
- **DELETE /api/admin/reminders/rules/:ruleId** - Deletes a reminder rule

### Reminder Templates

- **GET /api/admin/reminders/templates** - Lists all reminder message templates
- **GET /api/admin/reminders/templates/:templateId** - Gets detailed information about a specific template
- **POST /api/admin/reminders/templates** - Creates a new reminder template
- **PUT /api/admin/reminders/templates/:templateId** - Updates an existing reminder template
- **DELETE /api/admin/reminders/templates/:templateId** - Deletes a reminder template

## Template Variables

Templates can include the following variables that will be replaced with actual values:

- `{userName}` - User's full name
- `{itemTitle}` - Title of the item
- `{itemBarcode}` - Barcode of the item
- `{copyNumber}` - Copy number of the item
- `{dueDate}` - Due date of the item
- `{daysOverdue}` - Number of days the item is overdue
- `{fineAmount}` - Amount of the fine
- `{fineReason}` - Reason for the fine
- `{fineDueDate}` - Due date for the fine payment

## Usage Examples

### Creating a Reminder Rule

```json
POST /api/admin/reminders/rules
{
  "name": "Due Date Reminder - 2 Days Before",
  "eventTrigger": "DueDateApproaching",
  "timing": {
    "value": 2,
    "unit": "days"
  },
  "medium": ["email", "inApp"],
  "templateId": "60d21b4667d0d8992e610c85",
  "status": "Active"
}
```

### Creating a Reminder Template

```json
POST /api/admin/reminders/templates
{
  "name": "Due Date Approaching Template",
  "subject": "Reminder: Your item is due soon",
  "content": "<p>Hello {userName},</p><p>This is a reminder that the item <strong>{itemTitle}</strong> (Barcode: {itemBarcode}) is due on <strong>{dueDate}</strong>.</p><p>Please return the item on time to avoid late fees.</p><p>Thank you,<br>Library Management Team</p>",
  "type": "DueDateApproaching",
  "variables": ["userName", "itemTitle", "itemBarcode", "dueDate"]
}
```

## Scheduled Tasks

The system includes scheduled tasks for automatically processing reminders:

1. **Process Due Date Reminders** - Runs multiple times per day to send reminders for approaching due dates
   ```
   npm run process-due-reminders
   ```

2. **Process Overdue Reminders** - Runs daily to send reminders for overdue items
   ```
   npm run process-overdue-reminders
   ```

## Best Practices

1. **Timing Configuration** - Set appropriate timing for reminders (e.g., 2 days before due date)
2. **Multiple Channels** - Use multiple communication channels for important reminders
3. **Clear Templates** - Create clear and concise reminder templates
4. **Variable Usage** - Use template variables to personalize messages
5. **Regular Testing** - Test reminder rules and templates regularly