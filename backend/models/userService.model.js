const mongoose = require('mongoose');

const userServiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Suspended', 'Expired'],
    default: 'Active'
  },
  grantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  grantedDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date // null means no expiry
  },
  usageCount: {
    type: Number,
    default: 0
  },
  maxUsage: {
    type: Number // null means unlimited
  },
  notes: {
    type: String
  },
  suspendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  suspendedDate: {
    type: Date
  },
  suspensionReason: {
    type: String
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate service assignments
userServiceSchema.index({ userId: 1, serviceId: 1 }, { unique: true });

const UserService = mongoose.model('UserService', userServiceSchema);
module.exports = UserService;