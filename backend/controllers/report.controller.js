const User = require('../models/user.model');
const Item = require('../models/item.model');
const Transaction = require('../models/transaction.model');
const Request = require('../models/request.model');
const Fine = require('../models/fine.model');
const Category = require('../models/category.model');
const Activity = require('../models/activity.model');
const mongoose = require('mongoose');

// Generate defaulters report
exports.getDefaultersReport = async (req, res) => {
  try {
    const { fromDate, toDate, itemType, userRole, format = 'json' } = req.query;
    
    // Build query
    const query = {
      returnDate: null,
      status: 'Overdue'
    };
    
    // Add date filters if provided
    if (fromDate || toDate) {
      query.dueDate = {};
      if (fromDate) {
        query.dueDate.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.dueDate.$lte = new Date(toDate);
      }
    }
    
    // Get overdue transactions
    const overdueTransactions = await Transaction.find(query)
      .populate({
        path: 'userId',
        select: 'fullName email phoneNumber roles',
        populate: {
          path: 'roles',
          select: 'name'
        }
      })
      .populate('itemId', 'title barcode itemType')
      .populate('copyId', 'copyNumber barcode')
      .sort({ dueDate: 1 });
    
    // Filter by item type if provided
    let filteredTransactions = overdueTransactions;
    if (itemType) {
      filteredTransactions = overdueTransactions.filter(
        transaction => transaction.itemId && transaction.itemId.itemType === itemType
      );
    }
    
    // Filter by user role if provided
    if (userRole) {
      filteredTransactions = filteredTransactions.filter(
        transaction => transaction.userId && 
          transaction.userId.roles.some(role => role.name === userRole)
      );
    }
    
    // Group by user
    const defaultersByUser = {};
    filteredTransactions.forEach(transaction => {
      const userId = transaction.userId._id.toString();
      
      if (!defaultersByUser[userId]) {
        defaultersByUser[userId] = {
          user: {
            id: transaction.userId._id,
            name: transaction.userId.fullName,
            email: transaction.userId.email,
            phoneNumber: transaction.userId.phoneNumber,
            roles: transaction.userId.roles.map(role => role.name)
          },
          overdueItems: [],
          totalOverdueItems: 0,
          maxDaysOverdue: 0
        };
      }
      
      // Calculate days overdue
      const dueDate = new Date(transaction.dueDate);
      const today = new Date();
      const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
      
      defaultersByUser[userId].overdueItems.push({
        transactionId: transaction.transactionId || transaction._id,
        item: {
          id: transaction.itemId._id,
          title: transaction.itemId.title,
          barcode: transaction.itemId.barcode,
          itemType: transaction.itemId.itemType
        },
        copy: {
          id: transaction.copyId._id,
          copyNumber: transaction.copyId.copyNumber,
          barcode: transaction.copyId.barcode
        },
        dueDate: transaction.dueDate,
        daysOverdue
      });
      
      defaultersByUser[userId].totalOverdueItems++;
      defaultersByUser[userId].maxDaysOverdue = Math.max(
        defaultersByUser[userId].maxDaysOverdue,
        daysOverdue
      );
    });
    
    // Convert to array and sort by max days overdue
    const defaulters = Object.values(defaultersByUser).sort(
      (a, b) => b.maxDaysOverdue - a.maxDaysOverdue
    );
    
    // Generate report
    const report = {
      title: 'Defaulters Report',
      generatedAt: new Date(),
      filters: {
        fromDate: fromDate || 'All time',
        toDate: toDate || 'Present',
        itemType: itemType || 'All types',
        userRole: userRole || 'All roles'
      },
      summary: {
        totalDefaulters: defaulters.length,
        totalOverdueItems: filteredTransactions.length
      },
      defaulters
    };
    
    // Return based on requested format
    if (format === 'csv') {
      // Generate CSV content
      let csv = 'User ID,User Name,Email,Phone Number,Roles,Total Overdue Items,Max Days Overdue\n';
      
      defaulters.forEach(defaulter => {
        csv += `${defaulter.user.id},${defaulter.user.name},${defaulter.user.email},${defaulter.user.phoneNumber},"${defaulter.user.roles.join(', ')}",${defaulter.totalOverdueItems},${defaulter.maxDaysOverdue}\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=defaulters_report.csv');
      return res.send(csv);
    }
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Defaulters report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating defaulters report'
    });
  }
};

// Generate queue report
exports.getQueueReport = async (req, res) => {
  try {
    const { 
      itemType, 
      category, 
      minQueueLength = 1, 
      maxQueueLength, 
      format = 'json' 
    } = req.query;
    
    // Find all items with pending requests
    const itemsWithRequests = await Request.aggregate([
      { 
        $match: { 
          status: 'Pending',
          requestType: 'Borrow'
        } 
      },
      {
        $group: {
          _id: '$itemId',
          queueLength: { $sum: 1 }
        }
      },
      {
        $match: {
          queueLength: { 
            $gte: parseInt(minQueueLength),
            ...(maxQueueLength ? { $lte: parseInt(maxQueueLength) } : {})
          }
        }
      }
    ]);
    
    if (itemsWithRequests.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          title: 'Queue Report',
          generatedAt: new Date(),
          summary: {
            totalItems: 0,
            averageQueueLength: 0
          },
          items: []
        }
      });
    }
    
    // Get item IDs with queues
    const itemIds = itemsWithRequests.map(item => 
      new mongoose.Types.ObjectId(item._id)
    );
    
    // Build query for items
    const query = { _id: { $in: itemIds } };
    
    // Add itemType filter
    if (itemType) {
      query.itemType = itemType;
    }
    
    // Add category filter with validation
    if (category) {
      if (typeof category === 'string' && /^[0-9a-fA-F]{24}$/.test(category)) {
        query.categoryId = new mongoose.Types.ObjectId(category);
      }
    }
    
    // Get items with queues
    const items = await Item.find(query)
      .populate('categoryId', 'name')
      .sort({ title: 1 });
    
    // Get queue details for each item
    const itemsWithQueueDetails = await Promise.all(
      items.map(async (item) => {
        const queueItem = itemsWithRequests.find(
          qItem => qItem._id.toString() === item._id.toString()
        );
        
        const queueRequests = await Request.find({
          itemId: item._id,
          status: 'Pending',
          requestType: 'Borrow'
        })
        .populate('userId', 'fullName email')
        .sort({ priority: -1, requestDate: 1 });
        
        // Calculate average wait time
        const oldestRequest = queueRequests.length > 0 ? 
          new Date(queueRequests[queueRequests.length - 1].requestDate) : null;
        
        const waitDays = oldestRequest ? 
          Math.ceil((new Date() - oldestRequest) / (1000 * 60 * 60 * 24)) : 0;
        
        return {
          id: item._id,
          title: item.title,
          barcode: item.barcode,
          itemType: item.itemType,
          category: item.categoryId ? item.categoryId.name : null,
          availableCopies: item.availableCopies,
          totalCopies: item.quantity,
          queueLength: queueItem ? queueItem.queueLength : 0,
          oldestRequest: oldestRequest,
          waitDays,
          topInQueue: queueRequests.slice(0, 3).map(req => ({
            id: req._id,
            user: {
              id: req.userId._id,
              name: req.userId.fullName,
              email: req.userId.email
            },
            requestDate: req.requestDate,
            priority: req.priority
          }))
        };
      })
    );
    
    // Calculate summary statistics
    const totalItems = itemsWithQueueDetails.length;
    const totalQueueLength = itemsWithQueueDetails.reduce(
      (sum, item) => sum + item.queueLength, 0
    );
    const averageQueueLength = totalItems > 0 ? 
      (totalQueueLength / totalItems).toFixed(2) : 0;
    const maxQueueLengthFound = itemsWithQueueDetails.reduce(
      (max, item) => Math.max(max, item.queueLength), 0
    );
    const averageWaitDays = itemsWithQueueDetails.reduce(
      (sum, item) => sum + item.waitDays, 0
    ) / totalItems;
    
    // Generate report
    const report = {
      title: 'Queue Report',
      generatedAt: new Date(),
      filters: {
        itemType: itemType || 'All types',
        category: category || 'All categories',
        minQueueLength,
        maxQueueLength: maxQueueLength || 'No limit'
      },
      summary: {
        totalItems,
        totalQueueLength,
        averageQueueLength,
        maxQueueLength: maxQueueLengthFound,
        averageWaitDays: averageWaitDays.toFixed(2)
      },
      items: itemsWithQueueDetails
    };
    
    // Return based on requested format
    if (format === 'csv') {
      // Generate CSV content
      let csv = 'Item ID,Title,Barcode,Item Type,Category,Available Copies,Total Copies,Queue Length,Wait Days\n';
      
      itemsWithQueueDetails.forEach(item => {
        csv += `${item.id},${item.title},${item.barcode},${item.itemType},${item.category || 'N/A'},${item.availableCopies},${item.totalCopies},${item.queueLength},${item.waitDays}\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=queue_report.csv');
      return res.send(csv);
    }
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Queue report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating queue report'
    });
  }
};

