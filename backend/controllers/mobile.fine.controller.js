const Fine = require('../models/fine.model');

// Get user's fines
exports.getUserFines = async (req, res) => {
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
    const fines = await Fine.find(query)
      .populate('itemId', 'title barcode')
      .populate('transactionId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalFines = await Fine.countDocuments(query);
    
    // Calculate summary statistics
    const allUserFines = await Fine.find({ userId: req.user._id });
    
    const totalAmount = allUserFines.reduce((sum, fine) => sum + fine.amount, 0);
    
    const paidAmount = allUserFines.reduce((sum, fine) => {
      if (fine.status === 'Paid') {
        return sum + fine.amount;
      } else if (fine.status === 'Partial Paid') {
        return sum + fine.payments.reduce((pSum, payment) => pSum + payment.amount, 0);
      }
      return sum;
    }, 0);
    
    const waivedAmount = allUserFines.reduce((sum, fine) => 
      fine.status === 'Waived' ? sum + fine.amount : sum, 0
    );
    
    const outstandingAmount = totalAmount - paidAmount - waivedAmount;
    
    res.status(200).json({
      success: true,
      count: fines.length,
      total: totalFines,
      totalPages: Math.ceil(totalFines / parseInt(limit)),
      currentPage: parseInt(page),
      summary: {
        totalAmount,
        paidAmount,
        waivedAmount,
        outstandingAmount
      },
      data: fines
    });
  } catch (error) {
    console.error('Get user fines error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving fines'
    });
  }
};