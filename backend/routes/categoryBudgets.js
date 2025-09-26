const express = require('express');
const router = express.Router();
const CategoryBudget = require('../models/CategoryBudget');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all budgets for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const budgets = await CategoryBudget.find({ 
      userId: req.userId,
      isActive: true 
    }).populate('categoryId', 'name type color icon');

    // Calculate spent amounts for each budget
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);

        const spentAmount = await Transaction.aggregate([
          {
            $match: {
              userId: req.userId,
              category: budget.categoryName,
              type: 'expense',
              date: { $gte: startOfMonth, $lte: endOfMonth }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);

        const spent = spentAmount.length > 0 ? spentAmount[0].total : 0;
        const percentageUsed = (spent / budget.budgetAmount) * 100;
        const isExceeded = spent >= budget.budgetAmount;
        const isNearThreshold = spent >= (budget.budgetAmount * budget.alertThreshold / 100);

        return {
          ...budget.toObject(),
          spentAmount: spent,
          remainingAmount: budget.budgetAmount - spent,
          percentageUsed: Math.round(percentageUsed * 100) / 100,
          isExceeded,
          isNearThreshold
        };
      })
    );

    res.json({
      success: true,
      data: { budgets: budgetsWithSpent }
    });
  } catch (error) {
    console.error('Error fetching category budgets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category budgets'
    });
  }
});

// Create or update a category budget
router.post('/', authenticateToken, [
  body('categoryId').isMongoId().withMessage('Valid category ID is required'),
  body('budgetAmount').isNumeric().isFloat({ min: 0 }).withMessage('Budget amount must be a positive number'),
  body('period').optional().isIn(['monthly', 'weekly', 'yearly']).withMessage('Period must be monthly, weekly, or yearly'),
  body('alertThreshold').optional().isInt({ min: 0, max: 100 }).withMessage('Alert threshold must be between 0 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { categoryId, budgetAmount, period = 'monthly', alertThreshold = 80 } = req.body;

    // Verify category exists and belongs to user
    const category = await Category.findOne({
      _id: categoryId,
      userId: req.userId
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Create or update budget
    const budget = await CategoryBudget.findOneAndUpdate(
      { userId: req.userId, categoryId },
      {
        userId: req.userId,
        categoryId,
        categoryName: category.name,
        budgetAmount: parseFloat(budgetAmount),
        period,
        alertThreshold: parseInt(alertThreshold),
        isActive: true
      },
      { upsert: true, new: true }
    ).populate('categoryId', 'name type color icon');

    res.json({
      success: true,
      message: 'Budget created/updated successfully',
      data: { budget }
    });
  } catch (error) {
    console.error('Error creating/updating category budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create/update category budget'
    });
  }
});

// Delete a category budget
router.delete('/:budgetId', authenticateToken, async (req, res) => {
  try {
    const { budgetId } = req.params;

    const budget = await CategoryBudget.findOneAndDelete({
      _id: budgetId,
      userId: req.userId
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category budget'
    });
  }
});

// Check for budget alerts (called when transactions are added)
router.post('/check-alerts', authenticateToken, async (req, res) => {
  try {
    const { categoryName, amount } = req.body;

    if (!categoryName || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Category name and amount are required'
      });
    }

    // Get current month's spent amount for this category
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const spentAmount = await Transaction.aggregate([
      {
        $match: {
          userId: req.userId,
          category: categoryName,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalSpent = spentAmount.length > 0 ? spentAmount[0].total : 0;

    // Check if budget exists and is exceeded
    const budgetCheck = await CategoryBudget.checkBudgetExceeded(
      req.userId,
      categoryName,
      totalSpent
    );

    if (budgetCheck && (budgetCheck.isExceeded || budgetCheck.isNearThreshold)) {
      res.json({
        success: true,
        hasAlert: true,
        data: {
          budget: budgetCheck.budget,
          isExceeded: budgetCheck.isExceeded,
          isNearThreshold: budgetCheck.isNearThreshold,
          spentAmount: budgetCheck.spentAmount,
          remainingAmount: budgetCheck.remainingAmount,
          percentageUsed: budgetCheck.percentageUsed
        }
      });
    } else {
      res.json({
        success: true,
        hasAlert: false
      });
    }
  } catch (error) {
    console.error('Error checking budget alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check budget alerts'
    });
  }
});

module.exports = router;
