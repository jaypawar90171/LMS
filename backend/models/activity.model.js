const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actionType: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'item_issue',
      'item_return',
      'item_request',
      'fine_payment',
      'profile_update',
      'password_change',
      'item_create',
      'item_update',
      'item_delete',
      'user_create',
      'user_update',
      'category_create',
      'category_update'
    ]
  },
  description: {
    type: String,
    required: true
  },
  entityType: {
    type: String,
    enum: ['Item', 'User', 'Transaction', 'Fine', 'Category', 'Request']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

// Index for efficient querying
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ actionType: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);