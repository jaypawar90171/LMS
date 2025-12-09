const mongoose = require('mongoose');

const itemRequestSchema = new mongoose.Schema({
  requestType: {
    type: String,
    enum: ['ADD_ITEM', 'REQUEST_ITEM'],
    required: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // For ADD_ITEM requests (giver wants to add their item)
  itemName: {
    type: String,
    required: function() { return this.requestType === 'ADD_ITEM'; }
  },
  itemDescription: {
    type: String
    // required: function() { return this.requestType === 'ADD_ITEM'; }
  },
  itemImage: {
    type: String // URL or file path
    // required: function() { return this.requestType === 'ADD_ITEM'; }
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: function() { return this.requestType === 'ADD_ITEM'; }
  },
  condition: {
    type: String,
    enum: ['New', 'Like New', 'Good', 'Fair', 'Poor']
    // required: function() { return this.requestType === 'ADD_ITEM'; }
  },
  availableFrom: {
    type: Date
    // required: function() { return this.requestType === 'ADD_ITEM'; }
  },
  availableUntil: {
    type: Date
    // required: function() { return this.requestType === 'ADD_ITEM'; }
  },
  
  // For REQUEST_ITEM requests (taker wants specific item)
  requestedItemName: {
    type: String,
    required: function() { return this.requestType === 'REQUEST_ITEM'; }
  },
  requestedItemDescription: {
    type: String,
    required: function() { return this.requestType === 'REQUEST_ITEM'; }
  },
  requestedCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: function() { return this.requestType === 'REQUEST_ITEM'; }
  },
  urgency: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
    required: function() { return this.requestType === 'REQUEST_ITEM'; }
  },
  neededBy: {
    type: Date,
    required: function() { return this.requestType === 'REQUEST_ITEM'; }
  },
  
  // Common fields
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending'
  },
  adminNotes: {
    type: String
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  
  // If approved, reference to created item
  createdItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ItemRequest', itemRequestSchema);