const NotificationService = require('./notification.service');
const User = require('../models/user.model');
const Role = require('../models/role.model');

class NotificationHelper {
  
  // Send notification to all users with specific roles
  static async notifyUsersByRole(roleNames, notificationData) {
    try {
      const roles = await Role.find({ 
        name: { $in: roleNames.map(name => new RegExp(`^${name}$`, 'i')) }
      });
      
      if (roles.length === 0) return;
      
      const roleIds = roles.map(role => role._id);
      const users = await User.find({ 
        roles: { $in: roleIds }, 
        status: 'Active',
        approvalStatus: 'Approved'
      });
      
      for (const user of users) {
        await NotificationService.sendNotification({
          userId: user._id,
          ...notificationData
        });
      }
    } catch (error) {
      console.error('Error sending notifications by role:', error);
    }
  }

  // Send notification to specific user
  static async notifyUser(userId, notificationData) {
    try {
      await NotificationService.sendNotification({
        userId,
        ...notificationData
      });
    } catch (error) {
      console.error('Error sending notification to user:', error);
    }
  }

  // Send notification to all active users
  static async notifyAllUsers(notificationData) {
    try {
      const users = await User.find({ 
        status: 'Active',
        approvalStatus: 'Approved'
      });
      
      for (const user of users) {
        await NotificationService.sendNotification({
          userId: user._id,
          ...notificationData
        });
      }
    } catch (error) {
      console.error('Error sending notifications to all users:', error);
    }
  }

  // Item-related notifications
  static async notifyItemAdded(item, addedBy) {
    const notificationData = {
      title: 'New Item Available',
      message: `"${item.title}" has been added to the library and is now available for borrowing.`,
      type: 'ItemAdded',
      entityType: 'Item',
      entityId: item._id
    };
    
    await this.notifyAllUsers(notificationData);
  }

  static async notifyItemRemoved(item, removedBy) {
    const notificationData = {
      title: 'Item Removed',
      message: `"${item.title}" has been removed from the library.`,
      type: 'ItemRemoved',
      entityType: 'Item',
      entityId: item._id
    };
    
    await this.notifyUsersByRole(['Admin', 'Librarian'], notificationData);
  }

  static async notifyItemUpdated(item, updatedBy) {
    const notificationData = {
      title: 'Item Updated',
      message: `"${item.title}" information has been updated.`,
      type: 'ItemUpdated',
      entityType: 'Item',
      entityId: item._id
    };
    
    await this.notifyUsersByRole(['Admin', 'Librarian'], notificationData);
  }

  // Category-related notifications
  static async notifyCategoryAdded(category, addedBy) {
    const notificationData = {
      title: 'New Category Added',
      message: `New category "${category.name}" has been added to the library.`,
      type: 'CategoryAdded',
      entityType: 'Category',
      entityId: category._id
    };
    
    await this.notifyAllUsers(notificationData);
  }

  static async notifySubcategoryAdded(subcategory, parentCategory, addedBy) {
    const notificationData = {
      title: 'New Subcategory Added',
      message: `New subcategory "${subcategory.name}" has been added under "${parentCategory.name}".`,
      type: 'SubcategoryAdded',
      entityType: 'Category',
      entityId: subcategory._id
    };
    
    await this.notifyAllUsers(notificationData);
  }

  // Request-related notifications
  static async notifyRequestCancelled(request, cancelledBy) {
    // Notify admins about cancellation
    const adminNotification = {
      title: 'Request Cancelled',
      message: `${cancelledBy.fullName} cancelled their request for "${request.itemId?.title || 'an item'}".`,
      type: 'RequestCancelled',
      entityType: 'Request',
      entityId: request._id
    };
    
    await this.notifyUsersByRole(['Admin', 'Librarian'], adminNotification);

    // Notify user about successful cancellation
    if (request.userId && request.userId.toString() !== cancelledBy._id.toString()) {
      const userNotification = {
        title: 'Request Cancelled',
        message: `Your request for "${request.itemId?.title || 'an item'}" has been cancelled.`,
        type: 'RequestCancelled',
        entityType: 'Request',
        entityId: request._id
      };
      
      await this.notifyUser(request.userId, userNotification);
    }
  }

  static async notifyRequestApproved(request, approvedBy) {
    const notificationData = {
      title: 'Request Approved',
      message: `Your request for "${request.itemId?.title || request.requestedItemName}" has been approved!`,
      type: 'RequestApproved',
      entityType: 'Request',
      entityId: request._id
    };
    
    await this.notifyUser(request.userId, notificationData);
  }

