const Donation = require('../models/donation.model');
const User = require('../models/user.model');
const Item = require('../models/item.model');

// Get all donations with filtering
exports.getDonations = async (req, res) => {
  try {
    const { 
      status, 
      fromDate, 
      toDate, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    // Build query
    const query = {};
    
    // Add status filter with validation
    if (status) {
      const validStatuses = ['Pending', 'Accepted', 'Rejected', 'Received', 'Processed'];
      if (validStatuses.includes(status)) {
        query.status = status;
      }
    }
    
    // Add date range filter
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        const fromDateObj = new Date(fromDate);
        if (isNaN(fromDateObj.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid fromDate format' });
        }
        query.createdAt.$gte = fromDateObj;
      }
      if (toDate) {
        const toDateObj = new Date(toDate);
        if (isNaN(toDateObj.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid toDate format' });
        }
        query.createdAt.$lte = toDateObj;
      }
    }
    
    // Calculate pagination with validation
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;
    
    // Execute all queries in parallel
    const [donations, totalDonations, statusCounts] = await Promise.all([
      Donation.find(query)
        .populate('userId', 'fullName email phoneNumber')
        .populate('reviewedBy', 'fullName')
        .populate('processedItemId', 'title barcode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Donation.countDocuments(query),
      Donation.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);
    
    const counts = {};
    statusCounts.forEach(item => {
      counts[item._id] = item.count;
    });
    
    res.status(200).json({
      success: true,
      count: donations.length,
      total: totalDonations,
      totalPages: Math.ceil(totalDonations / parseInt(limit)),
      currentPage: parseInt(page),
      statusCounts: counts,
      data: donations
    });
  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving donations'
    });
  }
};

// Get donation by ID
exports.getDonationById = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.donationId)
      .populate('userId', 'fullName email phoneNumber')
      .populate('reviewedBy', 'fullName')
      .populate('processedItemId', 'title barcode');
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: donation
    });
  } catch (error) {
    console.error('Get donation by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving donation'
    });
  }
};

// Update donation status
exports.updateDonationStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    // Validate status
    const validStatuses = ['Pending', 'Accepted', 'Rejected', 'Received', 'Processed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    // Find donation
    const donation = await Donation.findById(req.params.donationId)
      .populate('userId', 'fullName email');
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }
    
    // Check if status transition is valid
    const validTransitions = {
      'Pending': ['Accepted', 'Rejected'],
      'Accepted': ['Received', 'Rejected'],
      'Received': ['Processed'],
      'Rejected': [],
      'Processed': []
    };
    
    if (!validTransitions[donation.status].includes(status) && status !== donation.status) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${donation.status} to ${status}`
      });
    }
    
    // Update donation
    donation.status = status;
    
    if (notes) {
      donation.notes = notes;
    }
    
    donation.reviewedBy = req.user._id;
    donation.reviewDate = new Date();
    
    if (status === 'Received') {
      donation.receivedDate = new Date();
    }
    
    await donation.save();
    
    res.status(200).json({
      success: true,
      message: `Donation status updated to ${status}`,
      data: donation
    });
  } catch (error) {
    console.error('Update donation status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating donation status'
    });
  }
};

// Process donation into inventory
exports.processDonation = async (req, res) => {
  try {
    const { 
      title, 
      author, 
      isbn, 
      description, 
      publisher, 
      publicationYear, 
      price, 
      categoryId, 
      subcategoryId 
    } = req.body;
    
    // Find donation
    const donation = await Donation.findById(req.params.donationId);
    
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }
    
    // Check if donation is in received status
    if (donation.status !== 'Received') {
      return res.status(400).json({
        success: false,
        message: 'Donation must be in Received status to process'
      });
    }
    
    // Create inventory item from donation
    const item = await Item.create({
      title: title || donation.itemName,
      author,
      isbn,
      description: description || donation.description,
      publisher,
      publicationYear,
      price: price || 0,
      quantity: 1,
      availableCopies: 1,
      categoryId,
      subcategoryId,
      itemType: 'Book', // Default to Book, can be changed based on requirements
      status: 'Donation Pending',
      barcode: `DON-${Date.now().toString().slice(-8)}`,
      defaultReturnPeriod: 14, // Default return period
      createdBy: req.user._id
    });
    
    // Update donation
    donation.status = 'Processed';
    donation.processedItemId = item._id;
    donation.reviewedBy = req.user._id;
    donation.reviewDate = new Date();
    
    await donation.save();
    
    res.status(200).json({
      success: true,
      message: 'Donation processed successfully',
      data: {
        donation,
        item
      }
    });
  } catch (error) {
    console.error('Process donation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing donation'
    });
  }
};

// Create donation (for mobile app)
exports.createDonation = async (req, res) => {
  try {
    const { itemName, description, condition, availableDate, photos } = req.body;
    
    // Create donation
    const donation = await Donation.create({
      userId: req.user._id,
      itemName,
      description,
      condition,
      availableDate: availableDate ? new Date(availableDate) : new Date(),
      status: 'Pending',
      photos
    });
    
    res.status(201).json({
      success: true,
      message: 'Donation offer created successfully',
      data: donation
    });
  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating donation offer'
    });
  }
};

// Get user's donations (for mobile app)
exports.getUserDonations = async (req, res) => {
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
    
    // Execute query and count in parallel
    const [donations, totalDonations] = await Promise.all([
      Donation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Donation.countDocuments(query)
    ]);
    
    res.status(200).json({
      success: true,
      count: donations.length,
      total: totalDonations,
      totalPages: Math.ceil(totalDonations / parseInt(limit)),
      currentPage: parseInt(page),
      data: donations
    });
  } catch (error) {
    console.error('Get user donations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving donations'
    });
  }
};