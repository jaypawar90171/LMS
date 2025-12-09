const express = require('express');
const router = express.Router();
const barcodeController = require('../controllers/barcode.controller');
const { protect } = require('../middleware/auth.middleware');
const csrf = require('csurf');

// CSRF protection for state-changing operations
const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } });

// Generate barcode for specific item
router.post('/generate/:itemId', protect, csrfProtection, barcodeController.generateItemBarcode);

// Scan barcode and get details
router.get('/scan/:barcode', protect, barcodeController.scanBarcode);

// Bulk generate barcodes
router.post('/bulk-generate', protect, csrfProtection, barcodeController.bulkGenerateBarcodes);

module.exports = router;