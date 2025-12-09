const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'DueDate', 'Overdue', 'Fine', 'Request', 'Transaction', 'System', 
      'UserApproval', 'ItemRequest', 'OverdueAlert', 'SystemAlert',
      'RequestReview', 'DonationReview', 'ItemRequestReview', 'ItemIssued',
      'RequestCancellation', 'DonationRequest', 'ServiceRequest', 'FineApplied', 'DueReminder',
      'ItemAdded', 'ItemRemoved', 'ItemUpdated', 'CategoryAdded', 'SubcategoryAdded',
      'RequestCancelled', 'RequestApproved', 'RequestRejected', 'ItemReturned',
      'RenewalRequested', 'RenewalApproved', 'RenewalRejected', 'ItemOverdue',
      'ItemDueSoon', 'FineAssessed', 'FinePaid', 'QueueNotification'
    ],
    default: 'System'
  },
  read: {
    type: Boolean,
    default: false
  },
  entityType: {
    type: String
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Add indexes for common queries
notificationSchema.index({ userId: 1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;