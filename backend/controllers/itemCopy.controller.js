const ItemCopy = require('../models/itemCopy.model');
const Item = require('../models/item.model');
const BarcodeGenerator = require('../utils/barcode-generator');

// Generate copies for an item
const generateCopies = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity = 1 } = req.body;
    
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const existingCopies = await ItemCopy.countDocuments({ itemId });
    const copies = [];

    for (let i = 1; i <= quantity; i++) {
      const copyNumber = existingCopies + i;
      const barcode = BarcodeGenerator.generateItemBarcode(`CP${copyNumber}`);
      
      const copy = new ItemCopy({
        itemId,
        copyNumber,
        barcode,
        status: 'Available',
        condition: 'New',
        createdBy: req.user._id
      });

      copies.push(copy);
    }

    await ItemCopy.insertMany(copies);

    // Update item's available copies count
    const totalCopies = await ItemCopy.countDocuments({ itemId });
    const availableCopies = await ItemCopy.countDocuments({ 
      itemId, 
      status: 'Available' 
    });

    await Item.findByIdAndUpdate(itemId, {
      quantity: totalCopies,
      availableCopies
    });

    res.json({
      success: true,
      message: `Generated ${quantity} copies`,
      copies: copies.map(c => ({
        copyId: c._id,
        copyNumber: c.copyNumber,
        barcode: c.barcode
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all copies of an item
const getItemCopies = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    // Check if item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: 'Item not found' 
      });
    }
    
    const copies = await ItemCopy.find({ itemId })
      .populate('itemId', 'title')
      .sort({ copyNumber: 1 });

    res.json({
      success: true,
      data: copies || [],
      count: copies.length,
      item: {
        id: item._id,
        title: item.title
      }
    });
  } catch (error) {
    console.error('Get item copies error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

module.exports = {
  generateCopies,
  getItemCopies
};