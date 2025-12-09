const Category = require('../models/category.model');
const Item = require('../models/item.model');
const NotificationHelper = require('../services/notification-helper.service');

// Get all categories in hierarchical structure
exports.getCategories = async (req, res) => {
  try {
    // Get all categories with parent populated
    const categories = await Category.find().populate('parentCategoryId', 'name');
    
    // Return flat list with parent info for easier frontend handling
    const categoriesWithHierarchy = categories.map(category => ({
      _id: category._id,
      name: category.name,
      description: category.description,
      parentCategoryId: category.parentCategoryId?._id || null,
      parentCategory: category.parentCategoryId ? {
        _id: category.parentCategoryId._id,
        name: category.parentCategoryId.name
      } : null,
      defaultReturnPeriod: category.defaultReturnPeriod,
      isActive: true, // Add this field
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }));
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categoriesWithHierarchy
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving categories'
    });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Get parent category if exists
    let parentCategory = null;
    if (category.parentCategoryId) {
      parentCategory = await Category.findById(category.parentCategoryId);
    }
    
    // Get subcategories
    const subcategories = await Category.find({ parentCategoryId: category._id });
    
    // Get item count in this category
    const itemCount = await Item.countDocuments({ 
      $or: [
        { categoryId: category._id },
        { subcategoryId: category._id }
      ]
    });
    
    res.status(200).json({
      success: true,
      data: {
        id: category._id,
        name: category.name,
        description: category.description,
        defaultReturnPeriod: category.defaultReturnPeriod,
        parent: parentCategory ? {
          id: parentCategory._id,
          name: parentCategory.name
        } : null,
        subcategories: subcategories.map(sub => ({
          id: sub._id,
          name: sub.name
        })),
        itemCount
      }
    });
  } catch (error) {
    console.error('Get category by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving category'
    });
  }
};

// Create new category
exports.createCategory = async (req, res) => {
  try {
    const { name, description, parentCategoryId, defaultReturnPeriod } = req.body;
    
    // Check if parent category exists if provided
    if (parentCategoryId) {
      const parentCategory = await Category.findById(parentCategoryId);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
      }
      
      // Check if parent already has a subcategory with the same name
      const existingSubcategory = await Category.findOne({
        name,
        parentCategoryId
      });
      
      if (existingSubcategory) {
        return res.status(409).json({
          success: false,
          message: 'A subcategory with this name already exists under the specified parent category'
        });
      }
    } else {
      // Check if root category with same name exists
      const existingCategory = await Category.findOne({
        name,
        parentCategoryId: null
      });
      
      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message: 'A category with this name already exists'
        });
      }
    }
    
    // Create category
    const category = await Category.create({
      name,
      description,
      parentCategoryId: parentCategoryId || null,
      defaultReturnPeriod: defaultReturnPeriod || 14,
      createdBy: req.user._id
    });
    
    // Send notification about new category/subcategory
    if (parentCategoryId) {
      const parentCategory = await Category.findById(parentCategoryId);
      await NotificationHelper.notifySubcategoryAdded(category, parentCategory, req.user);
    } else {
      await NotificationHelper.notifyCategoryAdded(category, req.user);
    }
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category'
    });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, defaultReturnPeriod } = req.body;
    
    // Find category
    const category = await Category.findById(req.params.categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if name is being changed and if it would conflict
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        name,
        parentCategoryId: category.parentCategoryId
      });
      
      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message: category.parentCategoryId 
            ? 'A subcategory with this name already exists under the same parent category'
            : 'A category with this name already exists'
        });
      }
    }
    
    // Update category
    category.name = name || category.name;
    category.description = description !== undefined ? description : category.description;
    category.defaultReturnPeriod = defaultReturnPeriod || category.defaultReturnPeriod;
    category.updatedBy = req.user._id;
    
    await category.save();
    
    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating category'
    });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    // Find category
    const category = await Category.findById(req.params.categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if category has subcategories
    const hasSubcategories = await Category.countDocuments({ parentCategoryId: category._id });
    
    if (hasSubcategories > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete category. It has ${hasSubcategories} subcategories.`
      });
    }
    
    // Check if category has items
    const hasItems = await Item.countDocuments({ 
      $or: [
        { categoryId: category._id },
        { subcategoryId: category._id }
      ]
    });
    
    if (hasItems > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete category. It has ${hasItems} items assigned to it.`
      });
    }
    
    // Delete category
    await category.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting category'
    });
  }
};