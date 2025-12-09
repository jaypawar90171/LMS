const Notification = require('../models/notification.model');

// Get user's notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const { read, page = 1, limit = 20 } = req.query;
    
    
    // Build query
    const query = { userId: req.user._id };
    
    // Add read filter
    if (read !== undefined) {
      query.read = read === 'true';
    }
    
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    
    // Get total count for pagination
    const totalNotifications = await Notification.countDocuments(query);
    
    // Get unread count
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
    console.error('Get user notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving notifications'
    });
  }
};

// Mark notification as read
exports.markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: req.user._id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
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
      { userId: req.user._id, read: false },
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
      message: 'Error marking all notifications as read'
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: req.user._id
    });
    
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

// Create notification
exports.createNotification = async (req, res) => {
  try {
    const { title, message, type } = req.body;
    
    const notification = new Notification({
      userId: req.user._id,
      title,
      message,
      type,
      read: false
    });
    
    await notification.save();
    
    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification created successfully'
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating notification'
    });
  }
};

// Get notification settings
exports.getNotificationSettings = async (req, res) => {
  try {
    const User = require('../models/user.model');
    const user = await User.findById(req.user._id).select('notificationSettings');
    
    const settings = user?.notificationSettings || {
      pushNotifications: true,
      emailNotifications: false,
      reminderNotifications: true
    };
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notification settings'
    });
  }
};

// Update notification settings
exports.updateNotificationSettings = async (req, res) => {
  try {
    const { pushNotifications, emailNotifications, reminderNotifications } = req.body;
    const User = require('../models/user.model');
    
    const settings = {
      pushNotifications,
      emailNotifications,
      reminderNotifications
    };
    
    await User.findByIdAndUpdate(req.user._id, {
      notificationSettings: settings
    });
    
    res.status(200).json({
      success: true,
      data: settings,
      message: 'Notification settings updated successfully'
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification settings'
    });
  }
};