const mongoose = require('mongoose');
const User = require('../models/user.model');
const Item = require('../models/item.model');
const Transaction = require('../models/transaction.model');
const Fine = require('../models/fine.model');
const Donation = require('../models/donation.model');

// Get dashboard summary
exports.getDashboardSummary = async (req, res) => {
  // Check if user has permission to view dashboard
  // This is a basic check - in a real application, you would use the authorize middleware
  // to check for specific permissions
  try {
    // Initialize variables with default values
    let totalItems = 0;
    let availableItems = 0;
    let issuedItems = 0;
    let misplacedLostItems = 0;
    let overdueItemsCount = 0;
    let newRequestsCount = 0;
    let outstandingFinesCount = 0;
    let pendingDonationsCount = 0;
    let totalMembers = 0;
    let activeMembers = 0;
    
    // Check if models exist before querying
    if (mongoose.modelNames().includes('Item')) {
      // Get total items count (sum of all item quantities)
      const items = await Item.find({}, 'quantity availableCopies');
      totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      
      // Get available items count (sum of available copies)
      availableItems = items.reduce((sum, item) => sum + (item.availableCopies || 0), 0);
      
      // Get issued items count (total - available)
      issuedItems = totalItems - availableItems;
      
      // Get misplaced/lost items count from ItemCopy model if it exists
      if (mongoose.modelNames().includes('ItemCopy')) {
        const ItemCopy = require('../models/itemCopy.model');
        misplacedLostItems = await ItemCopy.countDocuments({ 
          status: { $in: ['Misplaced', 'Lost', 'Under Repair'] } 
        });
      }
    }
    
    if (mongoose.modelNames().includes('Transaction')) {
      // Get overdue items count (active transactions past due date)
      overdueItemsCount = await Transaction.countDocuments({ 
        returnDate: null, 
        status: { $in: ['Issued', 'Active'] },
        dueDate: { $lt: new Date() } 
      });
    }
    
    // Get new requests count from both Request and ItemRequest models
    if (mongoose.modelNames().includes('Request')) {
      const Request = require('../models/request.model');
      newRequestsCount += await Request.countDocuments({ 
        status: 'Pending' 
      });
    }
    
    if (mongoose.modelNames().includes('ItemRequest')) {
      const ItemRequest = require('../models/itemRequest.model');
      newRequestsCount += await ItemRequest.countDocuments({ 
        status: 'Pending' 
      });
    }
    
    let outstandingFinesAmount = 0;
    if (mongoose.modelNames().includes('Fine')) {
      // Get outstanding fines count (Outstanding + Partial Paid)
      outstandingFinesCount = await Fine.countDocuments({ 
        status: { $in: ['Outstanding', 'Partial Paid'] }
      });
      
      // Get outstanding fines amount
      const outstandingFines = await Fine.find({ 
        status: { $in: ['Outstanding', 'Partial Paid'] }
      });
      
      outstandingFinesAmount = outstandingFines.reduce((total, fine) => {
        const paidAmount = fine.paidAmount || 0;
        const remainingAmount = Math.max(0, (fine.amount || 0) - paidAmount);
        return total + remainingAmount;
      }, 0);
    }
    
    if (mongoose.modelNames().includes('Donation')) {
      // Get pending donations count
      pendingDonationsCount = await Donation.countDocuments({ 
        status: 'Pending' 
      });
    }
    
    if (mongoose.modelNames().includes('User')) {
      // Get total members count
      totalMembers = await User.countDocuments();
      
      // Get active members count
      activeMembers = await User.countDocuments({ 
        status: 'Active' 
      });
    }
    
    // Get recent activities (last 10)
    const recentActivities = await getRecentActivities();
    
    // Return dashboard summary
    res.status(200).json({
      success: true,
      data: {
        totalItems,
        availableItems,
        issuedItems,
        misplacedLostItems,
        overdueItemsCount,
        newRequestsCount,
        outstandingFinesCount,
        outstandingFinesAmount,
        pendingDonationsCount,
        totalMembers,
        activeMembers,
        recentActivities
      }
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving dashboard summary'
    });
  }
};

// Helper function to get recent activities
const getRecentActivities = async () => {
  try {
    // Get recent transactions (issues, returns)
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'fullName')
      .populate('itemId', 'title')
      .populate('createdBy', 'fullName');
    
    // Get recent fines
    const fines = await Fine.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('userId', 'fullName')
      .populate('itemId', 'title');
    
    // Get recent donations
    const donations = await Donation.find()
      .sort({ createdAt: -1 })
      .limit(2)
      .populate('userId', 'fullName');
  
  // Combine and format activities
  const activities = [
    ...transactions.map(transaction => ({
      id: transaction._id,
      type: transaction.returnDate ? 'return' : 'issue',
      timestamp: transaction.createdAt,
      details: {
        user: transaction.userId ? transaction.userId.fullName : 'Unknown User',
        item: transaction.itemId ? transaction.itemId.title : 'Unknown Item',
        admin: transaction.createdBy ? transaction.createdBy.fullName : 'System',
        dueDate: transaction.dueDate
      }
    })),
    ...fines.map(fine => ({
      id: fine._id,
      type: 'fine',
      timestamp: fine.createdAt,
      details: {
        user: fine.userId ? fine.userId.fullName : 'Unknown User',
        item: fine.itemId ? fine.itemId.title : 'Unknown Item',
        amount: fine.amount,
        reason: fine.reason
      }
    })),
    ...donations.map(donation => ({
      id: donation._id,
      type: 'donation',
      timestamp: donation.createdAt,
      details: {
        user: donation.userId ? donation.userId.fullName : 'Unknown User',
        itemName: donation.itemName,
        status: donation.status
      }
    }))
  ];
  
    // Sort by timestamp (most recent first) and limit to 10
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  } catch (error) {
    console.error('Error getting recent activities:', error);
    return []; // Return empty array in case of error
  }
};