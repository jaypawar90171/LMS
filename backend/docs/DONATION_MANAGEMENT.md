# Donation Management

This document describes the Donation Management module of the Library Management System.

## Overview

The Donation Management module allows administrators to:

1. Track and manage donation offers from users
2. Review and accept/reject donation offers
3. Process received donations into inventory items
4. Maintain a history of donations and their status

## Donation Statuses

Donations can have the following statuses:

1. **Pending** - Initial status when a donation offer is created
2. **Accepted** - Donation offer has been accepted by the library
3. **Rejected** - Donation offer has been rejected by the library
4. **Received** - Donation item has been physically received by the library
5. **Processed** - Donation has been processed and added to the inventory

## Donation Conditions

Donations can be in the following conditions:

1. **New** - Brand new, unused item
2. **Good** - Slightly used but in good condition
3. **Fair** - Shows signs of wear but still usable
4. **Poor** - Heavily worn but still functional

## API Endpoints

### Admin Endpoints

- **GET /api/admin/donations** - Lists all donation offers with filtering
- **GET /api/admin/donations/:donationId** - Gets detailed information about a specific donation
- **PATCH /api/admin/donations/:donationId** - Updates donation status (accepted, rejected, received)
- **POST /api/admin/donations/:donationId/process** - Processes a received donation into inventory

### Mobile App Endpoints

- **POST /api/mobile/donations** - Creates a new donation offer from mobile app
- **GET /api/mobile/donations** - Lists user's donation offers

## Permissions

The following permissions are available for donation management:

1. **canViewDonations** - Can view donation offers
2. **canManageDonations** - Can update donation status
3. **canProcessDonations** - Can process donations into inventory

## Donation Workflow

1. **Offer Creation**
   - User creates a donation offer through the mobile app
   - System assigns "Pending" status to the donation

2. **Review Process**
   - Admin reviews the donation offer
   - Admin accepts or rejects the donation
   - If accepted, the status changes to "Accepted"
   - If rejected, the status changes to "Rejected"

3. **Physical Receipt**
   - When the physical item is received, admin updates status to "Received"
   - Admin can add notes about the condition of the received item

4. **Processing**
   - Admin processes the donation into an inventory item
   - Admin provides additional details like category, subcategory, etc.
   - System creates a new inventory item with "Donation Pending" status
   - Donation status is updated to "Processed"

## Usage Examples

### Updating Donation Status

```json
PATCH /api/admin/donations/60d21b4667d0d8992e610c85
{
  "status": "Accepted",
  "notes": "Good condition book, will be a valuable addition to our collection"
}
```

### Processing a Donation into Inventory

```json
POST /api/admin/donations/60d21b4667d0d8992e610c85/process
{
  "title": "Introduction to Computer Science",
  "author": "John Smith",
  "isbn": "978-3-16-148410-0",
  "description": "A comprehensive introduction to computer science principles",
  "publisher": "Tech Publishing",
  "publicationYear": 2022,
  "price": 29.99,
  "categoryId": "60d21b4667d0d8992e610c90",
  "subcategoryId": "60d21b4667d0d8992e610c91"
}
```

### Creating a Donation Offer (Mobile App)

```json
POST /api/mobile/donations
{
  "itemName": "Introduction to Computer Science",
  "description": "A comprehensive introduction to computer science principles",
  "condition": "Good",
  "availableDate": "2023-07-15T00:00:00.000Z",
  "photos": [
    {
      "url": "https://example.com/photos/book1.jpg",
      "caption": "Front cover"
    },
    {
      "url": "https://example.com/photos/book2.jpg",
      "caption": "Back cover"
    }
  ]
}
```

## Best Practices

1. **Clear Communication** - Maintain clear communication with donors about the status of their donations
2. **Thorough Review** - Review donation offers carefully before accepting or rejecting
3. **Quality Control** - Inspect received donations thoroughly before processing
4. **Proper Categorization** - Ensure donations are properly categorized when processed into inventory
5. **Acknowledgment** - Acknowledge donors for their contributions