const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  categoryIdValidation,
  createCategoryValidation,
  updateCategoryValidation
} = require('../middleware/category.validation');
const csrf = require('csurf');

// CSRF protection for state-changing operations
const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } });

// Get all categories
router.get(
  '/inventory/categories',
  protect,
  authorize('canViewCategory'),
  categoryController.getCategories
);

// Get category by ID
router.get(
  '/inventory/categories/:categoryId',
  protect,
  authorize('canViewCategory'),
  categoryIdValidation,
  categoryController.getCategoryById
);

// Create new category
router.post(
  '/inventory/categories',
  protect,
  // authorize('canCreateCategory'),
  // csrfProtection,
  createCategoryValidation,
  categoryController.createCategory
);

// Update category
router.put(
  '/inventory/categories/:categoryId',
  protect,
  authorize('canEditCategory'),
  csrfProtection,
  updateCategoryValidation,
  categoryController.updateCategory
);

// Delete category
router.delete(
  '/inventory/categories/:categoryId',
  protect,
  authorize('canDeleteCategory'),
  csrfProtection,
  categoryIdValidation,
  categoryController.deleteCategory
);

module.exports = router;