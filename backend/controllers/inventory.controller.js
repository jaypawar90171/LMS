const Item = require('../models/item.model');
const ItemCopy = require('../models/itemCopy.model');
const Category = require('../models/category.model');
const Transaction = require('../models/transaction.model');
const crypto = require('crypto');
const { ActivityLogger } = require('../utils/activity-logger');
const NotificationHelper = require('../services/notification-helper.service');
const BarcodeGenerator = require('../utils/barcode-generator');

// Generate a unique barcode (legacy function - use BarcodeGenerator instead)
const generateBarcode = () => {
  return BarcodeGenerator.generateItemBarcode();
};

// Get all inventory items with filtering, sorting, and pagination
exports.getInventoryItems = async (req, res) => {
  try {
    const { 
      itemType, 
      search, 
      category, 
      subcategory, 
      status, 
      page = 1, 
      limit = 10, 
      sortBy = 'title', 
      sortOrder = 'asc' 
    } = req.query;
    
    // Build query
    const query = {};
    
    // Add itemType filter
    if (itemType) {
      query.itemType = itemType;
    }
    
    // Add search filter - use regex for more flexible search
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } },
        { 'typeSpecificFields.author': searchRegex },
        { 'typeSpecificFields.isbn': searchRegex },
        { 'typeSpecificFields.publisher': searchRegex },
        { 'typeSpecificFields.brand': searchRegex },
        { 'typeSpecificFields.model': searchRegex },
        { barcode: searchRegex }
      ];
    }
    
    // Add category filter
    if (category) {
      query.categoryId = category;
    }
    
    // Add subcategory filter
    if (subcategory) {
      query.subcategoryId = subcategory;
    }
    
    // Add status filter
    if (status) {
      query.status = status;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Determine sort order
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination and sorting
    const items = await Item.find(query)
      .populate('categoryId', 'name')
      .populate('subcategoryId', 'name')
      .populate('createdBy', 'fullName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalItems = await Item.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: items.length,
      total: totalItems,
      totalPages: Math.ceil(totalItems / parseInt(limit)),
      currentPage: parseInt(page),
      data: items
    });
  } catch (error) {
    console.error('Get inventory items error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving inventory items'
    });
  }
};

// Get inventory item by ID
exports.getInventoryItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId)
      .populate('categoryId', 'name description')
      .populate('subcategoryId', 'name description')
      .populate('createdBy', 'fullName')
      .populate('updatedBy', 'fullName');
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    // Get copies count
    const copiesCount = await ItemCopy.countDocuments({ itemId: item._id });
    const availableCopiesCount = await ItemCopy.countDocuments({ 
      itemId: item._id,
      status: 'Available'
    });
    
    res.status(200).json({
      success: true,
      data: {
        ...item.toObject(),
        copiesCount,
        availableCopiesCount
      }
    });
  } catch (error) {
    console.error('Get inventory item by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving inventory item'
    });
  }
};

// Create new inventory item
exports.createInventoryItem = async (req, res) => {
  try {
    const {
      title,
      description,
      typeSpecificFields,
      quantity,
      categoryId,
      subcategoryId,
      tags,
      defaultReturnPeriod,
      physicalDetails,
      acquisitionDetails,
      notes,
      barcode: providedBarcode
    } = req.body;
    
    // Validate category
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }
    
    // Validate subcategory if provided
    if (subcategoryId) {
      const subcategory = await Category.findById(subcategoryId);
      if (!subcategory || subcategory.parentCategoryId.toString() !== categoryId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid subcategory or subcategory does not belong to the specified category'
        });
      }
    }
    
    // Generate or use provided barcode
    const barcode = providedBarcode || generateBarcode();
    
    // Check if barcode already exists
    const barcodeExists = await Item.findOne({ barcode });
    if (barcodeExists) {
      return res.status(409).json({
        success: false,
        message: 'Barcode already exists'
      });
    }
    
    // Create item
    const item = await Item.create({
      title,
      description,
      typeSpecificFields: typeSpecificFields || {},
      quantity,
      availableCopies: quantity,
      categoryId,
      subcategoryId,
      tags: tags || [],
      defaultReturnPeriod: defaultReturnPeriod || category.defaultReturnPeriod || 14,
      physicalDetails: physicalDetails || {},
      acquisitionDetails: acquisitionDetails || {},
      notes,
      barcode,
      status: 'Available',
      createdBy: req.user._id
    });
    
    // Log activity
    await ActivityLogger.itemCreate(req.user._id, item._id, item.title);
    
    // Send notification about new item
    await NotificationHelper.notifyItemAdded(item, req.user);
    
    // Create copies
    const copies = [];
    for (let i = 1; i <= quantity; i++) {
      const copyBarcode = `${barcode}-${i.toString().padStart(3, '0')}`;
      const copy = await ItemCopy.create({
        itemId: item._id,
        copyNumber: i,
        barcode: copyBarcode,
        status: 'Available',
        condition: 'New',
        acquisitionDate: new Date(),
        createdBy: req.user._id
      });
      copies.push(copy);
    }
    
    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: {
        item,
        copies
      }
    });
  } catch (error) {
    console.error('Create inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating inventory item'
    });
  }
};

