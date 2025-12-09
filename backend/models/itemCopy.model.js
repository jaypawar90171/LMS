const mongoose = require('mongoose');

const itemCopySchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  copyNumber: {
    type: Number,
    required: true
  },
  barcode: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Available', 'Issued', 'Misplaced', 'Under Repair', 'Lost'],
    default: 'Available'
  },
  condition: {
    type: String,
    required: true,
    enum: ['New', 'Good', 'Fair', 'Poor', 'Damaged'],
    default: 'New'
  },
  notes: {
    type: String,
    trim: true
  },
  acquisitionDate: {
    type: Date,
    default: Date.now
  },
  lastIssuedDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index for itemId and copyNumber to ensure uniqueness
itemCopySchema.index({ itemId: 1, copyNumber: 1 }, { unique: true });

const ItemCopy = mongoose.model('ItemCopy', itemCopySchema);

module.exports = ItemCopy;