  static async notifyRequestRejected(request, rejectedBy, reason) {
    const notificationData = {
      title: 'Request Rejected',
      message: `Your request for "${request.itemId?.title || request.requestedItemName}" has been rejected. ${reason ? `Reason: ${reason}` : ''}`,
      type: 'RequestRejected',
      entityType: 'Request',
      entityId: request._id
    };
    
    await this.notifyUser(request.userId, notificationData);
  }

  // Transaction-related notifications
  static async notifyItemIssued(transaction, issuedBy) {
    const notificationData = {
      title: 'Item Issued',
      message: `"${transaction.itemId?.title}" has been issued to you. Please return by ${new Date(transaction.dueDate).toLocaleDateString()}.`,
      type: 'ItemIssued',
      entityType: 'Transaction',
      entityId: transaction._id
    };
    
    await this.notifyUser(transaction.userId, notificationData);
  }

  static async notifyItemReturned(transaction, returnedBy) {
    const notificationData = {
      title: 'Item Returned',
      message: `"${transaction.itemId?.title}" has been successfully returned. Thank you!`,
      type: 'ItemReturned',
      entityType: 'Transaction',
      entityId: transaction._id
    };
    
    await this.notifyUser(transaction.userId, notificationData);
  }

  static async notifyRenewalRequested(transaction, requestedBy) {
    // Notify admins about renewal request
    const adminNotification = {
      title: 'Renewal Requested',
      message: `${requestedBy.fullName} has requested to renew "${transaction.itemId?.title}".`,
      type: 'RenewalRequested',
      entityType: 'Transaction',
      entityId: transaction._id
    };
    
    await this.notifyUsersByRole(['Admin', 'Librarian'], adminNotification);

    // Notify user about successful submission
    const userNotification = {
      title: 'Renewal Request Submitted',
      message: `Your renewal request for "${transaction.itemId?.title}" has been submitted and is pending approval.`,
      type: 'RenewalRequested',
      entityType: 'Transaction',
      entityId: transaction._id
    };
    
    await this.notifyUser(transaction.userId, userNotification);
  }

  static async notifyRenewalApproved(transaction, approvedBy, newDueDate) {
    const notificationData = {
      title: 'Renewal Approved',
      message: `Your renewal request for "${transaction.itemId?.title}" has been approved. New due date: ${new Date(newDueDate).toLocaleDateString()}.`,
      type: 'RenewalApproved',
      entityType: 'Transaction',
      entityId: transaction._id
    };
    
    await this.notifyUser(transaction.userId, notificationData);
  }

  static async notifyRenewalRejected(transaction, rejectedBy, reason) {
    const notificationData = {
      title: 'Renewal Rejected',
      message: `Your renewal request for "${transaction.itemId?.title}" has been rejected. ${reason ? `Reason: ${reason}` : ''}`,
      type: 'RenewalRejected',
      entityType: 'Transaction',
      entityId: transaction._id
    };
    
    await this.notifyUser(transaction.userId, notificationData);
  }

  // Overdue notifications
  static async notifyItemOverdue(transaction) {
    const daysOverdue = Math.floor((new Date() - new Date(transaction.dueDate)) / (1000 * 60 * 60 * 24));
    
    const notificationData = {
      title: 'Item Overdue',
      message: `"${transaction.itemId?.title}" is ${daysOverdue} day(s) overdue. Please return it as soon as possible to avoid fines.`,
      type: 'ItemOverdue',
      entityType: 'Transaction',
      entityId: transaction._id
    };
    
    await this.notifyUser(transaction.userId, notificationData);
  }

  static async notifyItemDueSoon(transaction) {
    const daysUntilDue = Math.ceil((new Date(transaction.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    const notificationData = {
      title: 'Item Due Soon',
      message: `"${transaction.itemId?.title}" is due in ${daysUntilDue} day(s). Please return or renew it before ${new Date(transaction.dueDate).toLocaleDateString()}.`,
      type: 'ItemDueSoon',
      entityType: 'Transaction',
      entityId: transaction._id
    };
    
    await this.notifyUser(transaction.userId, notificationData);
  }

  // Fine-related notifications
  static async notifyFineAssessed(fine, assessedBy) {
    const notificationData = {
      title: 'Fine Assessed',
      message: `A fine of $${fine.amount} has been assessed for "${fine.transactionId?.itemId?.title}". ${fine.reason || ''}`,
      type: 'FineAssessed',
      entityType: 'Fine',
      entityId: fine._id
    };
    
    await this.notifyUser(fine.userId, notificationData);
  }

  static async notifyFinePaid(fine, paidBy) {
    const notificationData = {
      title: 'Fine Paid',
      message: `Your fine of $${fine.amount} for "${fine.transactionId?.itemId?.title}" has been paid successfully.`,
      type: 'FinePaid',
      entityType: 'Fine',
      entityId: fine._id
    };
    
    await this.notifyUser(fine.userId, notificationData);
  }
}

module.exports = NotificationHelper;