// Update inventory item
exports.updateInventoryItem = async (req, res) => {
  try {
    const {
      title,
      description,
      typeSpecificFields,
      categoryId,
      subcategoryId,
      tags,
      defaultReturnPeriod,
      physicalDetails,
      acquisitionDetails,
      notes
    } = req.body;
    
    // Find item
    const item = await Item.findById(req.params.itemId);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    // Validate category if changed
    if (categoryId && categoryId.toString() !== item.categoryId.toString()) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }
      
      // Reset subcategory if category changes
      item.subcategoryId = null;
    }
    
    // Validate subcategory if provided
    if (subcategoryId) {
      const subcategory = await Category.findById(subcategoryId);
      const targetCategoryId = categoryId || item.categoryId;
      if (!subcategory || subcategory.parentCategoryId.toString() !== targetCategoryId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid subcategory or subcategory does not belong to the specified category'
        });
      }
    }
    
    // Update item
    item.title = title || item.title;
    item.description = description !== undefined ? description : item.description;
    item.typeSpecificFields = typeSpecificFields !== undefined ? typeSpecificFields : item.typeSpecificFields;
    item.categoryId = categoryId || item.categoryId;
    item.subcategoryId = subcategoryId !== undefined ? subcategoryId : item.subcategoryId;
    item.tags = tags !== undefined ? tags : item.tags;
    item.defaultReturnPeriod = defaultReturnPeriod || item.defaultReturnPeriod;
    item.physicalDetails = physicalDetails !== undefined ? physicalDetails : item.physicalDetails;
    item.acquisitionDetails = acquisitionDetails !== undefined ? acquisitionDetails : item.acquisitionDetails;
    item.notes = notes !== undefined ? notes : item.notes;
    item.updatedBy = req.user._id;
    
    await item.save();
    
    // Log activity
    await ActivityLogger.itemUpdate(req.user._id, item._id, item.title);
    
    // Send notification about item update
    await NotificationHelper.notifyItemUpdated(item, req.user);
    
    res.status(200).json({
      success: true,
      message: 'Inventory item updated successfully',
      data: item
    });
  } catch (error) {
    console.error('Update inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating inventory item'
    });
  }
};

// Delete inventory item
exports.deleteInventoryItem = async (req, res) => {
  try {
    // Find item
    const item = await Item.findById(req.params.itemId);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    // Check if any copies are currently issued
    const issuedCopies = await ItemCopy.countDocuments({
      itemId: item._id,
      status: 'Issued'
    });
    
    if (issuedCopies > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete item. ${issuedCopies} copies are currently issued.`
      });
    }
    
    // Check if item is in any active queue
    const inQueue = await Transaction.countDocuments({
      itemId: item._id,
      status: 'Pending'
    });
    
    if (inQueue > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete item. It is in ${inQueue} active queues.`
      });
    }
    
    // Delete all copies
    await ItemCopy.deleteMany({ itemId: item._id });
    
    // Log activity
    await ActivityLogger.itemDelete(req.user._id, item.title);
    
    // Send notification about item removal
    await NotificationHelper.notifyItemRemoved(item, req.user);
    
    // Delete item
    await item.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Inventory item and all copies deleted successfully'
    });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting inventory item'
    });
  }
};

