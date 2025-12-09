const cron = require('node-cron');
const Transaction = require('../models/transaction.model');
const Fine = require('../models/fine.model');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const FineService = require('./fine.service');

class AutomatedFineService {
  static GRACE_PERIOD_DAYS = 2; // 2-day grace period
  static DAILY_FINE_RATE = 1; // ₹1 per day

  /**
   * Initialize automated fine processing
   */
  static init() {
    // Run daily at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      await this.processOverdueItems();
    });

    // Run due date reminders at 8:00 AM
    cron.schedule('0 8 * * *', async () => {
      await this.sendDueDateReminders();
    });
  }

  /**
   * Process overdue items and generate fines
   */
  static async processOverdueItems() {
    try {
      const now = new Date();
      const gracePeriodDate = new Date(now.getTime() - (this.GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000));

      // Find transactions overdue beyond grace period
      const overdueTransactions = await Transaction.find({
        dueDate: { $lt: gracePeriodDate },
        returnDate: null,
        status: { $in: ['Issued', 'Overdue'] }
      })
      .populate('userId', 'fullName email')
      .populate('itemId', 'title');

      let finesCreated = 0;
      let notificationsCreated = 0;

      for (const transaction of overdueTransactions) {
        // Check if fine already exists
        const existingFine = await Fine.findOne({
          transactionId: transaction._id,
          reason: 'Overdue'
        });

        if (existingFine) {
          continue;
        }

        // Update transaction status
        if (transaction.status !== 'Overdue') {
          transaction.status = 'Overdue';
          await transaction.save();
        }

        // Calculate fine amount (excluding grace period)
        const daysOverdue = Math.ceil((now.getTime() - gracePeriodDate.getTime()) / (1000 * 60 * 60 * 24));
        const fineAmount = Math.max(1, daysOverdue * this.DAILY_FINE_RATE);

        // Create fine
        const fine = await Fine.create({
          userId: transaction.userId._id,
          itemId: transaction.itemId._id,
          transactionId: transaction._id,
          amount: fineAmount,
          reason: 'Overdue',
          status: 'Outstanding',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          notes: `Automatic fine for overdue item. Grace period: ${this.GRACE_PERIOD_DAYS} days`,
          createdBy: await this.getSystemUserId()
        });

        finesCreated++;

        // Create notification for user
        await Notification.create({
          userId: transaction.userId._id,
          title: 'Overdue Fine Applied',
          message: `A fine of ₹${fineAmount} has been applied for the overdue item "${transaction.itemId.title}". Please return the item and pay the fine.`,
          type: 'FineApplied',
          entityType: 'Fine',
          entityId: fine._id,
          data: {
            itemTitle: transaction.itemId.title,
            fineAmount,
            daysOverdue: daysOverdue + this.GRACE_PERIOD_DAYS
          }
        });

        notificationsCreated++;
      }

      return { finesCreated, notificationsCreated };
    } catch (error) {
      console.error('Automated fine processing error:', error);
    }
  }

  /**
   * Send due date reminders
   */
  static async sendDueDateReminders() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);

      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      dayAfterTomorrow.setHours(23, 59, 59, 999);

      // Find items due tomorrow and day after tomorrow
      const upcomingDue = await Transaction.find({
        dueDate: { 
          $gte: new Date(),
          $lte: dayAfterTomorrow
        },
        returnDate: null,
        status: 'Issued'
      })
      .populate('userId', 'fullName email')
      .populate('itemId', 'title');

      let remindersCreated = 0;

      for (const transaction of upcomingDue) {
        const dueDate = new Date(transaction.dueDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

        // Check if reminder already sent today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const existingReminder = await Notification.findOne({
          userId: transaction.userId._id,
          type: 'DueReminder',
          entityId: transaction._id,
          createdAt: { $gte: today }
        });

        if (existingReminder) {
          continue;
        }

        let message;
        if (daysUntilDue <= 1) {
          message = `"${transaction.itemId.title}" is due tomorrow. Please return it to avoid fines.`;
        } else {
          message = `"${transaction.itemId.title}" is due in ${daysUntilDue} days. Please plan to return it on time.`;
        }

        // Create reminder notification
        await Notification.create({
          userId: transaction.userId._id,
          title: 'Due Date Reminder',
          message,
          type: 'DueReminder',
          entityType: 'Transaction',
          entityId: transaction._id,
          data: {
            itemTitle: transaction.itemId.title,
            dueDate: transaction.dueDate,
            daysUntilDue
          }
        });

        remindersCreated++;
      }

      return { remindersCreated };
    } catch (error) {
      console.error('Due date reminder error:', error);
    }
  }

  /**
   * Get system user ID for automated operations
   */
  static async getSystemUserId() {
    let systemUser = await User.findOne({ email: process.env.SYSTEM_USER_EMAIL || 'system@library.com' });
    
    if (!systemUser) {
      systemUser = await User.create({
        fullName: 'System',
        email: process.env.SYSTEM_USER_EMAIL || 'system@library.com',
        password: process.env.SYSTEM_USER_PASSWORD || require('crypto').randomBytes(16).toString('hex'),
        roles: ['Admin'],
        status: 'Active',
        isSystemUser: true
      });
    }
    
    return systemUser._id;
  }

  /**
   * Manual trigger for testing (preserves existing functionality)
   */
  static async manualProcess() {
    const results = await Promise.all([
      this.processOverdueItems(),
      this.sendDueDateReminders()
    ]);
    
    return {
      fineProcessing: results[0],
      reminders: results[1]
    };
  }
}

module.exports = AutomatedFineService;