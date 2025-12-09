const mongoose = require('mongoose');

const reminderRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  eventTrigger: {
    type: String,
    required: true,
    enum: ['DueDateApproaching', 'ItemOverdue', 'FineCreated', 'FinePaymentDue', 'ReservationAvailable', 'ItemReturned'],
    default: 'DueDateApproaching'
  },
  timing: {
    value: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      enum: ['minutes', 'hours', 'days'],
      default: 'days'
    }
  },
  medium: {
    type: [String],
    required: true,
    enum: ['email', 'inApp', 'whatsapp'],
    default: ['email']
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReminderTemplate',
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Inactive'],
    default: 'Active'
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

const ReminderRule = mongoose.model('ReminderRule', reminderRuleSchema);

module.exports = ReminderRule;