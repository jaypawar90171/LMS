const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const itemSchemaController = require('../controllers/item-schema.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  itemIdValidation,
  copyIdValidation,
  createItemValidation,
  updateItemValidation,
  updateItemStatusValidation,
  addCopiesValidation,
  updateCopyStatusValidation,
  generateBarcodeValidation,
  printBarcodeValidation
} = require('../middleware/inventory.validation');
const csrf = require('csurf');

// CSRF protection for state-changing operations
const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } });

// Get all inventory items
router.get(
  '/inventory',
  protect,
  authorize('canViewItem'),
  inventoryController.getInventoryItems
);

// Get inventory item by ID
router.get(
  '/inventory/:itemId',
  protect,
  authorize('canViewItem'),
  itemIdValidation,
  inventoryController.getInventoryItemById
);

// Create new inventory item
router.post(
  '/inventory',
  protect,
  authorize('canCreateItem'),
  // csrfProtection,
  createItemValidation,
  inventoryController.createInventoryItem
);

// Update inventory item
router.put(
  '/inventory/:itemId',
  protect,
  authorize('canEditItem'),
  csrfProtection,
  updateItemValidation,
  inventoryController.updateInventoryItem
);

// Delete inventory item
router.delete(
  '/inventory/:itemId',
  protect,
  authorize('canDeleteItem'),
  csrfProtection,
  itemIdValidation,
  inventoryController.deleteInventoryItem
);

// Update inventory item status
router.patch(
  '/inventory/:itemId/status',
  protect,
  authorize('canUpdateItemStatus'),
  csrfProtection,
  updateItemStatusValidation,
  inventoryController.updateItemStatus
);

// Get all copies of an item
router.get(
  '/inventory/:itemId/copies',
  protect,
  authorize('canViewItem'),
  itemIdValidation,
  inventoryController.getItemCopies
);

// Add copies to an item
router.post(
  '/inventory/:itemId/copies',
  protect,
  authorize('canManageCopies'),
  csrfProtection,
  addCopiesValidation,
  inventoryController.addItemCopies
);

// Generate copies for an item
router.post(
  '/inventory/:itemId/copies/generate',
  protect,
  authorize('canManageCopies'),
  csrfProtection,
  addCopiesValidation,
  inventoryController.generateItemCopies
);

// Update copy status
router.patch(
  '/inventory/:itemId/copies/:copyId',
  protect,
  authorize('canManageCopies'),
  csrfProtection,
  updateCopyStatusValidation,
  inventoryController.updateCopyStatus
);

// Get barcode information
router.get(
  '/inventory/:itemId/barcode',
  protect,
  authorize('canViewItem'),
  itemIdValidation,
  inventoryController.getBarcodeInfo
);

// Generate new barcode
router.post(
  '/inventory/:itemId/barcode/generate',
  protect,
  authorize('canPrintBarcode'),
  csrfProtection,
  generateBarcodeValidation,
  inventoryController.generateBarcode
);

// Print barcode
router.get(
  '/inventory/:itemId/barcode/print',
  protect,
  authorize('canPrintBarcode'),
  printBarcodeValidation,
  inventoryController.printBarcode
);

// Get item type schemas
router.get(
  '/item-schemas',
  protect,
  authorize('canViewItem'),
  itemSchemaController.getAllItemTypeSchemas
);

router.get(
  '/item-schemas/:itemType',
  protect,
  authorize('canViewItem'),
  itemSchemaController.getItemTypeSchema
);

module.exports = router;