// Update inventory item status
exports.updateItemStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    // Validate status
    const validStatuses = ['Available', 'Misplaced', 'Under Repair', 'Lost', 'Donation Pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    // Find item
    const item = await Item.findById(req.params.itemId);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    // Update item status
    item.status = status;
    item.updatedBy = req.user._id;
    
    await item.save();
    
    // Update all available copies to match the new status
    if (status === 'Misplaced' || status === 'Under Repair' || status === 'Lost') {
      await ItemCopy.updateMany(
        { itemId: item._id, status: 'Available' },
        { status, notes: reason || `Status changed to ${status}`, updatedBy: req.user._id }
      );
    } else if (status === 'Available') {
      // Only update copies that are not issued
      await ItemCopy.updateMany(
        { itemId: item._id, status: { $ne: 'Issued' } },
        { status, notes: reason || 'Status changed to Available', updatedBy: req.user._id }
      );
    }
    
    res.status(200).json({
      success: true,
      message: `Inventory item status updated to ${status} successfully`,
      data: {
        id: item._id,
        title: item.title,
        status: item.status
      }
    });
  } catch (error) {
    console.error('Update item status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating inventory item status'
    });
  }
};

// Get all copies of an item
exports.getItemCopies = async (req, res) => {
  try {
    // Find item
    const item = await Item.findById(req.params.itemId);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    // Get copies
    const copies = await ItemCopy.find({ itemId: item._id })
      .sort({ copyNumber: 1 });
    
    res.status(200).json({
      success: true,
      data: copies
    });
  } catch (error) {
    console.error('Get item copies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving item copies'
    });
  }
};

// Generate copies for an item
exports.generateItemCopies = async (req, res) => {
  try {
    const { quantity = 1 } = req.body;
    
    // Find item
    const item = await Item.findById(req.params.itemId);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    // Get current highest copy number
    const highestCopy = await ItemCopy.findOne({ itemId: item._id })
      .sort({ copyNumber: -1 });
    
    let startCopyNumber = 1;
    if (highestCopy) {
      startCopyNumber = highestCopy.copyNumber + 1;
    }
    
    // Create new copies
    const newCopies = [];
    for (let i = 0; i < quantity; i++) {
      const copyNumber = startCopyNumber + i;
      const copyBarcode = `${item.barcode}-${copyNumber.toString().padStart(3, '0')}`;
      
      const copy = await ItemCopy.create({
        itemId: item._id,
        copyNumber,
        barcode: copyBarcode,
        status: 'Available',
        condition: 'New',
        acquisitionDate: new Date(),
        createdBy: req.user._id
      });
      
      newCopies.push(copy);
    }
    
    // Update item quantity and available copies
    item.quantity += quantity;
    item.availableCopies += quantity;
    item.updatedBy = req.user._id;
    
    await item.save();
    
    res.status(200).json({
      success: true,
      message: `Generated ${quantity} copies successfully`,
      data: newCopies
    });
  } catch (error) {
    console.error('Generate item copies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating item copies'
    });
  }
};

// Add copies to an item (alias for generateItemCopies)
exports.addItemCopies = async (req, res) => {
  try {
    const { quantity, condition = 'New' } = req.body;
    
    // Validate quantity
    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }
    
    // Validate condition
    const validConditions = ['New', 'Good', 'Fair', 'Poor', 'Damaged'];
    if (!validConditions.includes(condition)) {
      return res.status(400).json({
        success: false,
        message: `Invalid condition. Must be one of: ${validConditions.join(', ')}`
      });
    }
    
    // Find item
    const item = await Item.findById(req.params.itemId);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    // Get current highest copy number
    const highestCopy = await ItemCopy.findOne({ itemId: item._id })
      .sort({ copyNumber: -1 });
    
    let startCopyNumber = 1;
    if (highestCopy) {
      startCopyNumber = highestCopy.copyNumber + 1;
    }
    
    // Create new copies
    const newCopies = [];
    for (let i = 0; i < quantity; i++) {
      const copyNumber = startCopyNumber + i;
      const copyBarcode = `${item.barcode}-${copyNumber.toString().padStart(3, '0')}`;
      
      const copy = await ItemCopy.create({
        itemId: item._id,
        copyNumber,
        barcode: copyBarcode,
        status: 'Available',
        condition,
        acquisitionDate: new Date(),
        createdBy: req.user._id
      });
      
      newCopies.push(copy);
    }
    
    // Update item quantity and available copies
    item.quantity += quantity;
    item.availableCopies += quantity;
    item.updatedBy = req.user._id;
    
    await item.save();
    
    res.status(200).json({
      success: true,
      message: `${quantity} copies added successfully`,
      data: {
        item: {
          id: item._id,
          title: item.title,
          quantity: item.quantity,
          availableCopies: item.availableCopies
        },
        newCopies
      }
    });
  } catch (error) {
    console.error('Add item copies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding item copies'
    });
  }
};

