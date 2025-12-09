const Category = require('../models/category.model');
const Item = require('../models/item.model');

// Get categories with correct item counts for mobile
exports.getCategories = async (req, res) => {
  try {
    // Get all categories and item counts in single aggregation
    const [allCategories, itemCounts] = await Promise.all([
      Category.find().lean(),
      Item.aggregate([
        {
          $group: {
            _id: { $ifNull: ['$subcategoryId', '$categoryId'] },
            totalCount: { $sum: 1 },
            availableCount: { $sum: { $cond: [{ $gt: ['$availableCopies', 0] }, 1, 0] } }
          }
        }
      ])
    ]);
    
    // Create lookup map for item counts
    const countMap = itemCounts.reduce((acc, item) => {
      acc[item._id] = { total: item.totalCount, available: item.availableCount };
      return acc;
    }, {});
    
    // Build hierarchical structure
    const categoriesWithCounts = allCategories.map(category => {
      const subcategories = allCategories.filter(cat => 
        cat.parentCategoryId && cat.parentCategoryId.toString() === category._id.toString()
      );
      
      let totalItemCount = 0;
      let totalAvailableCount = 0;
      
      if (subcategories.length > 0) {
        const subcategoriesWithCounts = subcategories.map(subcat => {
          const counts = countMap[subcat._id.toString()] || { total: 0, available: 0 };
          totalItemCount += counts.total;
          totalAvailableCount += counts.available;
          return {
            _id: subcat._id,
            name: subcat.name,
            description: subcat.description || '',
            itemCount: counts.total,
            availableCount: counts.available
          };
        });
      } else {
        const counts = countMap[category._id.toString()] || { total: 0, available: 0 };
        totalItemCount = counts.total;
        totalAvailableCount = counts.available;
      }
      
      return {
        _id: category._id,
        name: category.name,
        description: category.description || '',
        parentCategoryId: category.parentCategoryId,
        itemCount: totalItemCount,
        availableCount: totalAvailableCount,
        defaultReturnPeriod: category.defaultReturnPeriod
      };
    });
    
    // Return ALL categories (both root and subcategories) for mobile
    // The mobile app will handle the filtering based on parentCategoryId
    res.status(200).json({
      success: true,
      count: categoriesWithCounts.length,
      totalCategories: allCategories.length,
      data: categoriesWithCounts
    });
  } catch (error) {
    console.error('Get mobile categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving categories'
    });
  }
};

// Get category details with items
exports.getCategoryDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get category
    const category = await Category.findById(id).lean();
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Get items in this category or subcategory
    // Items can be assigned to either categoryId or subcategoryId
    const items = await Item.find({ 
      $or: [
        { categoryId: id },
        { subcategoryId: id }
      ]
    })
      .select('title itemType availableCopies typeSpecificFields condition quantity')
      .lean();
    
    
    res.status(200).json({
      success: true,
      data: {
        category,
        items
      }
    });
  } catch (error) {
    console.error('Get category details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving category details'
    });
  }
};