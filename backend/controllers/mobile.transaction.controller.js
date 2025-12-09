const Transaction = require('../models/transaction.model');

// Create renewal request model
const RenewalRequest = require('../models/renewalRequest.model');

// Get user's transactions
exports.getUserTransactions = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = { userId: req.user._id };
    
    // Add status filter
    if (status) {
      query.status = status;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const transactions = await Transaction.find(query)
      .populate('itemId', 'title barcode itemType typeSpecificFields')
      .populate('copyId', 'copyNumber barcode')
      .sort({ issueDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalTransactions = await Transaction.countDocuments(query);
    
    // Format transactions for mobile app compatibility
    const transactionsWithStatus = transactions.map(transaction => {
      const transObj = transaction.toObject();
      
      // Calculate days until due or days overdue
      const now = new Date();
      const dueDate = new Date(transaction.dueDate);
      const diffTime = dueDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Format for frontend compatibility
      const formattedTransaction = {
        _id: transObj._id,
        itemId: transObj.itemId,
        userId: transObj.userId,
        issuedDate: transObj.issueDate, // Map issueDate to issuedDate
        dueDate: transObj.dueDate,
        returnDate: transObj.returnDate,
        status: transObj.status,
        extensionCount: transObj.extensionCount || 0,
        maxExtensionAllowed: 3, // Default max extensions
        transactionId: transObj.transactionId,
        copyId: transObj.copyId
      };
      
      if (transaction.returnDate) {
        formattedTransaction.dueStatus = 'Returned';
        formattedTransaction.daysRemaining = 0;
        formattedTransaction.isOverdue = false;
      } else if (diffDays < 0) {
        formattedTransaction.dueStatus = 'Overdue';
        formattedTransaction.daysOverdue = Math.abs(diffDays);
        formattedTransaction.isOverdue = true;
      } else if (diffDays <= 2) {
        formattedTransaction.dueStatus = 'DueSoon';
        formattedTransaction.daysRemaining = diffDays;
        formattedTransaction.isOverdue = false;
      } else {
        formattedTransaction.dueStatus = 'Active';
        formattedTransaction.daysRemaining = diffDays;
        formattedTransaction.isOverdue = false;
      }
      
      // Add image data if available
      if (formattedTransaction.itemId && formattedTransaction.itemId.typeSpecificFields) {
        formattedTransaction.itemId.image = formattedTransaction.itemId.typeSpecificFields.image;
      }
      
      return formattedTransaction;
    });
    
    res.status(200).json({
      success: true,
      count: transactions.length,
      total: totalTransactions,
      totalPages: Math.ceil(totalTransactions / parseInt(limit)),
      currentPage: parseInt(page),
      data: transactionsWithStatus
    });
  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving transactions'
    });
  }
};

// Request renewal for a transaction
exports.requestRenewal = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { reason } = req.body;
    
    // Find the transaction
    const transaction = await Transaction.findOne({
      _id: transactionId,
      userId: req.user._id,
      status: { $in: ['Issued', 'Active'] },
      returnDate: null
    }).populate('itemId');
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or not eligible for renewal. Item may already be returned or not currently issued to you.'
      });
    }
    
    // Check if item is overdue
    const now = new Date();
    if (new Date(transaction.dueDate) < now) {
      return res.status(400).json({
        success: false,
        message: 'Cannot renew overdue items. Please return the item first.'
      });
    }
    
    // Check if renewal request already exists
    const existingRequest = await RenewalRequest.findOne({
      transactionId,
      status: 'Pending'
    });
    
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Renewal request already pending for this item'
      });
    }
    
    // Check renewal count limit
    const renewalCount = transaction.renewalCount || 0;
    if (renewalCount >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Maximum renewal limit reached (3 renewals)'
      });
    }
    
    // Create renewal request
    const renewalRequest = new RenewalRequest({
      transactionId,
      userId: req.user._id,
      itemId: transaction.itemId._id,
      currentDueDate: transaction.dueDate,
      requestedDueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      reason: reason || 'Standard renewal request',
      status: 'Pending'
    });
    
    await renewalRequest.save();
    
    // Create notification for admin
    const Notification = require('../models/notification.model');
    await Notification.create({
      userId: req.user._id,
      title: 'Renewal Request Submitted',
      message: `Your renewal request for "${transaction.itemId.title}" has been submitted and is pending admin approval.`,
      type: 'RenewalRequested'
    });
    
    res.status(201).json({
      success: true,
      message: 'Renewal request submitted successfully. Awaiting admin approval.',
      data: renewalRequest
    });
  } catch (error) {
    console.error('Request renewal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting renewal request'
    });
  }
};

// Get user's renewal requests
exports.getUserRenewalRequests = async (req, res) => {
  try {
    const renewalRequests = await RenewalRequest.find({
      userId: req.user._id
    })
    .populate({
      path: 'transactionId',
      populate: {
        path: 'itemId',
        select: 'title barcode itemType'
      }
    })
    .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: renewalRequests
    });
  } catch (error) {
    console.error('Get renewal requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving renewal requests'
    });
  }
};