# Fine Management

This document describes the Fine Management module of the Library Management System.

## Overview

The Fine Management module allows administrators to:

1. View and manage fines for overdue, damaged, or lost items
2. Create manual fines for users
3. Record payments for fines
4. Waive fines when appropriate
5. Generate automatic fines for overdue items
6. View fine statistics and reports

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

## Payment Methods

The system supports the following payment methods:

1. **Cash** - Payment made in cash
2. **Card** - Payment made by credit/debit card
3. **Online Transfer** - Payment made by online bank transfer

## API Endpoints

### Fine Management

- **GET /api/admin/fines** - Lists all fines with filtering
- **GET /api/admin/fines/:fineId** - Gets detailed information about a specific fine
- **POST /api/admin/fines** - Creates a new fine for a user
- **PATCH /api/admin/fines/:fineId/payment** - Records payment for a fine
- **PATCH /api/admin/fines/:fineId/waive** - Waives a fine

### Fine Statistics and Reports

- **GET /api/admin/fines/statistics** - Gets fine statistics
- **GET /api/admin/fines/users/:userId/summary** - Gets fine summary for a specific user
- **POST /api/admin/fines/generate-overdue** - Generates fines for overdue items

## Fine Calculation

### Overdue Fines

Overdue fines are calculated based on the number of days an item is overdue:

```
Fine Amount = Days Overdue × Daily Fine Rate
```

The default daily fine rate is $1 per day.

### Damaged Item Fines

Damaged item fines are calculated based on the item's price and the level of damage:

```
Fine Amount = Item Price × Damage Multiplier
```

Damage multipliers:
- Minor damage: 25% of item price
- Moderate damage: 50% of item price
- Severe damage: 75% of item price

### Lost Item Fines

Lost item fines are calculated as:

```
Fine Amount = Item Price + Processing Fee
```

The default processing fee is $5.

## Usage Examples

### Creating a Manual Fine

```json
POST /api/admin/fines
{
  "userId": "60d21b4667d0d8992e610c85",
  "itemId": "60d21b4667d0d8992e610c90",
  "amount": 15.50,
  "reason": "Manual",
  "dueDate": "2023-07-30T00:00:00.000Z",
  "notes": "Fine for late return of item without proper notification"
}
```

### Recording a Payment

```json
PATCH /api/admin/fines/60d21b4667d0d8992e610c95/payment
{
  "amount": 10.00,
  "paymentMethod": "Cash",
  "referenceId": "RECEIPT-12345",
  "notes": "Partial payment received"
}
```

### Waiving a Fine

```json
PATCH /api/admin/fines/60d21b4667d0d8992e610c95/waive
{
  "reason": "System error in due date calculation"
}
```

### Generating Overdue Fines

```json
POST /api/admin/fines/generate-overdue
```

## Best Practices

1. **Clear Fine Policies** - Establish and communicate clear fine policies to users
2. **Regular Fine Generation** - Run the overdue fine generation process regularly (e.g., daily)
3. **Payment Records** - Keep detailed records of all payments, including reference numbers
4. **Waiver Documentation** - Document reasons for waiving fines for audit purposes
5. **Fine Notifications** - Notify users promptly when fines are created or due