const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { z } = require('zod');
const { parseBody } = require('../middleware/validation');
const NetWorth = require('../models/NetWorth');

const router = express.Router();

// Validation schemas
const AssetSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['cash', 'savings', 'investment', 'property', 'vehicle', 'other']),
  value: z.number().min(0),
  description: z.string().max(500).optional()
});

const LiabilitySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['credit_card', 'loan', 'mortgage', 'student_loan', 'personal_loan', 'other']),
  value: z.number().min(0),
  interestRate: z.number().min(0).max(100).optional(),
  minimumPayment: z.number().min(0).optional(),
  description: z.string().max(500).optional()
});

const NetWorthUpdateSchema = z.object({
  assets: z.array(AssetSchema),
  liabilities: z.array(LiabilitySchema)
});

// Get current net worth
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const currentNetWorth = await NetWorth.getCurrent(userId);
    
    if (!currentNetWorth) {
      return res.json({
        success: true,
        data: {
          netWorth: null,
          message: 'No net worth data available. Create your first snapshot!'
        }
      });
    }

    res.json({
      success: true,
      data: {
        netWorth: currentNetWorth
      }
    });
  } catch (error) {
    console.error('Get current net worth error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get current net worth'
    });
  }
});

// Get net worth trend
router.get('/trend', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const months = parseInt(req.query.months) || 12;
    
    const trend = await NetWorth.getTrend(userId, months);
    
    res.json({
      success: true,
      data: {
        trend: trend.map(item => ({
          date: item.date,
          netWorth: item.netWorth,
          totalAssets: item.totalAssets,
          totalLiabilities: item.totalLiabilities
        }))
      }
    });
  } catch (error) {
    console.error('Get net worth trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get net worth trend'
    });
  }
});

// Create or update net worth snapshot
router.post('/snapshot', authenticateToken, parseBody(NetWorthUpdateSchema), async (req, res) => {
  try {
    const userId = req.userId;
    const { assets, liabilities } = req.body;

    // Validate that we have at least one asset or liability
    if (assets.length === 0 && liabilities.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one asset or liability is required'
      });
    }

    // Create new snapshot
    const snapshot = await NetWorth.createSnapshot(userId, assets, liabilities);

    res.json({
      success: true,
      message: 'Net worth snapshot created successfully',
      data: {
        netWorth: snapshot
      }
    });
  } catch (error) {
    console.error('Create net worth snapshot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create net worth snapshot'
    });
  }
});

// Get net worth history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const history = await NetWorth.find({ userId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .select('date totalAssets totalLiabilities netWorth isSnapshot');

    const total = await NetWorth.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get net worth history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get net worth history'
    });
  }
});

// Get net worth statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get current net worth
    const current = await NetWorth.getCurrent(userId);
    
    // Get trend for last 12 months
    const trend = await NetWorth.getTrend(userId, 12);
    
    // Calculate statistics
    const stats = {
      currentNetWorth: current?.netWorth || 0,
      currentAssets: current?.totalAssets || 0,
      currentLiabilities: current?.totalLiabilities || 0,
      trend: trend.length,
      monthlyChange: 0,
      yearlyChange: 0
    };

    if (trend.length >= 2) {
      const latest = trend[trend.length - 1];
      const previous = trend[trend.length - 2];
      stats.monthlyChange = latest.netWorth - previous.netWorth;
    }

    if (trend.length >= 12) {
      const latest = trend[trend.length - 1];
      const yearAgo = trend[0];
      stats.yearlyChange = latest.netWorth - yearAgo.netWorth;
    }

    res.json({
      success: true,
      data: {
        stats
      }
    });
  } catch (error) {
    console.error('Get net worth stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get net worth statistics'
    });
  }
});

// Delete net worth snapshot
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const netWorth = await NetWorth.findOneAndDelete({
      _id: id,
      userId
    });

    if (!netWorth) {
      return res.status(404).json({
        success: false,
        message: 'Net worth snapshot not found'
      });
    }

    res.json({
      success: true,
      message: 'Net worth snapshot deleted successfully'
    });
  } catch (error) {
    console.error('Delete net worth snapshot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete net worth snapshot'
    });
  }
});

module.exports = router;
