const { getFieldsForItemType, ITEM_TYPE_SCHEMAS } = require('../utils/item-type-schemas');

// Get field schema for a specific item type
exports.getItemTypeSchema = async (req, res) => {
  try {
    const { itemType } = req.params;
    
    const schema = getFieldsForItemType(itemType);
    
    if (!schema || Object.keys(schema).length === 0) {
      return res.status(404).json({
        success: false,
        message: `Schema not found for item type: ${itemType}`
      });
    }

    res.json({
      success: true,
      data: {
        itemType,
        fields: schema
      }
    });
  } catch (error) {
    console.error('Get item type schema error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all available item types and their schemas
exports.getAllItemTypeSchemas = async (req, res) => {
  try {
    res.json({
      success: true,
      data: ITEM_TYPE_SCHEMAS
    });
  } catch (error) {
    console.error('Get all item type schemas error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};