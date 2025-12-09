const mongoose = require('mongoose');

const renewalRequestSchema = new mongoose.Schema({
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
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
  currentDueDate: {
    type: Date,
    required: true
  },
  requestedDueDate: {
    type: Date,
    required: true
  },
  approvedDueDate: {
    type: Date
  },
  reason: {
    type: String,
    default: 'Standard renewal request'
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  adminNotes: {
    type: String
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
renewalRequestSchema.index({ userId: 1, status: 1 });
renewalRequestSchema.index({ transactionId: 1 });
renewalRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('RenewalRequest', renewalRequestSchema);