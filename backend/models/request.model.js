const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
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
  requestType: {
    type: String,
    required: true,
    enum: ['Borrow', 'Reserve', 'Extend'],
    default: 'Borrow'
  },
  requestDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Fulfilled'],
    default: 'Pending'
  },
  notes: {
    type: String,
    trim: true
  },
  urgency: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  neededBy: {
    type: String,
    trim: true
  },
  priority: {
    type: Number,
    default: 0 // Higher number means higher priority
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewDate: {
    type: Date
  },
  reviewNotes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Add indexes for common queries
requestSchema.index({ userId: 1 });
requestSchema.index({ itemId: 1 });
requestSchema.index({ status: 1 });
requestSchema.index({ requestDate: 1 });
requestSchema.index({ priority: -1 }); // For queue processing

const Request = mongoose.model('Request', requestSchema);

module.exports = Request;