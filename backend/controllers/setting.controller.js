const Setting = require('../models/setting.model');
const AuditLog = require('../models/auditLog.model');

// Default settings
const defaultSettings = {
  general: {
    libraryName: 'Library Management System',
    contactEmail: 'library@example.com',
    phoneNumber: '+1234567890',
    address: '123 Library Street, City, Country',
    defaultReturnPeriod: 14,
    operationalHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: { open: 'closed', close: 'closed' }
    }
  },
  borrowingLimits: {
    maxConcurrentItems: 5,
    maxConcurrentQueues: 3,
    maxPeriodExtensions: 2,
    extensionPeriodDays: 7
  },
  fineRates: {
    overdueFineRate: 1.00,
    lostItemBaseFine: 15.00,
    damagedItemBaseFine: 10.00,
    fineGracePeriodDays: 1
  },
  notifications: {
    emailEnabled: true,
    emailSettings: {
      fromName: 'Library Management System',
      fromEmail: 'noreply@library.example.com',
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpSecure: true
    },
    whatsappEnabled: false,
    whatsappSettings: {
      apiKey: '',
      fromNumber: ''
    },
    inAppEnabled: true
  }
};

// Initialize settings if they don't exist
const initializeSettings = async () => {
  try {
    for (const group in defaultSettings) {
      for (const key in defaultSettings[group]) {
        const existingSetting = await Setting.findOne({ key, group });
        if (!existingSetting) {
          await Setting.create({
            key,
            value: defaultSettings[group][key],
            group,
            description: `Default ${key} setting`
          });
        }
      }
    }
  } catch (error) {
    console.error('Error initializing settings:', error);
  }
};

// Get general settings
exports.getGeneralSettings = async (req, res) => {
  try {
    // Initialize settings if they don't exist
    await initializeSettings();
    
    // Get all settings in the general group
    const settings = await Setting.find({ group: 'general' });
    
    // Convert to object
    const generalSettings = {};
    settings.forEach(setting => {
      generalSettings[setting.key] = setting.value;
    });
    
    res.status(200).json({
      success: true,
      data: generalSettings
    });
  } catch (error) {
    console.error('Get general settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving general settings'
    });
  }
};

// Update general settings
exports.updateGeneralSettings = async (req, res) => {
  try {
    const { 
      libraryName, 
      contactEmail, 
      phoneNumber, 
      address, 
      defaultReturnPeriod, 
      operationalHours 
    } = req.body;
    
    // Initialize settings if they don't exist
    await initializeSettings();
    
    // Update each setting
    const updates = [];
    
    if (libraryName !== undefined) {
      updates.push(updateSetting('libraryName', libraryName, 'general', req.user._id));
    }
    
    if (contactEmail !== undefined) {
      updates.push(updateSetting('contactEmail', contactEmail, 'general', req.user._id));
    }
    
    if (phoneNumber !== undefined) {
      updates.push(updateSetting('phoneNumber', phoneNumber, 'general', req.user._id));
    }
    
    if (address !== undefined) {
      updates.push(updateSetting('address', address, 'general', req.user._id));
    }
    
    if (defaultReturnPeriod !== undefined) {
      updates.push(updateSetting('defaultReturnPeriod', defaultReturnPeriod, 'general', req.user._id));
    }
    
    if (operationalHours !== undefined) {
      updates.push(updateSetting('operationalHours', operationalHours, 'general', req.user._id));
    }
    
    // Wait for all updates to complete
    await Promise.all(updates);
    
    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      actionType: 'settings',
      entityType: 'settings',
      details: { group: 'general', updates: Object.keys(req.body) },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Get updated settings
    const settings = await Setting.find({ group: 'general' });
    
    // Convert to object
    const generalSettings = {};
    settings.forEach(setting => {
      generalSettings[setting.key] = setting.value;
    });
    
    res.status(200).json({
      success: true,
      message: 'General settings updated successfully',
      data: generalSettings
    });
  } catch (error) {
    console.error('Update general settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating general settings'
    });
  }
};

