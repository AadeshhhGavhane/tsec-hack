const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const RoundUp = require('../models/RoundUp');
const Transaction = require('../models/Transaction');
const FinancialGoal = require('../models/FinancialGoal');

const router = express.Router();

// Get round-up summary for user
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const months = parseInt(req.query.months) || 6;
    
    const summary = await RoundUp.getUserSummary(userId, months);
    
    res.json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    console.error('Round-up summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get round-up summary'
    });
  }
});

// Get round-up trend
router.get('/trend', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const months = parseInt(req.query.months) || 12;
    
    const trend = await RoundUp.getTrend(userId, months);
    
    res.json({
      success: true,
      data: { trend }
    });
  } catch (error) {
    console.error('Round-up trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get round-up trend'
    });
  }
});

// Get recent round-ups
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 20;
    
    const roundUps = await RoundUp.find({ userId })
      .populate('transactionId', 'title amount type category date')
      .populate('savingsGoalId', 'title category')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    res.json({
      success: true,
      data: { roundUps }
    });
  } catch (error) {
    console.error('Recent round-ups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent round-ups'
    });
  }
});

// Transfer pending round-ups to savings goal
router.post('/transfer', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { goalId } = req.body;
    
    // Get pending round-ups
    const pendingRoundUps = await RoundUp.find({
      userId,
      status: 'pending'
    });
    
    if (pendingRoundUps.length === 0) {
      return res.json({
        success: true,
        message: 'No pending round-ups to transfer',
        data: { transferredAmount: 0 }
      });
    }
    
    const totalAmount = pendingRoundUps.reduce((sum, roundUp) => sum + roundUp.roundUpAmount, 0);
    
    // If goalId is provided, add to that goal
    if (goalId) {
      const goal = await FinancialGoal.findOne({
        _id: goalId,
        userId,
        status: 'active'
      });
      
      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Savings goal not found'
        });
      }
      
      // Update goal with round-up amount
      goal.currentAmount += totalAmount;
      await goal.save();
      
      // Update round-ups with goal reference
      await RoundUp.updateMany(
        { _id: { $in: pendingRoundUps.map(r => r._id) } },
        { 
          status: 'transferred',
          transferredAt: new Date(),
          savingsGoalId: goalId
        }
      );
    } else {
      // Create automatic round-up savings goal if it doesn't exist
      let roundUpGoal = await FinancialGoal.findOne({
        userId,
        category: 'other',
        title: 'Round-up Savings'
      });
      
      if (!roundUpGoal) {
        roundUpGoal = await FinancialGoal.create({
          userId,
          title: 'Round-up Savings',
          description: 'Automatic savings from round-up transactions',
          targetAmount: 0, // No specific target
          currentAmount: 0,
          targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          priority: 'low',
          category: 'other',
          status: 'active'
        });
      }
      
      // Update goal with round-up amount
      roundUpGoal.currentAmount += totalAmount;
      await roundUpGoal.save();
      
      // Update round-ups with goal reference
      await RoundUp.updateMany(
        { _id: { $in: pendingRoundUps.map(r => r._id) } },
        { 
          status: 'transferred',
          transferredAt: new Date(),
          savingsGoalId: roundUpGoal._id
        }
      );
    }
    
    res.json({
      success: true,
      message: 'Round-ups transferred successfully',
      data: { 
        transferredAmount: totalAmount,
        transactionCount: pendingRoundUps.length
      }
    });
  } catch (error) {
    console.error('Transfer round-ups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to transfer round-ups'
    });
  }
});

// Enable/disable round-up for a transaction
router.patch('/toggle/:transactionId', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { transactionId } = req.params;
    const { enabled } = req.body;
    
    const transaction = await Transaction.findOne({
      _id: transactionId,
      userId
    });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    if (enabled) {
      // Calculate round-up amount
      const roundUpData = RoundUp.calculateRoundUp(transaction.amount);
      
      // Update transaction
      transaction.roundUpEnabled = true;
      transaction.roundUpAmount = roundUpData.roundUpAmount;
      await transaction.save();
      
      // Create round-up record
      const roundUp = await RoundUp.create({
        userId,
        transactionId: transaction._id,
        originalAmount: roundUpData.originalAmount,
        roundUpAmount: roundUpData.roundUpAmount,
        roundedAmount: roundUpData.roundedAmount,
        status: 'pending'
      });
      
      res.json({
        success: true,
        message: 'Round-up enabled',
        data: { roundUp }
      });
    } else {
      // Disable round-up
      transaction.roundUpEnabled = false;
      transaction.roundUpAmount = 0;
      await transaction.save();
      
      // Update round-up record status
      await RoundUp.updateOne(
        { transactionId: transaction._id },
        { status: 'failed' }
      );
      
      res.json({
        success: true,
        message: 'Round-up disabled'
      });
    }
  } catch (error) {
    console.error('Toggle round-up error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle round-up'
    });
  }
});

// Get round-up settings
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user's round-up statistics
    const summary = await RoundUp.getUserSummary(userId, 12);
    
    // Get available savings goals
    const savingsGoals = await FinancialGoal.find({
      userId,
      status: 'active',
      category: { $in: ['emergency_fund', 'vacation', 'home', 'car', 'education', 'retirement', 'other'] }
    }).select('title category currentAmount targetAmount');
    
    res.json({
      success: true,
      data: {
        summary,
        savingsGoals
      }
    });
  } catch (error) {
    console.error('Round-up settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get round-up settings'
    });
  }
});

module.exports = router;
