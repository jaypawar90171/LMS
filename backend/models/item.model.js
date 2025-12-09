const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  itemType: {
    type: String,
    required: false,
    default: 'General'
  },
  // Dynamic fields based on item type
  typeSpecificFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  price: {
    type: Number,
    min: 0,
    default: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  availableCopies: {
    type: Number,
    default: function() {
      return this.quantity;
    }
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subcategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  condition: {
    type: String,
    enum: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
    default: 'Good'
  },
  availableFrom: {
    type: Date
  },
  availableUntil: {
    type: Date
  },
  status: {
    type: String,
    required: true,
    enum: ['Available', 'Issued', 'Misplaced', 'Under Repair', 'Lost', 'Donation Pending'],
    default: 'Available'
  },
  barcode: {
    type: String,
    required: true,
    unique: true
  },
  defaultReturnPeriod: {
    type: Number,
    required: true,
    min: 1,
    default: 14 // 14 days default
  },
  // Physical details
  physicalDetails: {
    dimensions: {
      type: String,
      trim: true
    },
    weight: {
      type: String,
      trim: true
    },
    condition: {
      type: String,
      enum: ['New', 'Good', 'Fair', 'Poor'],
      default: 'New'
    }
  },
  // Acquisition details
  acquisitionDetails: {
    source: {
      type: String,
      enum: ['Sharing', 'Donation'],
      default: 'Sharing'
    },
    dateAcquired: {
      type: Date
    },
    supplier: {
      type: String,
      trim: true
    }
  },
  // Additional notes
  notes: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  photos: [{
    url: String,
    caption: String
  }],
  videos: [{
    url: String,
    caption: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Add text index for search
itemSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
  'typeSpecificFields.author': 'text',
  'typeSpecificFields.isbn': 'text',
  'typeSpecificFields.publisher': 'text',
  'typeSpecificFields.brand': 'text',
  'typeSpecificFields.model': 'text'
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;