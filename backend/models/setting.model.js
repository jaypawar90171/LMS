const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  group: {
    type: String,
    required: true,
    enum: ['general', 'borrowingLimits', 'fineRates', 'notifications'],
    default: 'general'
  },
  description: {
    type: String,
    trim: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Add compound index for key and group
settingSchema.index({ key: 1, group: 1 }, { unique: true });

const Setting = mongoose.model('Setting', settingSchema);

module.exports = Setting;