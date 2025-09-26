const express = require('express');
const { body, query, param } = require('express-validator');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Validation middleware for transactions
const validateTransaction = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('amount')
    .isFloat({ min: 0.01, max: 999999999 })
    .withMessage('Amount must be between ₹0.01 and ₹999,999,999'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO date'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  handleValidationErrors
];

const validateQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('type')
    .optional()
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  query('category')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid ID'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO date'),
  handleValidationErrors
];

// @route   GET /api/transactions
// @desc    Get user's transactions with filtering and pagination
// @access  Private
router.get('/', authenticateToken, validateQuery, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      category,
      startDate,
      endDate,
      search
    } = req.query;

    const userId = req.userId;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter object
    const filter = { userId };
    
    if (type) filter.type = type;
    if (category) filter.category = category;
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    // Get transactions with pagination
    const transactions = await Transaction.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Transaction.countDocuments(filter);

    // Calculate financial summary
    const summary = await Transaction.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const income = summary.find(s => s._id === 'income')?.total || 0;
    const expense = summary.find(s => s._id === 'expense')?.total || 0;
    const balance = income - expense;

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        },
        summary: {
          totalIncome: income,
          totalExpense: expense,
          balance,
          transactionCount: summary.reduce((acc, s) => acc + s.count, 0)
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get single transaction
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: { transaction }
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction'
    });
  }
});

// @route   POST /api/transactions
// @desc    Create new transaction
// @access  Private
router.post('/', authenticateToken, validateTransaction, async (req, res) => {
  try {
    const { title, amount, category, type, date, description } = req.body;
    const userId = req.userId;

    // Verify category exists and belongs to user or is default
    const categoryDoc = await Category.findOne({
      name: category,
      $or: [{ userId }, { isDefault: true }]
    });

    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    // Create date in Indian timezone
    const createIndianDate = (inputDate) => {
      if (inputDate) {
        // If date is provided, combine it with current time in Indian timezone
        const now = new Date();
        const indianTimeString = now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
        const indianTime = new Date(indianTimeString);
        
        // Extract date parts from input date
        const inputDateObj = new Date(inputDate);
        const year = inputDateObj.getFullYear();
        const month = inputDateObj.getMonth();
        const day = inputDateObj.getDate();
        
        // Create new date with input date but current time
        const finalDate = new Date(year, month, day, indianTime.getHours(), indianTime.getMinutes(), indianTime.getSeconds());
        return finalDate;
      } else {
        // If no date provided, create current date in Indian timezone
        const now = new Date();
        const indianTimeString = now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
        return new Date(indianTimeString);
      }
    };

    const transactionDate = createIndianDate(date);

    const transaction = new Transaction({
      userId,
      title,
      amount,
      category,
      type,
      date: transactionDate,
      description
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: { transaction }
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction'
    });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', authenticateToken, validateTransaction, async (req, res) => {
  try {
    const { title, amount, category, type, date, description } = req.body;
    const userId = req.userId;

    // Verify category exists and belongs to user or is default
    const categoryDoc = await Category.findOne({
      name: category,
      $or: [{ userId }, { isDefault: true }]
    });

    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId },
      {
        title,
        amount,
        category,
        type,
        date: date ? new Date(date) : undefined,
        description
      },
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: { transaction }
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transaction'
    });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete transaction'
    });
  }
});

module.exports = router;
