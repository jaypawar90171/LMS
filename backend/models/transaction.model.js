const mongoose = require('mongoose');
const crypto = require('crypto');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  copyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ItemCopy',
    required: true
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Issued', 'Returned', 'Overdue'],
    default: 'Issued'
  },
  returnCondition: {
    type: String,
    enum: ['Good', 'Damaged', 'Lost', ''],
    default: ''
  },
  notes: {
    type: String,
    trim: true
  },
  extensionCount: {
    type: Number,
    default: 0
  },
  lastExtensionDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate transaction ID before saving
transactionSchema.pre('save', async function(next) {
  if (!this.transactionId) {
    const year = new Date().getFullYear();
    const randomId = crypto.randomBytes(4).toString('hex').toUpperCase();
    this.transactionId = `TXN${year}${randomId}`;
  }
  next();
});

// Add indexes for common queries
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ userId: 1 });
transactionSchema.index({ itemId: 1 });
transactionSchema.index({ copyId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ dueDate: 1 });
transactionSchema.index({ returnDate: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;