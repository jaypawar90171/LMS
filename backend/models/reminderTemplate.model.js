const mongoose = require('mongoose');

const reminderTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['DueDateApproaching', 'ItemOverdue', 'FineCreated', 'FinePaymentDue', 'ReservationAvailable', 'ItemReturned', 'General'],
    default: 'General'
  },
  variables: {
    type: [String],
    default: []
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

const ReminderTemplate = mongoose.model('ReminderTemplate', reminderTemplateSchema);

module.exports = ReminderTemplate;