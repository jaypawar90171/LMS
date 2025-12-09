const ReminderRule = require('../models/reminderRule.model');
const ReminderTemplate = require('../models/reminderTemplate.model');
const Transaction = require('../models/transaction.model');
const Fine = require('../models/fine.model');
const Request = require('../models/request.model');
const User = require('../models/user.model');
const sendEmail = require('../utils/email');

/**
 * Service for processing and sending reminders
 */
class ReminderService {
  /**
   * Process due date approaching reminders
   * @param {String} adminUserId - The ID of the admin user sending reminders
   * @returns {Promise<Object>} Result of the operation
   */
  static async processDueDateReminders(adminUserId) {
    try {
      // Find active reminder rules for due date approaching
      const rules = await ReminderRule.find({
        eventTrigger: 'DueDateApproaching',
        status: 'Active'
      }).populate('templateId');
      
      if (rules.length === 0) {
        return {
          success: true,
          message: 'No active due date reminder rules found',
          count: 0
        };
      }
      
      let remindersSent = 0;
      
      // Process each rule
      for (const rule of rules) {
        // Calculate the date range for this rule
        const now = new Date();
        const targetDate = new Date();
        
        // Add the timing value based on the unit
        switch (rule.timing.unit) {
          case 'minutes':
            targetDate.setMinutes(targetDate.getMinutes() + rule.timing.value);
            break;
          case 'hours':
            targetDate.setHours(targetDate.getHours() + rule.timing.value);
            break;
          case 'days':
            targetDate.setDate(targetDate.getDate() + rule.timing.value);
            break;
        }
        
        // Find transactions with due dates matching the target date
        // For simplicity, we'll use a 1-hour window around the target time
        const startWindow = new Date(targetDate);
        startWindow.setHours(startWindow.getHours() - 1);
        
        const endWindow = new Date(targetDate);
        endWindow.setHours(endWindow.getHours() + 1);
        
        const transactions = await Transaction.find({
          dueDate: { $gte: startWindow, $lte: endWindow },
          returnDate: null,
          status: 'Issued'
        })
        .populate('userId', 'fullName email')
        .populate('itemId', 'title barcode')
        .populate('copyId', 'copyNumber');
        
        // Send reminders for each transaction
        for (const transaction of transactions) {
          await this.sendReminder(
            rule,
            transaction.userId,
            {
              transaction,
              dueDate: transaction.dueDate,
              item: transaction.itemId,
              copy: transaction.copyId
            },
            adminUserId
          );
          
          remindersSent++;
        }
      }
      
      return {
        success: true,
        message: `Sent ${remindersSent} due date approaching reminders`,
        count: remindersSent
      };
    } catch (error) {
      console.error('Process due date reminders error:', error);
      return {
        success: false,
        message: 'Error processing due date reminders',
        error: error.message
      };
    }
  }
  
