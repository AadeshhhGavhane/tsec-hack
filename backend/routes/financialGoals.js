const express = require('express');
const router = express.Router();
const FinancialGoal = require('../models/FinancialGoal');
const Transaction = require('../models/Transaction');
const CategoryBudget = require('../models/CategoryBudget');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { Groq } = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Get all financial goals for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, category } = req.query;
    
    const filter = { userId: req.userId };
    if (status) filter.status = status;
    if (category) filter.category = category;

    const goals = await FinancialGoal.find(filter)
      .sort({ priority: -1, targetDate: 1 })
      .lean();

    // Add virtual fields
    const goalsWithVirtuals = goals.map(goal => ({
      ...goal,
      progressPercentage: goal.targetAmount === 0 ? 0 : Math.min((goal.currentAmount / goal.targetAmount) * 100, 100),
      timeRemaining: Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24)),
      monthlyContributionNeeded: (() => {
        const now = new Date();
        const diffTime = new Date(goal.targetDate) - now;
        const diffMonths = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)), 1);
        const remainingAmount = goal.targetAmount - goal.currentAmount;
        return Math.max(remainingAmount / diffMonths, 0);
      })()
    }));

    res.json({
      success: true,
      data: { goals: goalsWithVirtuals }
    });
  } catch (error) {
    console.error('Error fetching financial goals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial goals'
    });
  }
});

// Create a new financial goal
router.post('/', authenticateToken, [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title is required and must be less than 100 characters'),
  body('targetAmount').isNumeric().isFloat({ min: 0 }).withMessage('Target amount must be a positive number'),
  body('targetDate').isISO8601().withMessage('Target date must be a valid date'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  body('category').optional().isIn(['emergency_fund', 'vacation', 'home', 'car', 'education', 'retirement', 'debt_payoff', 'investment', 'other']).withMessage('Invalid category'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
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

    const { title, description, targetAmount, targetDate, priority = 'medium', category = 'other' } = req.body;

    const goal = new FinancialGoal({
      userId: req.userId,
      title,
      description,
      targetAmount: parseFloat(targetAmount),
      targetDate: new Date(targetDate),
      priority,
      category
    });

    await goal.save();

    res.json({
      success: true,
      message: 'Financial goal created successfully',
      data: { goal }
    });
  } catch (error) {
    console.error('Error creating financial goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create financial goal'
    });
  }
});

// Update a financial goal
router.put('/:goalId', authenticateToken, [
  body('title').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Title must be less than 100 characters'),
  body('targetAmount').optional().isNumeric().isFloat({ min: 0 }).withMessage('Target amount must be a positive number'),
  body('targetDate').optional().isISO8601().withMessage('Target date must be a valid date'),
  body('currentAmount').optional().isNumeric().isFloat({ min: 0 }).withMessage('Current amount cannot be negative'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  body('status').optional().isIn(['active', 'paused', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('category').optional().isIn(['emergency_fund', 'vacation', 'home', 'car', 'education', 'retirement', 'debt_payoff', 'investment', 'other']).withMessage('Invalid category'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
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

    const { goalId } = req.params;
    const updateData = { ...req.body };

    // Convert date strings to Date objects
    if (updateData.targetDate) {
      updateData.targetDate = new Date(updateData.targetDate);
    }

    // Convert numeric strings to numbers
    if (updateData.targetAmount) {
      updateData.targetAmount = parseFloat(updateData.targetAmount);
    }
    if (updateData.currentAmount) {
      updateData.currentAmount = parseFloat(updateData.currentAmount);
    }

    const goal = await FinancialGoal.findOneAndUpdate(
      { _id: goalId, userId: req.userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Financial goal not found'
      });
    }

    res.json({
      success: true,
      message: 'Financial goal updated successfully',
      data: { goal }
    });
  } catch (error) {
    console.error('Error updating financial goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update financial goal'
    });
  }
});

// Delete a financial goal
router.delete('/:goalId', authenticateToken, async (req, res) => {
  try {
    const { goalId } = req.params;

    const goal = await FinancialGoal.findOneAndDelete({
      _id: goalId,
      userId: req.userId
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Financial goal not found'
      });
    }

    res.json({
      success: true,
      message: 'Financial goal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting financial goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete financial goal'
    });
  }
});

