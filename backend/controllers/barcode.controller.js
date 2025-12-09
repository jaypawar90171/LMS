const Item = require('../models/item.model');
const ItemCopy = require('../models/itemCopy.model');
const User = require('../models/user.model');
const BarcodeGenerator = require('../utils/barcode-generator');

const generateItemBarcode = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Generate new barcode if not exists
    if (!item.barcode) {
      let barcode;
      let isUnique = false;
      let attempts = 0;
      
      // Ensure unique barcode
      while (!isUnique && attempts < 10) {
        barcode = BarcodeGenerator.generateItemBarcode();
        const existing = await Item.findOne({ barcode });
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }
      
      if (isUnique) {
        item.barcode = barcode;
        await item.save();
      } else {
        return res.status(500).json({ 
          success: false,
          message: 'Failed to generate unique barcode' 
        });
      }
    }

    res.json({ 
      success: true, 
      barcode: item.barcode,
      itemId: item._id,
      title: item.title
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const scanBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    
    // First check if it's a main item barcode
    const item = await Item.findOne({ barcode }).populate([
      { path: 'categoryId' },
      { path: 'subcategoryId' },
      { path: 'createdBy', select: 'fullName' }
    ]);
    
    if (item) {
      const totalCopies = await ItemCopy.countDocuments({ itemId: item._id });
      const availableCopies = await ItemCopy.countDocuments({ 
        itemId: item._id, 
        status: 'Available' 
      });
      const issuedCopies = await ItemCopy.countDocuments({ 
        itemId: item._id, 
        status: 'Issued' 
      });
      
      return res.json({
        success: true,
        type: 'item',
        data: {
          // Item Information
          itemId: item._id,
          title: item.title,
          description: item.description,
          itemType: item.itemType,
          itemBarcode: item.barcode,
          
          // Category Information
          category: item.categoryId?.name || 'Uncategorized',
          subcategory: item.subcategoryId?.name || null,
          
          // Type-Specific Details (Dynamic based on item type)
          typeSpecificFields: item.typeSpecificFields || {},
          
          // Common fields that might exist across types
          brand: item.typeSpecificFields?.brand || null,
          model: item.typeSpecificFields?.model || null,
          manufacturer: item.typeSpecificFields?.manufacturer || null,
          serialNumber: item.typeSpecificFields?.serialNumber || null,
          price: item.typeSpecificFields?.price || null,
          
          // Physical Details
          dimensions: item.physicalDetails?.dimensions || null,
          weight: item.physicalDetails?.weight || null,
          
          // Availability Information
          totalCopies: item.quantity,
          availableCopies: item.availableCopies,
          issuedCopies: item.quantity - item.availableCopies,
          
          // Status Information
          itemStatus: item.status,
          defaultReturnPeriod: item.defaultReturnPeriod,
          
          // Additional Information
          tags: item.tags || [],
          notes: item.notes || null,
          createdBy: item.createdBy?.fullName || 'System',
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        }
      });
    }
    
    // Check if it's an item copy barcode (most common)
    const itemCopy = await ItemCopy.findOne({ barcode }).populate({
      path: 'itemId',
      populate: [
        { path: 'categoryId' },
        { path: 'subcategoryId' },
        { path: 'createdBy', select: 'fullName' }
      ]
    });
    if (itemCopy) {
      const item = itemCopy.itemId;
      const totalCopies = await ItemCopy.countDocuments({ itemId: item._id });
      const availableCopies = await ItemCopy.countDocuments({ 
        itemId: item._id, 
        status: 'Available' 
      });
      const issuedCopies = await ItemCopy.countDocuments({ 
        itemId: item._id, 
        status: 'Issued' 
      });
      
      return res.json({
        success: true,
        type: 'copy',
        data: {
          // Copy Information
          copyId: itemCopy._id,
          copyNumber: itemCopy.copyNumber,
          copyBarcode: itemCopy.barcode,
          copyStatus: itemCopy.status,
          copyCondition: itemCopy.condition,
          acquisitionDate: itemCopy.acquisitionDate,
          
          // Item Information
          itemId: item._id,
          title: item.title,
          description: item.description,
          itemType: item.itemType,
          itemBarcode: item.barcode,
          
          // Category Information
          category: item.categoryId?.name || 'Uncategorized',
          subcategory: item.subcategoryId?.name || null,
          
          // Type-Specific Details (Dynamic based on item type)
          typeSpecificFields: item.typeSpecificFields || {},
          
          // Common fields that might exist across types
          brand: item.typeSpecificFields?.brand || null,
          model: item.typeSpecificFields?.model || null,
          manufacturer: item.typeSpecificFields?.manufacturer || null,
          serialNumber: item.typeSpecificFields?.serialNumber || null,
          price: item.typeSpecificFields?.price || null,
          
          // Physical Details
          dimensions: item.physicalDetails?.dimensions || null,
          weight: item.physicalDetails?.weight || null,
          
          // Availability Information
          totalCopies,
          availableCopies,
          issuedCopies,
          
          // Status Information
          itemStatus: item.status,
          defaultReturnPeriod: item.defaultReturnPeriod,
          
          // Additional Information
          tags: item.tags || [],
          notes: item.notes || null,
          createdBy: item.createdBy?.fullName || 'System',
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        }
      });
    }

    // Check if it's a user barcode
    const user = await User.findOne({ barcode });
    if (user) {
      return res.json({
        success: true,
        type: 'user',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          barcode: user.barcode,
          status: user.status
        }
      });
    }

    res.status(404).json({ 
      success: false, 
      message: 'Barcode not found' 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const bulkGenerateBarcodes = async (req, res) => {
  try {
    const itemsWithoutBarcodes = await Item.find({ 
      $or: [{ barcode: { $exists: false } }, { barcode: '' }, { barcode: null }] 
    });

    if (itemsWithoutBarcodes.length === 0) {
      return res.json({
        success: true,
        message: 'All items already have barcodes',
        count: 0
      });
    }

    const updates = [];
    for (const item of itemsWithoutBarcodes) {
      item.barcode = BarcodeGenerator.generateItemBarcode();
      updates.push(item.save());
    }

    await Promise.all(updates);

    res.json({
      success: true,
      message: `Generated barcodes for ${updates.length} items`,
      count: updates.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

module.exports = {
  generateItemBarcode,
  scanBarcode,
  bulkGenerateBarcodes
};