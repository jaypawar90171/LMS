const UserService = require('../models/userService.model');
const Service = require('../models/service.model');
const Transaction = require('../models/transaction.model');
const Request = require('../models/request.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

// Get available services
exports.getAvailableServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: true })
      .select('name description settings')
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Get available services error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving available services'
    });
  }
};

// Request a service
exports.requestService = async (req, res) => {
  try {
    
    const { serviceId } = req.body;
    
    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Service ID is required'
      });
    }
    
    const service = await Service.findById(serviceId);
    
    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or inactive'
      });
    }
    
    const existingService = await UserService.findOne({
      userId: req.user._id,
      serviceId: serviceId,
      status: 'Active'
    });
    
    if (existingService) {
      return res.status(400).json({
        success: false,
        message: 'You already have this service active'
      });
    }
    
    // Find admin users with simpler query
    const adminUsers = await User.find({ 
      status: 'Active'
    }).limit(5); // Just get first 5 active users as fallback
    
    
    // Create notifications for admins
    for (const admin of adminUsers) {
      try {
        await Notification.create({
          userId: admin._id,
          title: 'Service Request',
          message: `${req.user.fullName || 'User'} has requested ${service.name} service`,
          type: 'ServiceRequest',
          entityType: 'ServiceRequest',
          data: {
            requesterId: req.user._id,
            requesterName: req.user.fullName || 'User',
            serviceName: service.name,
            serviceId: service._id
          }
        });
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Service request submitted successfully. An admin will review your request.'
    });
  } catch (error) {
    console.error('Request service error:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting service',
      error: error.message
    });
  }
};

// Get user's active services
exports.getUserServices = async (req, res) => {
  try {
    const userServices = await UserService.find({ 
      userId: req.user._id,
      status: 'Active'
    })
    .populate('serviceId', 'name description settings')
    .sort({ grantedDate: -1 });

    // Add computed fields and filter active services
    const activeServices = userServices.filter(us => {
      if (us.expiryDate && new Date(us.expiryDate) < new Date()) {
        return false;
      }
      if (us.maxUsage && us.usageCount >= us.maxUsage) {
        return false;
      }
      return us.status === 'Active';
    }).map(us => ({
      ...us.toObject(),
      currentUsage: us.usageCount || 0
    }));

    res.status(200).json({
      success: true,
      count: activeServices.length,
      data: activeServices
    });
  } catch (error) {
    console.error('Get user services error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user services'
    });
  }
};

