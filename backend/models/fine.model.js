const mongoose = require('mongoose');

const fineSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    required: true,
    enum: ['Overdue', 'Damaged', 'Lost', 'Manual']
  },
  status: {
    type: String,
    required: true,
    enum: ['Outstanding', 'Paid', 'Partial Paid', 'Waived'],
    default: 'Outstanding'
  },
  dueDate: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  payments: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['Cash', 'Card', 'Online Transfer']
    },
    referenceId: {
      type: String,
      trim: true
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  waiver: {
    reason: {
      type: String,
      trim: true
    },
    waivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    waivedDate: {
      type: Date
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Add indexes for common queries
fineSchema.index({ userId: 1 });
fineSchema.index({ itemId: 1 });
fineSchema.index({ transactionId: 1 });
fineSchema.index({ status: 1 });
fineSchema.index({ dueDate: 1 });

// Virtual for total paid amount
fineSchema.virtual('paidAmount').get(function() {
  if (!this.payments || this.payments.length === 0) {
    return 0;
  }
  return this.payments.reduce((total, payment) => total + payment.amount, 0);
});

// Virtual for remaining amount
fineSchema.virtual('remainingAmount').get(function() {
  if (this.status === 'Waived') {
    return 0;
  }
  const paidAmount = this.paidAmount;
  return Math.max(0, this.amount - paidAmount);
});

// Include virtuals when converting to JSON
fineSchema.set('toJSON', { virtuals: true });
fineSchema.set('toObject', { virtuals: true });

const Fine = mongoose.model('Fine', fineSchema);

module.exports = Fine;