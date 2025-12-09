const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  condition: {
    type: String,
    required: true,
    enum: ['New', 'Good', 'Fair', 'Poor'],
    default: 'Good'
  },
  availableDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Accepted', 'Rejected', 'Received', 'Processed'],
    default: 'Pending'
  },
  notes: {
    type: String,
    trim: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewDate: {
    type: Date
  },
  receivedDate: {
    type: Date
  },
  processedItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  },
  photos: [{
    url: String,
    caption: String
  }]
}, {
  timestamps: true
});

// Add indexes for common queries
donationSchema.index({ userId: 1 });
donationSchema.index({ status: 1 });
donationSchema.index({ availableDate: 1 });

const Donation = mongoose.model('Donation', donationSchema);

module.exports = Donation;