// Get borrowing limits
exports.getBorrowingLimits = async (req, res) => {
  try {
    // Initialize settings if they don't exist
    await initializeSettings();
    
    // Get all settings in the borrowingLimits group
    const settings = await Setting.find({ group: 'borrowingLimits' });
    
    // Convert to object
    const borrowingLimits = {};
    settings.forEach(setting => {
      borrowingLimits[setting.key] = setting.value;
    });
    
    res.status(200).json({
      success: true,
      data: borrowingLimits
    });
  } catch (error) {
    console.error('Get borrowing limits error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving borrowing limits'
    });
  }
};

// Update borrowing limits
exports.updateBorrowingLimits = async (req, res) => {
  try {
    const { 
      maxConcurrentItems, 
      maxConcurrentQueues, 
      maxPeriodExtensions, 
      extensionPeriodDays 
    } = req.body;
    
    // Initialize settings if they don't exist
    await initializeSettings();
    
    // Update each setting
    const updates = [];
    
    if (maxConcurrentItems !== undefined) {
      updates.push(updateSetting('maxConcurrentItems', maxConcurrentItems, 'borrowingLimits', req.user._id));
    }
    
    if (maxConcurrentQueues !== undefined) {
      updates.push(updateSetting('maxConcurrentQueues', maxConcurrentQueues, 'borrowingLimits', req.user._id));
    }
    
    if (maxPeriodExtensions !== undefined) {
      updates.push(updateSetting('maxPeriodExtensions', maxPeriodExtensions, 'borrowingLimits', req.user._id));
    }
    
    if (extensionPeriodDays !== undefined) {
      updates.push(updateSetting('extensionPeriodDays', extensionPeriodDays, 'borrowingLimits', req.user._id));
    }
    
    // Wait for all updates to complete
    await Promise.all(updates);
    
    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      actionType: 'settings',
      entityType: 'settings',
      details: { group: 'borrowingLimits', updates: Object.keys(req.body) },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Get updated settings
    const settings = await Setting.find({ group: 'borrowingLimits' });
    
    // Convert to object
    const borrowingLimits = {};
    settings.forEach(setting => {
      borrowingLimits[setting.key] = setting.value;
    });
    
    res.status(200).json({
      success: true,
      message: 'Borrowing limits updated successfully',
      data: borrowingLimits
    });
  } catch (error) {
    console.error('Update borrowing limits error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating borrowing limits'
    });
  }
};

// Get fine rates
exports.getFineRates = async (req, res) => {
  try {
    // Initialize settings if they don't exist
    await initializeSettings();
    
    // Get all settings in the fineRates group
    const settings = await Setting.find({ group: 'fineRates' });
    
    // Convert to object
    const fineRates = {};
    settings.forEach(setting => {
      fineRates[setting.key] = setting.value;
    });
    
    res.status(200).json({
      success: true,
      data: fineRates
    });
  } catch (error) {
    console.error('Get fine rates error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving fine rates'
    });
  }
};

// Update fine rates
exports.updateFineRates = async (req, res) => {
  try {
    const { 
      overdueFineRate, 
      lostItemBaseFine, 
      damagedItemBaseFine, 
      fineGracePeriodDays 
    } = req.body;
    
    // Initialize settings if they don't exist
    await initializeSettings();
    
    // Update each setting
    const updates = [];
    
    if (overdueFineRate !== undefined) {
      updates.push(updateSetting('overdueFineRate', overdueFineRate, 'fineRates', req.user._id));
    }
    
    if (lostItemBaseFine !== undefined) {
      updates.push(updateSetting('lostItemBaseFine', lostItemBaseFine, 'fineRates', req.user._id));
    }
    
    if (damagedItemBaseFine !== undefined) {
      updates.push(updateSetting('damagedItemBaseFine', damagedItemBaseFine, 'fineRates', req.user._id));
    }
    
    if (fineGracePeriodDays !== undefined) {
      updates.push(updateSetting('fineGracePeriodDays', fineGracePeriodDays, 'fineRates', req.user._id));
    }
    
    // Wait for all updates to complete
    await Promise.all(updates);
    
    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      actionType: 'settings',
      entityType: 'settings',
      details: { group: 'fineRates', updates: Object.keys(req.body) },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Get updated settings
    const settings = await Setting.find({ group: 'fineRates' });
    
    // Convert to object
    const fineRates = {};
    settings.forEach(setting => {
      fineRates[setting.key] = setting.value;
    });
    
    res.status(200).json({
      success: true,
      message: 'Fine rates updated successfully',
      data: fineRates
    });
  } catch (error) {
    console.error('Update fine rates error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating fine rates'
    });
  }
};