// Generate allocation report
exports.getAllocationReport = async (req, res) => {
  try {
    const { 
      adminUser, 
      itemStatus, 
      returnStatus, 
      fromDate, 
      toDate, 
      format = 'json' 
    } = req.query;
    
    // Build query
    const query = {};
    
    // Add date range filter
    if (fromDate || toDate) {
      query.issueDate = {};
      if (fromDate) {
        query.issueDate.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.issueDate.$lte = new Date(toDate);
      }
    }
    
    // Add admin user filter with validation
    if (adminUser) {
      if (typeof adminUser === 'string' && /^[0-9a-fA-F]{24}$/.test(adminUser)) {
        query.createdBy = new mongoose.Types.ObjectId(adminUser);
      }
    }
    
    // Add item status filter
    if (itemStatus) {
      query.status = itemStatus;
    }
    
    // Add return status filter
    if (returnStatus) {
      if (returnStatus === 'Returned') {
        query.returnDate = { $ne: null };
      } else if (returnStatus === 'NotReturned') {
        query.returnDate = null;
      }
    }
    
    // Get transactions
    const transactions = await Transaction.find(query)
      .populate('userId', 'fullName email')
      .populate('itemId', 'title barcode itemType')
      .populate('copyId', 'copyNumber')
      .populate('createdBy', 'fullName')
      .sort({ issueDate: -1 });
    
    // Group by admin user
    const allocationsByAdmin = {};
    transactions.forEach(transaction => {
      if (!transaction.createdBy) return;
      
      const adminId = transaction.createdBy._id.toString();
      
      if (!allocationsByAdmin[adminId]) {
        allocationsByAdmin[adminId] = {
          admin: {
            id: transaction.createdBy._id,
            name: transaction.createdBy.fullName
          },
          totalAllocations: 0,
          returnedAllocations: 0,
          overdueAllocations: 0,
          allocations: []
        };
      }
      
      allocationsByAdmin[adminId].totalAllocations++;
      
      if (transaction.returnDate) {
        allocationsByAdmin[adminId].returnedAllocations++;
      } else if (transaction.status === 'Overdue') {
        allocationsByAdmin[adminId].overdueAllocations++;
      }
      
      allocationsByAdmin[adminId].allocations.push({
        transactionId: transaction.transactionId || transaction._id,
        user: {
          id: transaction.userId._id,
          name: transaction.userId.fullName,
          email: transaction.userId.email
        },
        item: {
          id: transaction.itemId._id,
          title: transaction.itemId.title,
          barcode: transaction.itemId.barcode,
          itemType: transaction.itemId.itemType
        },
        copy: {
          id: transaction.copyId._id,
          copyNumber: transaction.copyId.copyNumber
        },
        issueDate: transaction.issueDate,
        dueDate: transaction.dueDate,
        returnDate: transaction.returnDate,
        status: transaction.status
      });
    });
    
    // Convert to array and sort by total allocations
    const allocations = Object.values(allocationsByAdmin).sort(
      (a, b) => b.totalAllocations - a.totalAllocations
    );
    
    // Generate report
    const report = {
      title: 'Allocation Report',
      generatedAt: new Date(),
      filters: {
        adminUser: adminUser || 'All admins',
        itemStatus: itemStatus || 'All statuses',
        returnStatus: returnStatus || 'All',
        fromDate: fromDate || 'All time',
        toDate: toDate || 'Present'
      },
      summary: {
        totalTransactions: transactions.length,
        totalAdmins: allocations.length,
        returnedAllocations: transactions.filter(t => t.returnDate).length,
        overdueAllocations: transactions.filter(t => t.status === 'Overdue').length
      },
      allocations
    };
    
    // Return based on requested format
    if (format === 'csv') {
      // Generate CSV content
      let csv = 'Admin ID,Admin Name,Total Allocations,Returned Allocations,Overdue Allocations\n';
      
      allocations.forEach(allocation => {
        csv += `${allocation.admin.id},${allocation.admin.name},${allocation.totalAllocations},${allocation.returnedAllocations},${allocation.overdueAllocations}\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=allocation_report.csv');
      return res.send(csv);
    }
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Allocation report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating allocation report'
    });
  }
};

// Generate fines report
exports.getFinesReport = async (req, res) => {
  try {
    const { 
      status, 
      reason, 
      userRole, 
      fromDate, 
      toDate, 
      format = 'json' 
    } = req.query;
    
    // Build query
    const query = {};
    
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
    
    // Get fines
    const fines = await Fine.find(query)
      .populate({
        path: 'userId',
        select: 'fullName email roles',
        populate: {
          path: 'roles',
          select: 'name'
        }
      })
      .populate('itemId', 'title barcode')
      .populate('transactionId')
      .sort({ createdAt: -1 });
    
    // Filter by user role if provided
    let filteredFines = fines;
    if (userRole) {
      filteredFines = fines.filter(
        fine => fine.userId && 
          fine.userId.roles.some(role => role.name === userRole)
      );
    }
    
    // Group by reason
    const finesByReason = {};
    filteredFines.forEach(fine => {
      if (!finesByReason[fine.reason]) {
        finesByReason[fine.reason] = {
          reason: fine.reason,
          count: 0,
          totalAmount: 0,
          paidAmount: 0,
          outstandingAmount: 0,
          waivedAmount: 0
        };
      }
      
      finesByReason[fine.reason].count++;
      finesByReason[fine.reason].totalAmount += fine.amount;
      
      if (fine.status === 'Paid') {
        finesByReason[fine.reason].paidAmount += fine.amount;
      } else if (fine.status === 'Waived') {
        finesByReason[fine.reason].waivedAmount += fine.amount;
      } else if (fine.status === 'Partial Paid') {
        const paidAmount = fine.payments.reduce((sum, payment) => sum + payment.amount, 0);
        finesByReason[fine.reason].paidAmount += paidAmount;
        finesByReason[fine.reason].outstandingAmount += (fine.amount - paidAmount);
      } else {
        finesByReason[fine.reason].outstandingAmount += fine.amount;
      }
    });
    
    // Group by status
    const finesByStatus = {};
    filteredFines.forEach(fine => {
      if (!finesByStatus[fine.status]) {
        finesByStatus[fine.status] = {
          status: fine.status,
          count: 0,
          totalAmount: 0
        };
      }
      
      finesByStatus[fine.status].count++;
      finesByStatus[fine.status].totalAmount += fine.amount;
    });
    
    // Calculate summary statistics
    const totalAmount = filteredFines.reduce((sum, fine) => sum + fine.amount, 0);
    const paidAmount = filteredFines.reduce((sum, fine) => {
      if (fine.status === 'Paid') {
        return sum + fine.amount;
      } else if (fine.status === 'Partial Paid') {
        return sum + fine.payments.reduce((pSum, payment) => pSum + payment.amount, 0);
      }
      return sum;
    }, 0);
    const waivedAmount = filteredFines.reduce((sum, fine) => 
      fine.status === 'Waived' ? sum + fine.amount : sum, 0
    );
    const outstandingAmount = totalAmount - paidAmount - waivedAmount;
    
    // Generate report
    const report = {
      title: 'Fines Report',
      generatedAt: new Date(),
      filters: {
        status: status || 'All statuses',
        reason: reason || 'All reasons',
        userRole: userRole || 'All roles',
        fromDate: fromDate || 'All time',
        toDate: toDate || 'Present'
      },
      summary: {
        totalFines: filteredFines.length,
        totalAmount,
        paidAmount,
        waivedAmount,
        outstandingAmount,
        collectionRate: totalAmount > 0 ? ((paidAmount / totalAmount) * 100).toFixed(2) : 0
      },
      byReason: Object.values(finesByReason),
      byStatus: Object.values(finesByStatus)
    };
    
    // Return based on requested format
    if (format === 'csv') {
      // Generate CSV content
      let csv = 'Fine ID,User,Amount,Reason,Status,Created Date,Item,Paid Amount,Outstanding Amount\n';
      
      filteredFines.forEach(fine => {
        const paidAmount = fine.status === 'Paid' ? fine.amount : 
          (fine.status === 'Partial Paid' ? 
            fine.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0);
        
        const outstandingAmount = fine.status === 'Outstanding' ? fine.amount : 
          (fine.status === 'Partial Paid' ? fine.amount - paidAmount : 0);
        
        csv += `${fine._id},${fine.userId.fullName},${fine.amount},${fine.reason},${fine.status},${fine.createdAt.toISOString().split('T')[0]},${fine.itemId ? fine.itemId.title : 'N/A'},${paidAmount},${outstandingAmount}\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=fines_report.csv');
      return res.send(csv);
    }
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Fines report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating fines report'
    });
  }
};