// Generate AI roadmap for a goal
router.post('/:goalId/ai-roadmap', authenticateToken, async (req, res) => {
  try {
    const { goalId } = req.params;

    const goal = await FinancialGoal.findOne({
      _id: goalId,
      userId: req.userId
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Financial goal not found'
      });
    }

    // Get user's financial data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Get spending history
    const spendingHistory = await Transaction.aggregate([
      {
        $match: {
          userId: req.userId,
          type: 'expense',
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    // Get income history
    const incomeHistory = await Transaction.aggregate([
      {
        $match: {
          userId: req.userId,
          type: 'income',
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: '$amount' },
          avgMonthlyIncome: { $avg: '$amount' }
        }
      }
    ]);

    // Get current budgets
    const budgets = await CategoryBudget.find({
      userId: req.userId,
      isActive: true
    });

    const monthlyIncome = incomeHistory.length > 0 ? incomeHistory[0].avgMonthlyIncome : 0;
    const totalMonthlySpending = spendingHistory.reduce((sum, item) => sum + item.totalSpent, 0) / 6;
    const availableForGoals = monthlyIncome - totalMonthlySpending;

    // Calculate goal timeline
    const now = new Date();
    const timeDiff = goal.targetDate - now;
    const monthsRemaining = Math.max(Math.ceil(timeDiff / (1000 * 60 * 60 * 24 * 30)), 1);
    const monthlyNeeded = (goal.targetAmount - goal.currentAmount) / monthsRemaining;

    // AI prompt for roadmap generation
    const systemPrompt = `You are a financial advisor AI. Generate a detailed roadmap for achieving a financial goal.

Goal Details:
- Title: ${goal.title}
- Target Amount: ₹${goal.targetAmount.toLocaleString()}
- Current Amount: ₹${goal.currentAmount.toLocaleString()}
- Target Date: ${goal.targetDate.toLocaleDateString()}
- Time Remaining: ${monthsRemaining} months
- Monthly Contribution Needed: ₹${monthlyNeeded.toLocaleString()}

User's Financial Profile:
- Monthly Income: ₹${monthlyIncome.toLocaleString()}
- Monthly Spending: ₹${totalMonthlySpending.toLocaleString()}
- Available for Goals: ₹${availableForGoals.toLocaleString()}
- Goal Achievable: ${availableForGoals >= monthlyNeeded ? 'Yes' : 'No'}

Spending Categories:
${spendingHistory.map(item => `- ${item._id}: ₹${Math.round(item.totalSpent).toLocaleString()} (${item.transactionCount} transactions)`).join('\n')}

Current Budgets:
${budgets.map(budget => `- ${budget.categoryName}: ₹${Math.round(budget.budgetAmount).toLocaleString()}`).join('\n')}

Generate a comprehensive roadmap with:
1. Feasibility assessment
2. Monthly contribution strategy
3. Phase-by-phase approach
4. Specific tips for each phase
5. Budget optimization suggestions
6. Risk mitigation strategies

Return ONLY a valid JSON object with this structure:
{
  "feasible": true/false,
  "monthlyContribution": number,
  "timeline": {
    "years": number,
    "months": number
  },
  "phases": [
    {
      "phase": "Phase 1: Foundation",
      "description": "Build emergency fund and optimize spending",
      "monthlyAmount": number,
      "duration": "3 months",
      "tips": ["tip1", "tip2", "tip3"]
    }
  ],
  "budgetOptimizations": ["suggestion1", "suggestion2"],
  "riskMitigation": ["strategy1", "strategy2"],
  "successProbability": "high/medium/low"
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 3000
    });

    const aiResponse = completion.choices[0]?.message?.content;
    let roadmap;

    try {
      // Try to extract JSON from the response
      let jsonString = aiResponse;
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }
      
      roadmap = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI roadmap response:', aiResponse);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate AI roadmap'
      });
    }

    // Update goal with AI roadmap
    goal.aiRoadmap = {
      suggested: true,
      monthlyContribution: roadmap.monthlyContribution || monthlyNeeded,
      timeline: roadmap.timeline || { years: Math.floor(monthsRemaining / 12), months: monthsRemaining % 12 },
      suggestions: roadmap.phases || [],
      lastUpdated: new Date()
    };

    await goal.save();

    res.json({
      success: true,
      message: 'AI roadmap generated successfully',
      data: {
        goal,
        roadmap
      }
    });

  } catch (error) {
    console.error('Error generating AI roadmap:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI roadmap'
    });
  }
});

module.exports = router;