// Request extended borrowing for a transaction
exports.requestExtendedBorrowing = async (req, res) => {
  try {
    const { transactionId, extensionDays, reason } = req.body;

    // Check if user has Extended Borrowing service
    const extendedBorrowingService = await Service.findOne({ name: 'Extended Borrowing', isActive: true });
    if (!extendedBorrowingService) {
      return res.status(404).json({
        success: false,
        message: 'Extended Borrowing service is not available'
      });
    }

    const userService = await UserService.findOne({
      userId: req.user._id,
      serviceId: extendedBorrowingService._id,
      status: 'Active'
    });

    if (!userService) {
      return res.status(403).json({
        success: false,
        message: 'You do not have Extended Borrowing service'
      });
    }

    // Check if service is expired or usage limit reached
    if (userService.expiryDate && new Date(userService.expiryDate) < new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Your Extended Borrowing service has expired'
      });
    }

    if (userService.maxUsage && userService.usageCount >= userService.maxUsage) {
      return res.status(403).json({
        success: false,
        message: 'You have reached the maximum usage limit for Extended Borrowing'
      });
    }

    // Find the transaction
    const transaction = await Transaction.findById(transactionId)
      .populate('itemId', 'title')
      .populate('userId', 'fullName');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Verify user owns this transaction
    if (transaction.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only extend your own borrowings'
      });
    }

    // Check if transaction is active
    if (transaction.returnDate) {
      return res.status(400).json({
        success: false,
        message: 'Cannot extend returned items'
      });
    }

    // Check extension limits
    const maxExtensions = extendedBorrowingService.settings.maxExtensions || 2;
    if (transaction.extensionCount >= maxExtensions) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxExtensions} extensions allowed`
      });
    }

    // Calculate new due date
    const maxExtensionDays = extendedBorrowingService.settings.extendedDays || 14;
    const requestedDays = Math.min(extensionDays || maxExtensionDays, maxExtensionDays);
    const newDueDate = new Date(transaction.dueDate);
    newDueDate.setDate(newDueDate.getDate() + requestedDays);

    // Update transaction
    transaction.dueDate = newDueDate;
    transaction.extensionCount = (transaction.extensionCount || 0) + 1;
    transaction.notes = (transaction.notes || '') + `\nExtended by ${requestedDays} days. Reason: ${reason || 'Extended borrowing service'}`;
    
    await transaction.save();

    // Update service usage count
    userService.usageCount = (userService.usageCount || 0) + 1;
    await userService.save();

    res.status(200).json({
      success: true,
      message: `Borrowing extended by ${requestedDays} days`,
      data: {
        transactionId: transaction._id,
        newDueDate: transaction.dueDate,
        extensionCount: transaction.extensionCount,
        remainingExtensions: maxExtensions - transaction.extensionCount
      }
    });
  } catch (error) {
    console.error('Request extended borrowing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing extended borrowing request'
    });
  }
};

// Request priority reservation
exports.requestPriorityReservation = async (req, res) => {
  try {
    const { itemId, notes } = req.body;

    // Check if user has Priority Reservations service
    const priorityService = await Service.findOne({ name: 'Priority Reservations', isActive: true });
    if (!priorityService) {
      return res.status(404).json({
        success: false,
        message: 'Priority Reservations service is not available'
      });
    }

    const userService = await UserService.findOne({
      userId: req.user._id,
      serviceId: priorityService._id,
      status: 'Active'
    });

    if (!userService) {
      return res.status(403).json({
        success: false,
        message: 'You do not have Priority Reservations service'
      });
    }

    // Check if service is expired or usage limit reached
    if (userService.expiryDate && new Date(userService.expiryDate) < new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Your Priority Reservations service has expired'
      });
    }

    if (userService.maxUsage && userService.usageCount >= userService.maxUsage) {
      return res.status(403).json({
        success: false,
        message: 'You have reached the maximum usage limit for Priority Reservations'
      });
    }

    // Check if user already has a request for this item
    const existingRequest = await Request.findOne({
      userId: req.user._id,
      itemId,
      status: { $in: ['Pending', 'Approved'] }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active request for this item'
      });
    }

    // Create priority request
    const request = await Request.create({
      userId: req.user._id,
      itemId,
      requestType: 'Borrow',
      status: 'Pending',
      priority: priorityService.settings.priorityLevel || 1,
      isPriority: true,
      requestDate: new Date(),
      notes: notes || 'Priority reservation request',
      createdBy: req.user._id
    });

    // Update service usage count
    userService.usageCount = (userService.usageCount || 0) + 1;
    await userService.save();

    await request.populate([
      { path: 'itemId', select: 'title author' },
      { path: 'userId', select: 'fullName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Priority reservation request created successfully',
      data: request
    });
  } catch (error) {
    console.error('Request priority reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing priority reservation request'
    });
  }
};

// Get service usage history
exports.getServiceUsageHistory = async (req, res) => {
  try {
    const userServices = await UserService.find({ userId: req.user._id })
      .populate('serviceId', 'name description')
      .populate('grantedBy', 'fullName')
      .sort({ grantedDate: -1 });

    res.status(200).json({
      success: true,
      count: userServices.length,
      data: userServices
    });
  } catch (error) {
    console.error('Get service usage history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving service usage history'
    });
  }
};