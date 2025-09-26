const express = require('express');
// express-validator removed (migrated to Zod)
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const { authenticateToken } = require('../middleware/auth');
const { parseBody, CreateCategorySchema, UpdateCategorySchema } = require('../middleware/validation');

const router = express.Router();
// Removed restore-defaults; categories are per-user and deletable

// Removed legacy validateCategory; using Zod parseBody

// @route   GET /api/categories
// @desc    Get user's categories (default + custom)
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { type, search } = req.query;

    // Build filter for categories
    let filter = {
      $or: [{ isDefault: true }, { userId }]
    };
    
    // Filter by type if specified
    if (type) {
      filter.type = type;
    }

    // Name search if provided
    if (search && search.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    // Only user's own categories
    const categories = await Category.find({ userId, ...(filter.type && { type: filter.type }), ...(filter.name && { name: filter.name }) }).sort({ name: 1 });

    // Get transaction counts for each category
    const categoryStats = await Transaction.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$category', // category name string
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Add stats to categories
    const categoriesWithStats = categories.map(category => {
      const stats = categoryStats.find(stat => stat._id && stat._id.toString().toLowerCase() === category.name.toLowerCase());
      
      return {
        ...category.toObject(),
        transactionCount: stats?.count || 0,
        totalAmount: stats?.totalAmount || 0
      };
    });

    res.json({
      success: true,
      data: { categories: categoriesWithStats }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

// @route   GET /api/categories/:id
// @desc    Get single category
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    const category = await Category.findOne({
      _id: req.params.id,
      $or: [{ userId }, { isDefault: true }]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get transaction count for this category
    const transactionCount = await Transaction.countDocuments({
      userId,
      category: category._id
    });

    res.json({
      success: true,
      data: { 
        category: {
          ...category.toObject(),
          transactionCount
        }
      }
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category'
    });
  }
});

// @route   POST /api/categories
// @desc    Create custom category
// @access  Private
router.post('/', authenticateToken, parseBody(CreateCategorySchema), async (req, res) => {
  try {
    const { name, color = '#3b82f6', icon = 'tag', type = 'expense' } = req.body;
    const userId = req.userId;

    // Check if category name already exists for this user with same type (allow same name for different type)
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      userId,
      type
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const category = new Category({
      name,
      color,
      icon,
      type,
      userId,
      isDefault: false
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category }
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category'
    });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update custom category
// @access  Private
router.put('/:id', authenticateToken, parseBody(UpdateCategorySchema), async (req, res) => {
  try {
    const { name, color, icon, type } = req.body;
    const userId = req.userId;

    // Find category (must be user's custom category, not default)
    const category = await Category.findOne({
      _id: req.params.id,
      userId,
      isDefault: false
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or cannot be modified'
      });
    }

    // Check if new name conflicts with existing category
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        userId,
        type: type || category.type,
        _id: { $ne: category._id }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(color && { color }),
        ...(icon && { icon }),
        ...(type && { type })
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category: updatedCategory }
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category'
    });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete custom category
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const cat = await Category.findOne({ _id: req.params.id, userId });
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check if category has transactions
    const transactionCount = await Transaction.countDocuments({
      userId,
      category: cat._id
    });

    if (transactionCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing transactions'
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category'
    });
  }
});

module.exports = router;