// Get notification settings
exports.getNotificationSettings = async (req, res) => {
  try {
    // Initialize settings if they don't exist
    await initializeSettings();
    
    // Get all settings in the notifications group
    const settings = await Setting.find({ group: 'notifications' });
    
    // Convert to object
    const notificationSettings = {};
    settings.forEach(setting => {
      notificationSettings[setting.key] = setting.value;
    });
    
    res.status(200).json({
      success: true,
      data: notificationSettings
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving notification settings'
    });
  }
};

// Update notification settings
exports.updateNotificationSettings = async (req, res) => {
  try {
    const { 
      emailEnabled, 
      emailSettings, 
      whatsappEnabled, 
      whatsappSettings, 
      inAppEnabled 
    } = req.body;
    
    // Initialize settings if they don't exist
    await initializeSettings();
    
    // Update each setting
    const updates = [];
    
    if (emailEnabled !== undefined) {
      updates.push(updateSetting('emailEnabled', emailEnabled, 'notifications', req.user._id));
    }
    
    if (emailSettings !== undefined) {
      updates.push(updateSetting('emailSettings', emailSettings, 'notifications', req.user._id));
    }
    
    if (whatsappEnabled !== undefined) {
      updates.push(updateSetting('whatsappEnabled', whatsappEnabled, 'notifications', req.user._id));
    }
    
    if (whatsappSettings !== undefined) {
      updates.push(updateSetting('whatsappSettings', whatsappSettings, 'notifications', req.user._id));
    }
    
    if (inAppEnabled !== undefined) {
      updates.push(updateSetting('inAppEnabled', inAppEnabled, 'notifications', req.user._id));
    }
    
    // Wait for all updates to complete
    await Promise.all(updates);
    
    // Log the action
    await AuditLog.create({
      userId: req.user._id,
      actionType: 'settings',
      entityType: 'settings',
      details: { group: 'notifications', updates: Object.keys(req.body) },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Get updated settings
    const settings = await Setting.find({ group: 'notifications' });
    
    // Convert to object
    const notificationSettings = {};
    settings.forEach(setting => {
      notificationSettings[setting.key] = setting.value;
    });
    
    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully',
      data: notificationSettings
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification settings'
    });
  }
};

// Get audit logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { 
      actionType, 
      userId, 
      fromDate, 
      toDate, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    // Build query
    const query = {};
    
    // Add actionType filter
    if (actionType) {
      query.actionType = actionType;
    }
    
    // Add userId filter
    if (userId) {
      query.userId = userId;
    }
    
    // Add date range filter
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.createdAt.$lte = new Date(toDate);
      }
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const logs = await AuditLog.find(query)
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalLogs = await AuditLog.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: logs.length,
      total: totalLogs,
      totalPages: Math.ceil(totalLogs / parseInt(limit)),
      currentPage: parseInt(page),
      data: logs
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving audit logs'
    });
  }
};

// Helper function to update a setting
async function updateSetting(key, value, group, userId) {
  try {
    const setting = await Setting.findOne({ key, group });
    
    if (setting) {
      setting.value = value;
      setting.updatedBy = userId;
      await setting.save();
    } else {
      await Setting.create({
        key,
        value,
        group,
        description: `${key} setting`,
        updatedBy: userId
      });
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating setting ${key}:`, error);
    return false;
  }
}