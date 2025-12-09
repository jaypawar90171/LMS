const Item = require('../models/item.model');
const Category = require('../models/category.model');
const Request = require('../models/request.model');
const Transaction = require('../models/transaction.model');

// Search items
exports.searchItems = async (req, res) => {
  try {
    const { q: searchQuery, page = 1, limit = 10 } = req.query;
    
    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    // Sanitize search query to prevent NoSQL injection
    const sanitizedQuery = searchQuery.toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Build search query with sanitized input
    const query = {
      $or: [
        { title: { $regex: sanitizedQuery, $options: 'i' } },
        { description: { $regex: sanitizedQuery, $options: 'i' } },
        { 'typeSpecificFields.author': { $regex: sanitizedQuery, $options: 'i' } },
        { 'typeSpecificFields.isbn': { $regex: sanitizedQuery, $options: 'i' } },
        { 'typeSpecificFields.publisher': { $regex: sanitizedQuery, $options: 'i' } }
      ]
    };
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute search
    const items = await Item.find(query)
      .populate('categoryId', 'name')
      .populate('subcategoryId', 'name')
      .sort({ title: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count
    const totalItems = await Item.countDocuments(query);
    
    // Format items for mobile with proper handling of different item types
    const formattedItems = items.map(item => {
      let subtitle = '';
      
      // Handle different item types
      switch (item.itemType) {
        case 'Book':
          subtitle = item.typeSpecificFields?.author || 'Unknown Author';
          break;
        case 'Shared':
          subtitle = item.typeSpecificFields?.brand 
            ? `${item.typeSpecificFields.brand} ${item.typeSpecificFields.model || ''}`.trim()
            : item.description || 'Shared Item';
          break;
        case 'Toy':
          subtitle = item.typeSpecificFields?.brand 
            ? `${item.typeSpecificFields.brand} - ${item.typeSpecificFields.ageRange || 'All Ages'}`
            : item.typeSpecificFields?.ageRange || 'Educational Toy';
          break;
        case 'Course':
          subtitle = item.typeSpecificFields?.instructor || 'Online Course';
          break;
        default:
          subtitle = item.description || item.itemType;
      }
      
      return {
        _id: item._id,
        title: item.title,
        subtitle: subtitle,
        itemType: item.itemType,
        categoryName: item.categoryId?.name,
        availableCopies: item.availableCopies,
        totalCopies: item.quantity,
        condition: item.condition,
        typeSpecificFields: item.typeSpecificFields || {},
        image: item.typeSpecificFields?.image
      };
    });
    
    res.status(200).json({
      success: true,
      count: formattedItems.length,
      total: totalItems,
      totalPages: Math.ceil(totalItems / parseInt(limit)),
      currentPage: parseInt(page),
      data: formattedItems
    });
  } catch (error) {
    console.error('Search items error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching items'
    });
  }
};

// Get available items
exports.getItems = async (req, res) => {
  try {
    const { 
      category, 
      search, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    // Build query
    const query = {
      availableCopies: { $gt: 0 },
      status: 'Available'
    };
    
    // Add category filter
    if (category) {
      query.$or = [
        { categoryId: category },
        { subcategoryId: category }
      ];
    }
    
    // Add search filter
    if (search) {
      query.$text = { $search: search };
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const items = await Item.find(query)
      .populate('categoryId', 'name')
      .populate('subcategoryId', 'name')
      .sort({ title: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalItems = await Item.countDocuments(query);
    
    // Check if user has any active requests or transactions for these items
    const itemIds = items.map(item => item._id);
    
    const userRequests = await Request.find({
      userId: req.user._id,
      itemId: { $in: itemIds },
      status: { $in: ['Pending', 'Approved'] }
    });
    
    const userTransactions = await Transaction.find({
      userId: req.user._id,
      itemId: { $in: itemIds },
      returnDate: null
    });
    
    // Add user-specific flags to items
    const itemsWithUserData = items.map(item => {
      const itemObj = item.toObject();
      
      // Check if user has requested this item
      const hasRequested = userRequests.some(req => 
        req.itemId.toString() === item._id.toString()
      );
      
      // Check if user has borrowed this item
      const hasBorrowed = userTransactions.some(trans => 
        trans.itemId.toString() === item._id.toString()
      );
      
      return {
        ...itemObj,
        userHasRequested: hasRequested,
        userHasBorrowed: hasBorrowed,
        // Add formatted subtitle for mobile display
        subtitle: itemObj.typeSpecificFields?.author || itemObj.description || itemObj.itemType
      };
    });
    
    res.status(200).json({
      success: true,
      count: items.length,
      total: totalItems,
      totalPages: Math.ceil(totalItems / parseInt(limit)),
      currentPage: parseInt(page),
      data: itemsWithUserData
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving items'
    });
  }
};

// Get item details
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId)
      .populate('categoryId', 'name description')
      .populate('subcategoryId', 'name description');
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    // Check if user has requested this item
    const userRequest = await Request.findOne({
      userId: req.user._id,
      itemId: item._id,
      status: { $in: ['Pending', 'Approved'] }
    });
    
    // Check if user has borrowed this item
    const userTransaction = await Transaction.findOne({
      userId: req.user._id,
      itemId: item._id,
      returnDate: null
    });
    
    // Get queue length for this item
    const queueLength = await Request.countDocuments({
      itemId: item._id,
      status: 'Pending',
      requestType: 'Borrow'
    });
    
    // Add user-specific data
    const itemWithUserData = {
      ...item.toObject(),
      userHasRequested: !!userRequest,
      userHasBorrowed: !!userTransaction,
      queueLength,
      estimatedWaitTime: queueLength > 0 && item.availableCopies === 0 ? 
        `${Math.ceil(queueLength / (item.quantity || 1)) * item.defaultReturnPeriod} days` : 
        'Available now'
    };
    
    res.status(200).json({
      success: true,
      data: itemWithUserData
    });
  } catch (error) {
    console.error('Get item by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving item'
    });
  }
};

// Get new arrivals (items added in the last 15 days)
exports.getNewArrivals = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    // Fixed to 15 days for New Arrivals
    const daysAgo = 15;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysAgo);
    dateThreshold.setHours(0, 0, 0, 0); // Start of day 15 days ago
    
    // Build query for items created within the last 15 days only
    const query = {
      createdAt: { $gte: dateThreshold },
      availableCopies: { $gt: 0 },
      status: 'Available'
    };
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const items = await Item.find(query)
      .populate('categoryId', 'name')
      .populate('subcategoryId', 'name')
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalItems = await Item.countDocuments(query);
    
    // Format items for mobile with proper handling of different item types
    const formattedItems = items.map(item => {
      let subtitle = '';
      
      // Handle different item types
      switch (item.itemType) {
        case 'Book':
          subtitle = item.typeSpecificFields?.author || 'Unknown Author';
          break;
        case 'Shared':
          subtitle = item.typeSpecificFields?.brand 
            ? `${item.typeSpecificFields.brand} ${item.typeSpecificFields.model || ''}`.trim()
            : item.description || 'Shared Item';
          break;
        case 'Toy':
          subtitle = item.typeSpecificFields?.brand 
            ? `${item.typeSpecificFields.brand} - ${item.typeSpecificFields.ageRange || 'All Ages'}`
            : item.typeSpecificFields?.ageRange || 'Educational Toy';
          break;
        case 'Course':
          subtitle = item.typeSpecificFields?.instructor || 'Online Course';
          break;
        default:
          subtitle = item.description || item.itemType;
      }
      
      return {
        _id: item._id,
        title: item.title,
        subtitle: subtitle,
        itemType: item.itemType,
        categoryName: item.categoryId?.name,
        availableCopies: item.availableCopies,
        totalCopies: item.quantity,
        condition: item.condition,
        createdAt: item.createdAt,
        author: item.typeSpecificFields?.author,
        typeSpecificFields: item.typeSpecificFields || {},
        image: item.typeSpecificFields?.image
      };
    });
    
    res.status(200).json({
      success: true,
      count: formattedItems.length,
      total: totalItems,
      totalPages: Math.ceil(totalItems / parseInt(limit)),
      currentPage: parseInt(page),
      daysFilter: daysAgo,
      data: formattedItems
    });
  } catch (error) {
    console.error('Get new arrivals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving new arrivals'
    });
  }
};

// Request an item
exports.requestItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { requestType = 'Borrow', notes, urgency = 'Medium', neededBy } = req.body;
    
    // Check if item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    // Check if user already has a pending/approved request for this item
    const existingRequest = await Request.findOne({
      userId: req.user._id,
      itemId: itemId,
      status: { $in: ['Pending', 'Approved'] }
    });
    
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request for this item'
      });
    }
    
    // Check if user already has this item borrowed
    const existingTransaction = await Transaction.findOne({
      userId: req.user._id,
      itemId: itemId,
      returnDate: null
    });
    
    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: 'You already have this item borrowed'
      });
    }
    
    // Create new request
    const newRequest = new Request({
      userId: req.user._id,
      itemId: itemId,
      requestType: requestType,
      notes: notes,
      urgency: urgency,
      neededBy: neededBy,
      status: 'Pending',
      requestDate: new Date()
    });
    
    await newRequest.save();
    
    res.status(201).json({
      success: true,
      message: 'Request submitted successfully',
      data: newRequest
    });
  } catch (error) {
    console.error('Request item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting request'
    });
  }
};