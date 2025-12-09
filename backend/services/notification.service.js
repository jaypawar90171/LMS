const Notification = require('../models/notification.model');
const Setting = require('../models/setting.model');
const sendEmail = require('../utils/email');

/**
 * Service for sending notifications to users
 */
class NotificationService {
  /**
   * Send a notification to a user
   * @param {Object} options - Notification options
   * @param {String} options.userId - User ID
   * @param {String} options.title - Notification title
   * @param {String} options.message - Notification message
   * @param {String} options.type - Notification type
   * @param {String} options.entityType - Entity type
   * @param {String} options.entityId - Entity ID
   * @param {Object} options.data - Additional data
   * @param {Boolean} options.sendEmail - Whether to send email
   * @param {String} options.email - User's email
   * @returns {Promise<Object>} Created notification
   */
  static async sendNotification(options) {
    try {
      const {
        userId,
        title,
        message,
        type = 'System',
        entityType,
        entityId,
        data,
        sendEmail = false,
        email
      } = options;
      
            
      // Validate userId
      if (!userId) {
        throw new Error('userId is required for notification');
      }
      
      // Create in-app notification
      const notification = await Notification.create({
        userId,
        title,
        message,
        type,
        entityType,
        entityId,
        data
      });
      
            
      // Send email notification if enabled
      if (sendEmail && email) {
        // Get notification settings
        const emailEnabledSetting = await Setting.findOne({ 
          key: 'emailEnabled', 
          group: 'notifications' 
        });
        
        const emailEnabled = emailEnabledSetting ? emailEnabledSetting.value : true;
        
        if (emailEnabled) {
          // Get email settings
          const emailSettingsSetting = await Setting.findOne({ 
            key: 'emailSettings', 
            group: 'notifications' 
          });
          
          const emailSettings = emailSettingsSetting ? emailSettingsSetting.value : {
            fromName: process.env.EMAIL_FROM_NAME || process.env.SYSTEM_NAME || 'System',
            fromEmail: process.env.EMAIL_FROM_ADDRESS || 'noreply@localhost'
          };
          
          // Send email
          await sendEmail({
            email,
            subject: title,
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>${title}</h2>
              <p>${message}</p>
              <hr>
              <p style="font-size: 12px; color: #777;">This is an automated notification from the Library Management System. Please do not reply to this email.</p>
            </div>`
          });
        }
      }
      
      return notification;
    } catch (error) {
      console.error('Send notification error:', error);
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
      return null;
    }
  }
  
  /**
   * Send a due date reminder notification
   * @param {Object} user - User object
   * @param {Object} transaction - Transaction object
   * @param {Object} item - Item object
   * @param {Number} daysRemaining - Days remaining until due date
   * @returns {Promise<Object>} Created notification
   */
  static async sendDueDateReminder(user, transaction, item, daysRemaining) {
    return this.sendNotification({
      userId: user._id,
      title: `Due Date Reminder: ${item.title}`,
      message: `Your borrowed item "${item.title}" is due in ${daysRemaining} days. Please return it on time to avoid late fees.`,
      type: 'DueDate',
      entityType: 'transaction',
      entityId: transaction._id,
      data: {
        itemId: item._id,
        dueDate: transaction.dueDate,
        daysRemaining
      },
      sendEmail: true,
      email: user.email
    });
  }
  
  /**
   * Send an overdue notification
   * @param {Object} user - User object
   * @param {Object} transaction - Transaction object
   * @param {Object} item - Item object
   * @param {Number} daysOverdue - Days overdue
   * @returns {Promise<Object>} Created notification
   */
  static async sendOverdueNotification(user, transaction, item, daysOverdue) {
    return this.sendNotification({
      userId: user._id,
      title: `Overdue Item: ${item.title}`,
      message: `Your borrowed item "${item.title}" is ${daysOverdue} days overdue. Please return it as soon as possible to avoid additional late fees.`,
      type: 'Overdue',
      entityType: 'transaction',
      entityId: transaction._id,
      data: {
        itemId: item._id,
        dueDate: transaction.dueDate,
        daysOverdue
      },
      sendEmail: true,
      email: user.email
    });
  }
  
  /**
   * Send a fine notification
   * @param {Object} user - User object
   * @param {Object} fine - Fine object
   * @param {Object} item - Item object (optional)
   * @returns {Promise<Object>} Created notification
   */
  static async sendFineNotification(user, fine, item) {
    const itemTitle = item ? item.title : 'an item';
    
    return this.sendNotification({
      userId: user._id,
      title: `Fine Created: $${fine.amount}`,
      message: `A fine of $${fine.amount} has been created for ${itemTitle}. Reason: ${fine.reason}.`,
      type: 'Fine',
      entityType: 'fine',
      entityId: fine._id,
      data: {
        amount: fine.amount,
        reason: fine.reason,
        itemId: item ? item._id : null
      },
      sendEmail: true,
      email: user.email
    });
  }
  
  /**
   * Send a request status notification
   * @param {Object} user - User object
   * @param {Object} request - Request object
   * @param {Object} item - Item object
   * @param {String} status - New status
   * @returns {Promise<Object>} Created notification
   */
  static async sendRequestStatusNotification(user, request, item, status) {
    let title, message;
    
    switch (status) {
      case 'Approved':
        title = `Request Approved: ${item.title}`;
        message = `Your request for "${item.title}" has been approved. The item will be available for pickup soon.`;
        break;
      case 'Rejected':
        title = `Request Rejected: ${item.title}`;
        message = `Your request for "${item.title}" has been rejected. Please contact the library for more information.`;
        break;
      case 'Fulfilled':
        title = `Request Fulfilled: ${item.title}`;
        message = `Your request for "${item.title}" has been fulfilled. The item is now available for pickup.`;
        break;
      default:
        title = `Request Update: ${item.title}`;
        message = `Your request for "${item.title}" has been updated to ${status}.`;
    }
    
    return this.sendNotification({
      userId: user._id,
      title,
      message,
      type: 'Request',
      entityType: 'request',
      entityId: request._id,
      data: {
        itemId: item._id,
        status,
        requestType: request.requestType
      },
      sendEmail: true,
      email: user.email
    });
  }
}

module.exports = NotificationService;