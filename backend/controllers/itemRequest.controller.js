const ItemRequest = require('../models/itemRequest.model');
const Item = require('../models/item.model');
const Category = require('../models/category.model');
const User = require('../models/user.model');
const NotificationService = require('../services/notification.service');

// User submits request to add their item
exports.submitAddItemRequest = async (req, res) => {
  try {
    const {
      itemName,
      itemDescription,
      itemImage,
      categoryId,
      condition,
      availableFrom,
      availableUntil
    } = req.body;

    // Validate category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    const itemRequest = await ItemRequest.create({
      requestType: 'ADD_ITEM',
      requestedBy: req.user._id,
      itemName,
      itemDescription,
      itemImage,
      categoryId,
      condition,
      availableFrom,
      availableUntil
    });

    res.status(201).json({
      success: true,
      message: 'Item addition request submitted successfully',
      data: itemRequest
    });
  } catch (error) {
    console.error('Submit add item request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting request'
    });
  }
};

// User submits request for needed item
exports.submitItemRequest = async (req, res) => {
  try {
    const {
      requestedItemName,
      requestedItemDescription,
      requestedCategoryId,
      urgency,
      neededBy
    } = req.body;

    // Validate category exists
    const category = await Category.findById(requestedCategoryId);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    const itemRequest = await ItemRequest.create({
      requestType: 'REQUEST_ITEM',
      requestedBy: req.user._id,
      requestedItemName,
      requestedItemDescription,
      requestedCategoryId,
      urgency,
      neededBy
    });

    res.status(201).json({
      success: true,
      message: 'Item request submitted successfully',
      data: itemRequest
    });
  } catch (error) {
    console.error('Submit item request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting request'
    });
  }
};

// User views their own requests
exports.getUserRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { requestedBy: req.user._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const requests = await ItemRequest.find(query)
      .populate('categoryId requestedCategoryId', 'name')
      .populate('reviewedBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ItemRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get user requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving requests'
    });
  }
};

// Admin views all requests
exports.getAllRequests = async (req, res) => {
  try {
    const { status, requestType, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (requestType) query.requestType = requestType;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const requests = await ItemRequest.find(query)
      .populate('requestedBy', 'fullName email')
      .populate('categoryId requestedCategoryId', 'name')
      .populate('reviewedBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ItemRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving requests'
    });
  }
};

// Admin approves/rejects request
exports.reviewRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, adminNotes } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Approved or Rejected'
      });
    }

    const itemRequest = await ItemRequest.findById(requestId)
      .populate('requestedBy', 'fullName email');

    if (!itemRequest) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (itemRequest.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been reviewed'
      });
    }

    itemRequest.status = status;
    itemRequest.adminNotes = adminNotes;
    itemRequest.reviewedBy = req.user._id;
    itemRequest.reviewedAt = new Date();

    // If approved and it's an ADD_ITEM request, create the item
    if (status === 'Approved' && itemRequest.requestType === 'ADD_ITEM') {
      const newItem = await Item.create({
        itemType: 'Shared',
        title: itemRequest.itemName,
        description: itemRequest.itemDescription,
        categoryId: itemRequest.categoryId,
        condition: itemRequest.condition,
        quantity: 1,
        status: 'Available',
        ownerId: itemRequest.requestedBy._id,
        availableFrom: itemRequest.availableFrom,
        availableUntil: itemRequest.availableUntil,
        createdBy: req.user._id
      });

      itemRequest.createdItemId = newItem._id;
    }

    await itemRequest.save();

    // Send notification to user
    try {
      const itemName = itemRequest.itemName || itemRequest.requestedItemName;
      let notificationTitle, notificationMessage;
      
      if (status === 'Approved') {
        if (itemRequest.requestType === 'ADD_ITEM') {
          notificationTitle = 'Donation Approved';
          notificationMessage = `Your donation request for "${itemName}" has been approved. Thank you for your contribution!`;
        } else {
          notificationTitle = 'Item Request Approved';
          notificationMessage = `Your request for "${itemName}" has been approved. We will notify you when the item becomes available.`;
        }
      } else {
        if (itemRequest.requestType === 'ADD_ITEM') {
          notificationTitle = 'Donation Rejected';
          notificationMessage = `Your donation request for "${itemName}" has been rejected. ${adminNotes ? `Reason: ${adminNotes}` : ''}`;
        } else {
          notificationTitle = 'Item Request Rejected';
          notificationMessage = `Your request for "${itemName}" has been rejected. ${adminNotes ? `Reason: ${adminNotes}` : ''}`;
        }
      }

      await NotificationService.sendNotification({
        userId: itemRequest.requestedBy._id,
        title: notificationTitle,
        message: notificationMessage,
        type: itemRequest.requestType === 'ADD_ITEM' ? 'DonationReview' : 'ItemRequestReview',
        entityType: 'ItemRequest',
        entityId: itemRequest._id
      });
    } catch (notificationError) {
      console.error('Failed to send user notification:', notificationError);
    }

    res.status(200).json({
      success: true,
      message: `Request ${status.toLowerCase()} successfully`,
      data: itemRequest
    });
  } catch (error) {
    console.error('Review request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reviewing request'
    });
  }
};