  /**
   * Process overdue item reminders
   * @param {String} adminUserId - The ID of the admin user sending reminders
   * @returns {Promise<Object>} Result of the operation
   */
  static async processOverdueReminders(adminUserId) {
    try {
      // Find active reminder rules for overdue items
      const rules = await ReminderRule.find({
        eventTrigger: 'ItemOverdue',
        status: 'Active'
      }).populate('templateId');
      
      if (rules.length === 0) {
        return {
          success: true,
          message: 'No active overdue reminder rules found',
          count: 0
        };
      }
      
      let remindersSent = 0;
      
      // Process each rule
      for (const rule of rules) {
        // Calculate the date for this rule
        const now = new Date();
        const targetDate = new Date();
        
        // Subtract the timing value based on the unit
        switch (rule.timing.unit) {
          case 'minutes':
            targetDate.setMinutes(targetDate.getMinutes() - rule.timing.value);
            break;
          case 'hours':
            targetDate.setHours(targetDate.getHours() - rule.timing.value);
            break;
          case 'days':
            targetDate.setDate(targetDate.getDate() - rule.timing.value);
            break;
        }
        
        // Find overdue transactions
        // For simplicity, we'll use a 1-hour window around the target time
        const startWindow = new Date(targetDate);
        startWindow.setHours(startWindow.getHours() - 1);
        
        const endWindow = new Date(targetDate);
        endWindow.setHours(endWindow.getHours() + 1);
        
        const transactions = await Transaction.find({
          dueDate: { $gte: startWindow, $lte: endWindow },
          returnDate: null,
          status: { $in: ['Issued', 'Overdue'] }
        })
        .populate('userId', 'fullName email')
        .populate('itemId', 'title barcode')
        .populate('copyId', 'copyNumber');
        
        // Send reminders for each transaction
        for (const transaction of transactions) {
          // Update transaction status to overdue if not already
          if (transaction.status !== 'Overdue') {
            transaction.status = 'Overdue';
            await transaction.save();
          }
          
          await this.sendReminder(
            rule,
            transaction.userId,
            {
              transaction,
              dueDate: transaction.dueDate,
              item: transaction.itemId,
              copy: transaction.copyId,
              daysOverdue: Math.ceil((now - transaction.dueDate) / (1000 * 60 * 60 * 24))
            },
            adminUserId
          );
          
          remindersSent++;
        }
      }
      
      return {
        success: true,
        message: `Sent ${remindersSent} overdue item reminders`,
        count: remindersSent
      };
    } catch (error) {
      console.error('Process overdue reminders error:', error);
      return {
        success: false,
        message: 'Error processing overdue reminders',
        error: error.message
      };
    }
  }
  
  /**
   * Send a reminder to a user
   * @param {Object} rule - The reminder rule
   * @param {Object} user - The user to send the reminder to
   * @param {Object} data - Data for the reminder template
   * @param {String} adminUserId - The ID of the admin user sending the reminder
   * @returns {Promise<Boolean>} Success status
   */
  static async sendReminder(rule, user, data, adminUserId) {
    try {
      // Get template
      const template = rule.templateId;
      
      if (!template) {
        console.error('Template not found for rule:', rule._id);
        return false;
      }
      
      // Process template variables
      let subject = template.subject;
      let content = template.content;
      
      // Replace variables in subject and content
      if (data.transaction) {
        subject = subject.replace(/\{itemTitle\}/g, data.item.title || 'Unknown Item');
        content = content.replace(/\{itemTitle\}/g, data.item.title || 'Unknown Item');
        content = content.replace(/\{itemBarcode\}/g, data.item.barcode || 'N/A');
        content = content.replace(/\{copyNumber\}/g, data.copy?.copyNumber || 'N/A');
      }
      
      if (data.dueDate) {
        const formattedDueDate = data.dueDate.toISOString().split('T')[0];
        subject = subject.replace(/\{dueDate\}/g, formattedDueDate);
        content = content.replace(/\{dueDate\}/g, formattedDueDate);
      }
      
      if (data.daysOverdue) {
        subject = subject.replace(/\{daysOverdue\}/g, data.daysOverdue);
        content = content.replace(/\{daysOverdue\}/g, data.daysOverdue);
      }
      
      if (data.fine) {
        subject = subject.replace(/\{fineAmount\}/g, data.fine.amount);
        content = content.replace(/\{fineAmount\}/g, data.fine.amount);
        content = content.replace(/\{fineReason\}/g, data.fine.reason);
        content = content.replace(/\{fineDueDate\}/g, data.fine.dueDate.toISOString().split('T')[0]);
      }
      
      // Replace user variables
      subject = subject.replace(/\{userName\}/g, user.fullName || 'User');
      content = content.replace(/\{userName\}/g, user.fullName || 'User');
      
      // Send reminder through selected mediums
      if (rule.medium.includes('email') && user.email) {
        await sendEmail({
          email: user.email,
          subject,
          html: content
        });
      }
      
      // For inApp and whatsapp, we would implement those here
      // This is a simplified version focusing on email
      
      return true;
    } catch (error) {
      console.error('Send reminder error:', error);
      return false;
    }
  }
}

module.exports = ReminderService;