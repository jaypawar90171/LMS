const Fine = require('../models/fine.model');
const User = require('../models/user.model');
const Item = require('../models/item.model');
const Transaction = require('../models/transaction.model');
const FineService = require('../services/fine.service');
const { ActivityLogger } = require('../utils/activity-logger');

// Get all fines with filtering
exports.getFines = async (req, res) => {
  try {
    const { 
      userId, 
      status, 
      reason, 
      fromDate, 
      toDate, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    // Build query
    const query = {};
    
    // Add userId filter with validation
    if (userId) {
      if (typeof userId === 'string' && /^[0-9a-fA-F]{24}$/.test(userId)) {
        query.userId = userId;
      }
    }
    
    // Add status filter
    if (status) {
      query.status = status;
    }
    
    // Add reason filter
    if (reason) {
      query.reason = reason;
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
    
    // Execute all queries in parallel
    const [fines, totalFines, totalsAgg] = await Promise.all([
      Fine.find(query)
        .populate('userId', 'fullName email')
        .populate('itemId', 'title barcode')
        .populate('transactionId')
        .populate('createdBy', 'fullName')
        .populate('payments.recordedBy', 'fullName')
        .populate('waiver.waivedBy', 'fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Fine.countDocuments(query),
      Fine.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            paidAmount: {
              $sum: {
                $cond: [
                  { $eq: ['$status', 'Paid'] },
                  '$amount',
                  {
                    $cond: [
                      { $eq: ['$status', 'Partial Paid'] },
                      { $sum: '$payments.amount' },
                      0
                    ]
                  }
                ]
              }
            }
          }
        }
      ])
    ]);
    
    const totalAmount = totalsAgg[0]?.totalAmount || 0;
    const collectedAmount = totalsAgg[0]?.paidAmount || 0;
    
    res.status(200).json({
      success: true,
      count: fines.length,
      total: totalFines,
      totalPages: Math.ceil(totalFines / parseInt(limit)),
      currentPage: parseInt(page),
      totalAmount,
      collectedAmount,
      outstandingAmount: totalAmount - collectedAmount,
      data: fines
    });
  } catch (error) {
    console.error('Get fines error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving fines'
    });
  }
};

// Create a new fine
exports.createFine = async (req, res) => {
  try {
    const { userId, itemId, amount, reason, dueDate, notes } = req.body;
    
    // Validate user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Validate item if provided
    let item = null;
    if (itemId) {
      item = await Item.findById(itemId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }
    }
    
    // Validate reason
    const validReasons = ['Overdue', 'Damaged', 'Lost', 'Manual'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: `Invalid reason. Must be one of: ${validReasons.join(', ')}`
      });
    }
    
    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }
    
    // Create fine
    const fine = await Fine.create({
      userId: user._id,
      itemId: item ? item._id : undefined,
      amount,
      reason,
      status: 'Outstanding',
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default due date: 14 days from now
      notes,
      createdBy: req.user._id
    });
    
    res.status(201).json({
      success: true,
      message: 'Fine created successfully',
      data: fine
    });
  } catch (error) {
    console.error('Create fine error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating fine'
    });
  }
};

// Add overdue fine for a specific transaction
exports.addOverdueFine = async (req, res) => {
  try {
    const { transactionId, amount, notes, forceAdd } = req.body;
    
    // Validate required fields
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required'
      });
    }
    
    // Validate user authentication
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    
    // Find transaction
    const transaction = await Transaction.findById(transactionId)
      .populate('userId', 'fullName email')
      .populate('itemId', 'title barcode');
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    // Check if transaction is overdue
    if (transaction.returnDate || new Date(transaction.dueDate) >= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Transaction is not overdue or already returned'
      });
    }
    
    // Check if fine already exists for this transaction
    const existingFine = await Fine.findOne({
      transactionId: transaction._id,
      reason: 'Overdue'
    });
    
    if (existingFine && !forceAdd) {
      return res.status(400).json({
        success: false,
        message: 'Overdue fine already exists for this transaction',
        code: 'FINE_EXISTS',
        existingFine: {
          id: existingFine._id,
          amount: existingFine.amount,
          status: existingFine.status,
          createdAt: existingFine.createdAt
        }
      });
    }
    
    // Calculate days overdue
    const dueDate = new Date(transaction.dueDate);
    const now = new Date();
    const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Validate amount
    const fineAmount = amount || (daysOverdue * 1);
    if (fineAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Fine amount must be greater than 0'
      });
    }
    
    // Create fine
    const fine = await Fine.create({
      userId: transaction.userId._id,
      itemId: transaction.itemId._id,
      transactionId: transaction._id,
      amount: fineAmount,
      reason: 'Overdue',
      status: 'Outstanding',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Due in 14 days
      notes: notes || `Overdue by ${daysOverdue} days. Fine added by admin.`,
      createdBy: req.user._id
    });
    
    res.status(201).json({
      success: true,
      message: 'Overdue fine added successfully',
      data: {
        fine,
        transaction: {
          id: transaction._id,
          user: transaction.userId.fullName,
          item: transaction.itemId.title,
          dueDate: transaction.dueDate,
          daysOverdue
        }
      }
    });
  } catch (error) {
    console.error('Add overdue fine error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding overdue fine',
      error: error.message
    });
  }
};

