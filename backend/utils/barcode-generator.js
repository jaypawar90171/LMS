const crypto = require('crypto');

class BarcodeGenerator {
  // Generate unique barcode for items (LMS format)
  static generateItemBarcode(prefix = 'LMS') {
    const date = new Date();
    const dateStr = date.getFullYear().toString() + 
                   (date.getMonth() + 1).toString().padStart(2, '0') + 
                   date.getDate().toString().padStart(2, '0');
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${dateStr}-${random}`;
  }

  // Generate user barcode
  static generateUserBarcode(prefix = 'USR') {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  // Validate barcode format (support both old and new formats)
  static validateBarcode(barcode) {
    // New LMS format: LMS-YYYYMMDD-XXXXXX
    const lmsFormat = /^[A-Z]{3}-\d{8}-[A-F0-9]{6}$/.test(barcode);
    // Old format: XXXXXXXXXXXXX
    const oldFormat = /^[A-Z]{3}[0-9A-Z]{6,12}$/.test(barcode);
    return lmsFormat || oldFormat;
  }
}

module.exports = BarcodeGenerator;