// Generate inventory report
exports.getInventoryReport = async (req, res) => {
  try {
    const { category, status, format = 'json' } = req.query;
    
    // Build query
    const query = {};
    
    // Add category filter with validation
    if (category) {
      if (typeof category === 'string' && /^[0-9a-fA-F]{24}$/.test(category)) {
        query.categoryId = new mongoose.Types.ObjectId(category);
      }
    }
    
    // Add status filter
    if (status) {
      query.status = status;
    }
    
    // Get items
    const items = await Item.find(query)
      .populate('categoryId', 'name')
      .populate('subcategoryId', 'name')
      .sort({ title: 1 });
    
    // Group by item type
    const itemsByType = {};
    items.forEach(item => {
      if (!itemsByType[item.itemType]) {
        itemsByType[item.itemType] = {
          itemType: item.itemType,
          count: 0,
          totalQuantity: 0,
          availableCopies: 0,
          issuedCopies: 0,
          items: []
        };
      }
      
      itemsByType[item.itemType].count++;
      itemsByType[item.itemType].totalQuantity += item.quantity;
      itemsByType[item.itemType].availableCopies += item.availableCopies;
      itemsByType[item.itemType].issuedCopies += (item.quantity - item.availableCopies);
      
      itemsByType[item.itemType].items.push({
        id: item._id,
        title: item.title,
        barcode: item.barcode,
        category: item.categoryId ? item.categoryId.name : null,
        subcategory: item.subcategoryId ? item.subcategoryId.name : null,
        quantity: item.quantity,
        availableCopies: item.availableCopies,
        issuedCopies: item.quantity - item.availableCopies,
        status: item.status
      });
    });
    
    // Group by category
    const itemsByCategory = {};
    items.forEach(item => {
      const categoryName = item.categoryId ? item.categoryId.name : 'Uncategorized';
      
      if (!itemsByCategory[categoryName]) {
        itemsByCategory[categoryName] = {
          category: categoryName,
          count: 0,
          totalQuantity: 0,
          availableCopies: 0
        };
      }
      
      itemsByCategory[categoryName].count++;
      itemsByCategory[categoryName].totalQuantity += item.quantity;
      itemsByCategory[categoryName].availableCopies += item.availableCopies;
    });
    
    // Group by status
    const itemsByStatus = {};
    items.forEach(item => {
      if (!itemsByStatus[item.status]) {
        itemsByStatus[item.status] = {
          status: item.status,
          count: 0,
          totalQuantity: 0
        };
      }
      
      itemsByStatus[item.status].count++;
      itemsByStatus[item.status].totalQuantity += item.quantity;
    });
    
    // Calculate summary statistics
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAvailableCopies = items.reduce((sum, item) => sum + item.availableCopies, 0);
    const totalIssuedCopies = totalQuantity - totalAvailableCopies;
    
    // Generate report
    const report = {
      title: 'Inventory Report',
      generatedAt: new Date(),
      filters: {
        category: category ? (await Category.findById(category))?.name || 'Unknown' : 'All categories',
        status: status || 'All statuses'
      },
      summary: {
        totalItems,
        totalQuantity,
        totalAvailableCopies,
        totalIssuedCopies,
        availabilityRate: totalQuantity > 0 ? 
          ((totalAvailableCopies / totalQuantity) * 100).toFixed(2) : 0
      },
      byType: Object.values(itemsByType),
      byCategory: Object.values(itemsByCategory),
      byStatus: Object.values(itemsByStatus)
    };
    
    // Return based on requested format
    if (format === 'csv') {
      // Generate CSV content
      let csv = 'Item ID,Title,Barcode,Item Type,Category,Subcategory,Quantity,Available Copies,Issued Copies,Status\n';
      
      items.forEach(item => {
        csv += `${item._id},${item.title},${item.barcode},${item.itemType},${item.categoryId ? item.categoryId.name : 'N/A'},${item.subcategoryId ? item.subcategoryId.name : 'N/A'},${item.quantity},${item.availableCopies},${item.quantity - item.availableCopies},${item.status}\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=inventory_report.csv');
      return res.send(csv);
    }
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating inventory report'
    });
  }
};

// Generate activity log report
exports.getActivityReport = async (req, res) => {
  try {
    const { 
      actionType, 
      userId, 
      fromDate, 
      toDate, 
      page = 1, 
      limit = 100, 
      format = 'json' 
    } = req.query;
    

    
    // Build query
    const query = {};
    
    // Add action type filter
    if (actionType) {
      query.actionType = actionType;
    }
    
    // Add user filter with validation
    if (userId) {
      if (typeof userId === 'string' && /^[0-9a-fA-F]{24}$/.test(userId)) {
        query.userId = new mongoose.Types.ObjectId(userId);
      }
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
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Get activities with pagination
    const activities = await Activity.find(query)
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    // Get total count
    const totalActivities = await Activity.countDocuments(query);
    
    // Group by action type
    const activitiesByType = {};
    const allActivities = await Activity.find(query);
    
    allActivities.forEach(activity => {
      if (!activitiesByType[activity.actionType]) {
        activitiesByType[activity.actionType] = {
          actionType: activity.actionType,
          count: 0
        };
      }
      activitiesByType[activity.actionType].count++;
    });
    
    // Group by user
    const activitiesByUser = {};
    allActivities.forEach(activity => {
      const userId = activity.userId.toString();
      if (!activitiesByUser[userId]) {
        activitiesByUser[userId] = {
          userId,
          count: 0
        };
      }
      activitiesByUser[userId].count++;
    });
    
    // Generate report
    const report = {
      title: 'Activity Report',
      generatedAt: new Date(),
      filters: {
        actionType: actionType || 'All actions',
        userId: userId || 'All users',
        fromDate: fromDate || 'All time',
        toDate: toDate || 'Present'
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalActivities,
        totalPages: Math.ceil(totalActivities / limitNum)
      },
      summary: {
        totalActivities,
        uniqueUsers: Object.keys(activitiesByUser).length,
        actionTypes: Object.keys(activitiesByType).length
      },
      byType: Object.values(activitiesByType),
      activities: activities.map(activity => ({
        id: activity._id,
        user: activity.userId ? {
          id: activity.userId._id,
          name: activity.userId.fullName,
          email: activity.userId.email
        } : null,
        actionType: activity.actionType,
        description: activity.description,
        entityType: activity.entityType,
        entityId: activity.entityId,
        timestamp: activity.createdAt,
        ipAddress: activity.ipAddress
      }))
    };
    
    // Return based on requested format
    if (format === 'csv') {
      // Generate CSV content
      let csv = 'Activity ID,User,Action Type,Description,Entity Type,Entity ID,Timestamp,IP Address\n';
      
      activities.forEach(activity => {
        const userName = activity.userId ? activity.userId.fullName : 'Unknown User';
        csv += `${activity._id},${userName},${activity.actionType},"${activity.description}",${activity.entityType || 'N/A'},${activity.entityId || 'N/A'},${activity.createdAt.toISOString()},${activity.ipAddress || 'N/A'}\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=activity_report.csv');
      return res.send(csv);
    }
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Activity report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating activity report'
    });
  }
};