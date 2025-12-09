const Notification = require('../models/notification.model');
const Request = require('../models/request.model');
const User = require('../models/user.model');
const Transaction = require('../models/transaction.model');
const Fine = require('../models/fine.model');

// Get admin notifications
exports.getAdminNotifications = async (req, res) => {
  try {
    const { type, read, page = 1, limit = 20 } = req.query;
    
    // Build query for admin notifications
    const query = { 
      userId: req.user._id
    };
    
    if (type) {
      query.type = type;
      // For ServiceRequest, show unread by default
      if (type === 'ServiceRequest' && read === undefined) {
        query.read = false;
      }
    }
    
    if (read !== undefined) {
      query.read = read === 'true';
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const notifications = await Notification.find(query)
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalNotifications = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      userId: req.user._id,
      read: false
    });
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      total: totalNotifications,
      unreadCount,
      totalPages: Math.ceil(totalNotifications / parseInt(limit)),
      currentPage: parseInt(page),
      data: notifications
    });
  } catch (error) {
    console.error('Get admin notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving notifications'
    });
  }
};

// Generate notifications for pending requests
exports.generateRequestNotifications = async (req, res) => {
  try {
    // Get all admin users (users with notification management permissions)
    const adminUsers = await User.find({ 
      status: 'Active'
    }).populate({
      path: 'roles',
      populate: {
        path: 'permissions'
      }
    });
    
    // Filter users who have notification management permissions
    const notificationAdmins = adminUsers.filter(user => {
      if (!user.roles || user.roles.length === 0) return false;
      
      return user.roles.some(role => {
        if (!role.permissions) return false;
        return role.permissions.some(permission => 
          permission.name === 'canManageNotifications' || 
          permission.name === 'canViewNotifications'
        );
      });
    });
    
    // Fallback: if no users found with specific permissions, use all active users
    const finalAdminUsers = notificationAdmins.length > 0 ? notificationAdmins : adminUsers.slice(0, 5);
    
    // Get pending user approvals
    const pendingUsers = await User.find({ status: 'Pending' });
    
    // Get pending item requests
    const pendingRequests = await Request.find({ status: 'Pending' })
      .populate('userId', 'fullName')
      .populate('itemId', 'title');
    
    // Get overdue items
    const overdueTransactions = await Transaction.find({
      returnDate: null,
      dueDate: { $lt: new Date() }
    }).populate('userId', 'fullName').populate('itemId', 'title');
    
    const notifications = [];
    
    // Create notifications for pending user approvals
    for (const user of pendingUsers) {
      for (const admin of finalAdminUsers) {
        const existingNotification = await Notification.findOne({
          userId: admin._id,
          type: 'UserApproval',
          entityId: user._id,
          read: false
        });
        
        if (!existingNotification) {
          const notification = await Notification.create({
            userId: admin._id,
            title: 'New User Registration',
            message: `${user.fullName} has registered and needs approval`,
            type: 'UserApproval',
            entityType: 'User',
            entityId: user._id,
            data: {
              userName: user.fullName,
              userEmail: user.email,
              registrationDate: user.createdAt
            }
          });
          notifications.push(notification);
        }
      }
    }
    
    // Create notifications for pending item requests
    for (const request of pendingRequests) {
      for (const admin of finalAdminUsers) {
        const existingNotification = await Notification.findOne({
          userId: admin._id,
          type: 'ItemRequest',
          entityId: request._id,
          read: false
        });
        
        if (!existingNotification) {
          const notification = await Notification.create({
            userId: admin._id,
            title: 'New Item Request',
            message: `${request.userId.fullName} requested "${request.itemId.title}"`,
            type: 'ItemRequest',
            entityType: 'Request',
            entityId: request._id,
            data: {
              userName: request.userId.fullName,
              itemTitle: request.itemId.title,
              requestType: request.requestType,
              requestDate: request.requestDate
            }
          });
          notifications.push(notification);
        }
      }
    }
    
    // Create notifications for overdue items
    for (const transaction of overdueTransactions) {
      const daysOverdue = Math.ceil((new Date() - new Date(transaction.dueDate)) / (1000 * 60 * 60 * 24));
      
      for (const admin of finalAdminUsers) {
        const existingNotification = await Notification.findOne({
          userId: admin._id,
          type: 'OverdueAlert',
          entityId: transaction._id,
          read: false
        });
        
        if (!existingNotification) {
          const notification = await Notification.create({
            userId: admin._id,
            title: 'Overdue Item Alert',
            message: `"${transaction.itemId.title}" is ${daysOverdue} days overdue (${transaction.userId.fullName})`,
            type: 'OverdueAlert',
            entityType: 'Transaction',
            entityId: transaction._id,
            data: {
              userName: transaction.userId.fullName,
              itemTitle: transaction.itemId.title,
              daysOverdue,
              dueDate: transaction.dueDate
            }
          });
          notifications.push(notification);
        }
      }
    }
    
    const types = [];
    if (pendingUsers.length > 0) types.push('UserApproval');
    if (pendingRequests.length > 0) types.push('ItemRequest');
    if (overdueTransactions.length > 0) types.push('OverdueAlert');
    
    res.status(200).json({
      success: true,
      message: `Generated ${notifications.length} new notifications`,
      data: {
        generated: notifications.length,
        types: types,
        pendingUsers: pendingUsers.length,
        pendingRequests: pendingRequests.length,
        overdueItems: overdueTransactions.length,
        adminUsers: finalAdminUsers.length
      }
    });
  } catch (error) {
    console.error('Generate notifications error:', error);
    console.error('Error details:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating notifications',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Mark notification as read
exports.markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { read = true } = req.body;
    
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    notification.read = read;
    await notification.save();
    
    res.status(200).json({
      success: true,
      message: 'Notification updated successfully',
      data: notification
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification'
    });
  }
};

// Mark all notifications as read
exports.markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { 
        userId: req.user._id,
        read: false 
      },
      { read: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notifications'
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findByIdAndDelete(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification'
    });
  }
};

// Get notification statistics
exports.getNotificationStats = async (req, res) => {
  try {
    const stats = await Notification.aggregate([
      {
        $match: {
          userId: req.user._id
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] } }
        }
      }
    ]);
    
    const totalUnread = await Notification.countDocuments({
      userId: req.user._id,
      read: false
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalUnread,
        byType: stats
      }
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving notification statistics'
    });
  }
};

// Send notification to user
exports.sendNotification = async (req, res) => {
  try {
    const { userId, title, message, type = 'System' } = req.body;
    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      entityType: 'AdminMessage',
      data: { sentBy: req.user._id }
    });
    
    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      data: notification
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending notification'
    });
  }
};

// Debug: Create test notification
exports.createTestNotification = async (req, res) => {
  try {
    const { title, message, type = 'System' } = req.body;
    
    const notification = await Notification.create({
      userId: req.user._id,
      title: title || 'Test Notification',
      message: message || 'This is a test notification',
      type,
      entityType: 'Test',
      data: { test: true }
    });
    
    res.status(201).json({
      success: true,
      message: 'Test notification created',
      data: notification
    });
  } catch (error) {
    console.error('Create test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating test notification'
    });
  }
};