// Record payment for a fine
exports.recordPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, referenceId, notes } = req.body;
    
    // Find fine
    const fine = await Fine.findById(req.params.id);
    
    if (!fine) {
      return res.status(404).json({
        success: false,
        message: 'Fine not found'
      });
    }
    
    // Check if fine is already waived
    if (fine.status === 'Waived') {
      return res.status(400).json({
        success: false,
        message: 'Cannot record payment for a waived fine'
      });
    }
    
    // Validate payment method
    const validPaymentMethods = ['Cash', 'Card', 'Online Transfer'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}`
      });
    }
    
    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than 0'
      });
    }
    
    // Calculate remaining amount
    const paidAmount = fine.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingAmount = fine.amount - paidAmount;
    
    if (amount > remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount exceeds remaining amount. Remaining: ${remainingAmount}`
      });
    }
    
    // Add payment
    fine.payments.push({
      amount,
      paymentMethod,
      referenceId,
      paymentDate: new Date(),
      notes,
      recordedBy: req.user._id
    });
    
    // Update fine status
    const newPaidAmount = paidAmount + amount;
    if (newPaidAmount >= fine.amount) {
      fine.status = 'Paid';
    } else {
      fine.status = 'Partial Paid';
    }
    
    await fine.save();
    
    // Log activity
    const user = await User.findById(fine.userId);
    await ActivityLogger.finePayment(req.user._id, fine._id, amount, user.fullName);
    
    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        fine,
        payment: fine.payments[fine.payments.length - 1],
        paidAmount: newPaidAmount,
        remainingAmount: fine.amount - newPaidAmount
      }
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording payment'
    });
  }
};

// Waive a fine
exports.waiveFine = async (req, res) => {
  try {
    const { reason } = req.body;
    
    // Find fine
    const fine = await Fine.findById(req.params.id);
    
    if (!fine) {
      return res.status(404).json({
        success: false,
        message: 'Fine not found'
      });
    }
    
    // Check if fine is already paid
    if (fine.status === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot waive a fully paid fine'
      });
    }
    
    // Update fine
    fine.status = 'Waived';
    fine.waiver = {
      reason: reason || 'Waived by administrator',
      waivedBy: req.user._id,
      waivedDate: new Date()
    };
    
    await fine.save();
    
    res.status(200).json({
      success: true,
      message: 'Fine waived successfully',
      data: fine
    });
  } catch (error) {
    console.error('Waive fine error:', error);
    res.status(500).json({
      success: false,
      message: 'Error waiving fine'
    });
  }
};

// Get fine details
exports.getFineById = async (req, res) => {
  try {
    const fine = await Fine.findById(req.params.fineId)
      .populate('userId', 'fullName email phoneNumber')
      .populate('itemId', 'title barcode')
      .populate('transactionId')
      .populate('createdBy', 'fullName')
      .populate('payments.recordedBy', 'fullName')
      .populate('waiver.waivedBy', 'fullName');
    
    if (!fine) {
      return res.status(404).json({
        success: false,
        message: 'Fine not found'
      });
    }
    
    // Get user's other fines
    const otherFines = await Fine.find({
      userId: fine.userId._id,
      _id: { $ne: fine._id }
    }).select('amount status reason');
    
    // Get related transaction if exists
    let transaction = null;
    if (fine.transactionId) {
      transaction = await Transaction.findById(fine.transactionId)
        .populate('itemId', 'title')
        .populate('copyId', 'copyNumber barcode');
    }
    
    res.status(200).json({
      success: true,
      data: {
        fine,
        otherFines,
        transaction
      }
    });
  } catch (error) {
    console.error('Get fine by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving fine details'
    });
  }
};

// Generate overdue fines
exports.generateOverdueFines = async (req, res) => {
  try {
    const result = await FineService.generateOverdueFines(req.user._id);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message
      });
    }
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        count: result.count
      }
    });
  } catch (error) {
    console.error('Generate overdue fines error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating overdue fines'
    });
  }
};

// Get fine statistics
exports.getFineStatistics = async (req, res) => {
  try {
    const result = await FineService.getFineStatistics();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get fine statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving fine statistics'
    });
  }
};

// Get user's fine summary
exports.getUserFineSummary = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user's fines
    const fines = await Fine.find({ userId });
    
    // Calculate summary
    const totalFines = fines.length;
    const totalAmount = fines.reduce((sum, fine) => sum + fine.amount, 0);
    
    const paidFines = fines.filter(fine => fine.status === 'Paid');
    const paidAmount = paidFines.reduce((sum, fine) => sum + fine.amount, 0);
    
    const partialPaidFines = fines.filter(fine => fine.status === 'Partial Paid');
    const partialPaidAmount = partialPaidFines.reduce((sum, fine) => {
      return sum + fine.payments.reduce((pSum, payment) => pSum + payment.amount, 0);
    }, 0);
    
    const outstandingFines = fines.filter(fine => 
      fine.status === 'Outstanding' || fine.status === 'Partial Paid'
    );
    const outstandingAmount = outstandingFines.reduce((sum, fine) => {
      if (fine.status === 'Outstanding') {
        return sum + fine.amount;
      } else {
        const paidAmount = fine.payments.reduce((pSum, payment) => pSum + payment.amount, 0);
        return sum + (fine.amount - paidAmount);
      }
    }, 0);
    
    const waivedFines = fines.filter(fine => fine.status === 'Waived');
    const waivedAmount = waivedFines.reduce((sum, fine) => sum + fine.amount, 0);
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.fullName,
          email: user.email
        },
        summary: {
          totalFines,
          totalAmount,
          paidFines: paidFines.length,
          paidAmount,
          partialPaidFines: partialPaidFines.length,
          partialPaidAmount,
          outstandingFines: outstandingFines.length,
          outstandingAmount,
          waivedFines: waivedFines.length,
          waivedAmount
        },
        recentFines: fines
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Get user fine summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user fine summary'
    });
  }
};