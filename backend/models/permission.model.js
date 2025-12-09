const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'userManagement',
      'roleManagement', 
      'inventoryManagement',
      'categoryManagement',
      'transactionManagement',
      'libraryOperations',
      'fineManagement',
      'reminderManagement',
      'donationManagement',
      'notificationManagement',
      'serviceManagement',
      'reports',
      'settings',
      'dashboard'
    ]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Permission', permissionSchema);