# Inventory Management

This document describes the Inventory Management module of the Library Management System.

## Overview

The Inventory Management module allows administrators to:

1. Create, update, and delete inventory items
2. Manage item copies
3. Organize items into categories and subcategories
4. Track item status
5. Generate and print barcodes

## Item Types

The system supports the following item types:

1. **Book** - Physical books, textbooks, etc.
2. **Course** - Course materials, guides, etc.
3. **Toy** - Educational toys, games, etc.

## Item Status

Items can have the following statuses:

1. **Available** - Item is available for borrowing
2. **Issued** - Item is currently borrowed by a user
3. **Misplaced** - Item is temporarily misplaced
4. **Under Repair** - Item is being repaired
5. **Lost** - Item is lost
6. **Donation Pending** - Item is pending donation acceptance

## Copy Conditions

Individual copies can have the following conditions:

1. **New** - Brand new, unused
2. **Good** - Slightly used but in good condition
3. **Fair** - Shows signs of wear but still usable
4. **Poor** - Heavily worn but still functional
5. **Damaged** - Damaged and may need repair

## API Endpoints

### Inventory Management

- **GET /api/admin/inventory** - List inventory items with filtering and pagination
- **GET /api/admin/inventory/:itemId** - Get item details
- **POST /api/admin/inventory** - Create a new inventory item
- **PUT /api/admin/inventory/:itemId** - Update an inventory item
- **DELETE /api/admin/inventory/:itemId** - Delete an inventory item
- **PATCH /api/admin/inventory/:itemId/status** - Update item status

### Copy Management

- **GET /api/admin/inventory/:itemId/copies** - List all copies of an item
- **POST /api/admin/inventory/:itemId/copies** - Add new copies to an item
- **PATCH /api/admin/inventory/:itemId/copies/:copyId** - Update copy status

### Barcode Management

- **GET /api/admin/inventory/:itemId/barcode** - Get barcode information
- **POST /api/admin/inventory/:itemId/barcode/generate** - Generate a new barcode
- **GET /api/admin/inventory/:itemId/barcode/print** - Generate printable barcode

### Category Management

- **GET /api/admin/inventory/categories** - List all categories in hierarchical structure
- **GET /api/admin/inventory/categories/:categoryId** - Get category details
- **POST /api/admin/inventory/categories** - Create a new category
- **PUT /api/admin/inventory/categories/:categoryId** - Update a category
- **DELETE /api/admin/inventory/categories/:categoryId** - Delete a category

## Usage Examples

### Creating a New Inventory Item

```json
POST /api/admin/inventory
{
  "title": "Introduction to Computer Science",
  "author": "John Smith",
  "isbn": "978-3-16-148410-0",
  "description": "A comprehensive introduction to computer science principles",
  "publisher": "Tech Publishing",
  "publicationYear": 2022,
  "price": 29.99,
  "quantity": 5,
  "categoryId": "60d21b4667d0d8992e610c85",
  "subcategoryId": "60d21b4667d0d8992e610c86",
  "tags": ["computer science", "programming", "beginner"],
  "defaultReturnPeriod": 14,
  "itemType": "Book"
}
```

### Adding Copies to an Item

```json
POST /api/admin/inventory/60d21b4667d0d8992e610c90/copies
{
  "quantity": 3,
  "condition": "New"
}
```

### Creating a New Category

```json
POST /api/admin/inventory/categories
{
  "name": "Computer Science",
  "description": "Books and materials related to computer science",
  "defaultReturnPeriod": 14
}
```

### Creating a Subcategory

```json
POST /api/admin/inventory/categories
{
  "name": "Programming Languages",
  "description": "Books about programming languages",
  "parentCategoryId": "60d21b4667d0d8992e610c85",
  "defaultReturnPeriod": 14
}
```

## Best Practices

1. **Consistent Categorization** - Establish clear guidelines for categorizing items
2. **Regular Inventory Audits** - Periodically verify physical inventory against system records
3. **Barcode Standards** - Use consistent barcode formats for easy scanning
4. **Copy Tracking** - Track individual copies to identify patterns of damage or loss
5. **Default Return Periods** - Set appropriate default return periods based on item type and demand