// Update copy status
exports.updateCopyStatus = async (req, res) => {
  try {
    const { status, condition, notes } = req.body;
    
    // Validate status
    const validStatuses = ['Available', 'Issued', 'Misplaced', 'Under Repair', 'Lost'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    // Validate condition if provided
    if (condition) {
      const validConditions = ['New', 'Good', 'Fair', 'Poor', 'Damaged'];
      if (!validConditions.includes(condition)) {
        return res.status(400).json({
          success: false,
          message: `Invalid condition. Must be one of: ${validConditions.join(', ')}`
        });
      }
    }
    
    // Find item
    const item = await Item.findById(req.params.itemId);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    // Find copy
    const copy = await ItemCopy.findOne({
      itemId: item._id,
      _id: req.params.copyId
    });
    
    if (!copy) {
      return res.status(404).json({
        success: false,
        message: 'Copy not found'
      });
    }
    
    // Update available copies count if status changes
    if (copy.status !== status) {
      if (copy.status === 'Available' && status !== 'Available') {
        item.availableCopies = Math.max(0, item.availableCopies - 1);
      } else if (copy.status !== 'Available' && status === 'Available') {
        item.availableCopies += 1;
      }
      
      await item.save();
    }
    
    // Update copy
    copy.status = status;
    if (condition) {
      copy.condition = condition;
    }
    if (notes) {
      copy.notes = notes;
    }
    copy.updatedBy = req.user._id;
    
    await copy.save();
    
    res.status(200).json({
      success: true,
      message: 'Copy updated successfully',
      data: copy
    });
  } catch (error) {
    console.error('Update copy status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating copy status'
    });
  }
};

// Get barcode information
exports.getBarcodeInfo = async (req, res) => {
  try {
    // Find item
    const item = await Item.findById(req.params.itemId);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        itemBarcode: item.barcode,
        title: item.title,
        itemType: item.itemType,
        copies: await ItemCopy.find({ itemId: item._id }).select('barcode copyNumber status')
      }
    });
  } catch (error) {
    console.error('Get barcode info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving barcode information'
    });
  }
};

// Generate new barcode
exports.generateBarcode = async (req, res) => {
  try {
    const { format } = req.body;
    
    // Find item
    const item = await Item.findById(req.params.itemId);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    // Generate new barcode
    const newBarcode = generateBarcode();
    
    // Update item barcode
    item.barcode = newBarcode;
    item.updatedBy = req.user._id;
    
    await item.save();
    
    // Update copy barcodes
    const copies = await ItemCopy.find({ itemId: item._id });
    
    for (const copy of copies) {
      copy.barcode = `${newBarcode}-${copy.copyNumber.toString().padStart(3, '0')}`;
      copy.updatedBy = req.user._id;
      await copy.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Barcode generated successfully',
      data: {
        itemBarcode: newBarcode,
        format: format || 'CODE128',
        copies: copies.map(copy => ({
          id: copy._id,
          copyNumber: copy.copyNumber,
          barcode: copy.barcode
        }))
      }
    });
  } catch (error) {
    console.error('Generate barcode error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating barcode'
    });
  }
};

// Print barcode
exports.printBarcode = async (req, res) => {
  try {
    const { format = 'CODE128' } = req.query;
    
    // Find item
    const item = await Item.findById(req.params.itemId);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }
    
    // Get copies
    const copies = await ItemCopy.find({ itemId: item._id });
    
    // Generate barcode data
    const barcodeData = {
      item: {
        id: item._id,
        title: item.title,
        barcode: item.barcode,
        format
      },
      copies: copies.map(copy => ({
        id: copy._id,
        copyNumber: copy.copyNumber,
        barcode: copy.barcode
      }))
    };
    
    res.status(200).json({
      success: true,
      data: barcodeData
    });
  } catch (error) {
    console.error('Print barcode error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating printable barcode'
    });
  }
};