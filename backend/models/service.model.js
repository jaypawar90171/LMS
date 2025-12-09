const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['Extended Borrowing', 'Priority Reservations']
  },
  description: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    // For Extended Borrowing
    extendedDays: {
      type: Number,
      default: 14 // Additional days beyond normal period
    },
    maxExtensions: {
      type: Number,
      default: 2 // Maximum number of extensions allowed
    },
    // For Priority Reservations
    priorityLevel: {
      type: Number,
      default: 1 // Higher number = higher priority
    },
    skipQueuePosition: {
      type: Boolean,
      default: true
    }
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

const Service = mongoose.model('Service', serviceSchema);
module.exports = Service;