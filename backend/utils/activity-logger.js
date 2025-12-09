const Activity = require('../models/activity.model');

/**
 * Log user activity
 * @param {Object} params - Activity parameters
 * @param {string} params.userId - User ID who performed the action
 * @param {string} params.actionType - Type of action performed
 * @param {string} params.description - Human readable description
 * @param {string} [params.entityType] - Type of entity affected
 * @param {string} [params.entityId] - ID of entity affected
 * @param {Object} [params.metadata] - Additional metadata
 * @param {string} [params.ipAddress] - User's IP address
 * @param {string} [params.userAgent] - User's browser info
 */
const logActivity = async (params) => {
  try {
    const activity = new Activity({
      userId: params.userId,
      actionType: params.actionType,
      description: params.description,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    });

    await activity.save();
    return { success: true, activity };
  } catch (error) {
    console.error('Error logging activity:', error);
    return { success: false, error };
  }
};

/**
 * Common activity logging functions
 */
const ActivityLogger = {
  // User activities
  login: (userId, ipAddress, userAgent) => logActivity({
    userId,
    actionType: 'login',
    description: 'User logged in',
    ipAddress,
    userAgent
  }),

  logout: (userId, ipAddress) => logActivity({
    userId,
    actionType: 'logout',
    description: 'User logged out',
    ipAddress
  }),

  // Item activities
  itemIssue: (userId, itemId, itemTitle, memberName) => logActivity({
    userId,
    actionType: 'item_issue',
    description: `Issued "${itemTitle}" to ${memberName}`,
    entityType: 'Item',
    entityId: itemId
  }),

  itemReturn: (userId, itemId, itemTitle, memberName) => logActivity({
    userId,
    actionType: 'item_return',
    description: `Returned "${itemTitle}" from ${memberName}`,
    entityType: 'Item',
    entityId: itemId
  }),

  itemRequest: (userId, itemId, itemTitle) => logActivity({
    userId,
    actionType: 'item_request',
    description: `Requested "${itemTitle}"`,
    entityType: 'Item',
    entityId: itemId
  }),

  // Fine activities
  finePayment: (userId, fineId, amount, memberName) => logActivity({
    userId,
    actionType: 'fine_payment',
    description: `Processed fine payment of $${amount} for ${memberName}`,
    entityType: 'Fine',
    entityId: fineId
  }),

  // Profile activities
  logProfileUpdate: (userId, ipAddress, userAgent) => logActivity({
    userId,
    actionType: 'profile_update',
    description: 'User profile updated',
    entityType: 'User',
    entityId: userId,
    ipAddress,
    userAgent
  }),

  logPasswordChange: (userId, ipAddress, userAgent) => logActivity({
    userId,
    actionType: 'password_change',
    description: 'User password changed',
    entityType: 'User',
    entityId: userId,
    ipAddress,
    userAgent
  }),

  // Admin activities
  itemCreate: (userId, itemId, itemTitle) => logActivity({
    userId,
    actionType: 'item_create',
    description: `Created new item: "${itemTitle}"`,
    entityType: 'Item',
    entityId: itemId
  }),

  itemUpdate: (userId, itemId, itemTitle) => logActivity({
    userId,
    actionType: 'item_update',
    description: `Updated item: "${itemTitle}"`,
    entityType: 'Item',
    entityId: itemId
  }),

  itemDelete: (userId, itemTitle) => logActivity({
    userId,
    actionType: 'item_delete',
    description: `Deleted item: "${itemTitle}"`,
    entityType: 'Item'
  }),

  userCreate: (userId, newUserId, newUserName) => logActivity({
    userId,
    actionType: 'user_create',
    description: `Created new user: ${newUserName}`,
    entityType: 'User',
    entityId: newUserId
  }),

  userUpdate: (userId, targetUserId, targetUserName) => logActivity({
    userId,
    actionType: 'user_update',
    description: `Updated user: ${targetUserName}`,
    entityType: 'User',
    entityId: targetUserId
  }),

  categoryCreate: (userId, categoryId, categoryName) => logActivity({
    userId,
    actionType: 'category_create',
    description: `Created new category: "${categoryName}"`,
    entityType: 'Category',
    entityId: categoryId
  }),

  categoryUpdate: (userId, categoryId, categoryName) => logActivity({
    userId,
    actionType: 'category_update',
    description: `Updated category: "${categoryName}"`,
    entityType: 'Category',
    entityId: categoryId
  })
};

module.exports = { logActivity, ActivityLogger };