const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Category = require('../models/Category');
const CategoryBudget = require('../models/CategoryBudget');
const Transaction = require('../models/Transaction');
const { Groq } = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// AI Auto-budget allocation
router.post('/auto-allocate', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { availableBalance, preferences } = req.body;

    if (!availableBalance || availableBalance <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Available balance must be greater than 0'
      });
    }

    // Get user's expense categories
    const categories = await Category.find({
      userId,
      type: 'expense',
      isDefault: false
    });

    if (categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No expense categories found. Please create some categories first.'
      });
    }

    // Get spending history for AI analysis
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const spendingHistory = await Transaction.aggregate([
      {
        $match: {
          userId,
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

    const spendingMap = {};
    spendingHistory.forEach(item => {
      spendingMap[item._id] = {
        totalSpent: item.totalSpent,
        transactionCount: item.transactionCount,
        avgAmount: item.avgAmount
      };
    });

    // Prepare data for AI
    const categoryData = categories.map(cat => ({
      name: cat.name,
      historicalSpending: spendingMap[cat.name] || { totalSpent: 0, transactionCount: 0, avgAmount: 0 },
      icon: cat.icon,
      color: cat.color
    }));

    // AI prompt for budget allocation
    const systemPrompt = `You are a financial advisor AI. Allocate a budget of ₹${availableBalance} across expense categories based on their historical spending patterns and financial best practices.

Available categories with their historical data:
${categoryData.map(cat => 
  `- ${cat.name}: Total spent ₹${Math.round(cat.historicalSpending.totalSpent)}, ${cat.historicalSpending.transactionCount} transactions, avg ₹${Math.round(cat.historicalSpending.avgAmount)}`
).join('\n')}

User preferences: ${preferences || 'No specific preferences mentioned'}

Guidelines:
1. Allocate 100% of the available balance (₹${availableBalance})
2. Consider historical spending patterns - categories with higher historical spending should get larger allocations
3. Apply financial best practices (e.g., essentials like groceries, utilities should get adequate funding)
4. Ensure no category gets 0 allocation unless it has no historical spending
5. For categories with no historical data, allocate based on typical expense patterns
6. Return ONLY a valid JSON array - no markdown, no explanations, no additional text

IMPORTANT: Your response must be ONLY a JSON array starting with [ and ending with ]. Do not include any markdown formatting, explanations, or additional text.

Example format:
[
  {"category": "Groceries", "amount": 15000, "reasoning": "Essential expense, high historical spending"},
  {"category": "Transportation", "amount": 8000, "reasoning": "Regular expense, moderate historical spending"}
]`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 2000
    });

    const aiResponse = completion.choices[0]?.message?.content;
    let allocations;

    try {
      // Try to extract JSON from the response if it contains markdown
      let jsonString = aiResponse;
      
      // Look for JSON array in the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }
      
      allocations = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      console.error('Parse error:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Failed to process AI budget allocation. Please try again.'
      });
    }

    // Validate and normalize allocations
    const totalAllocated = allocations.reduce((sum, alloc) => sum + (alloc.amount || 0), 0);
    const scaleFactor = availableBalance / totalAllocated;

    const normalizedAllocations = allocations.map(alloc => ({
      category: alloc.category,
      amount: Math.round((alloc.amount || 0) * scaleFactor),
      reasoning: alloc.reasoning || 'AI-allocated based on spending patterns'
    }));

    // Create/update budgets for each category
    const budgetResults = [];
    for (const allocation of normalizedAllocations) {
      const category = categories.find(cat => cat.name === allocation.category);
      if (category) {
        const budget = await CategoryBudget.findOneAndUpdate(
          { userId, categoryId: category._id },
          {
            userId,
            categoryId: category._id,
            categoryName: category.name,
            budgetAmount: allocation.amount,
            period: 'monthly',
            alertThreshold: 80,
            isActive: true
          },
          { upsert: true, new: true }
        ).populate('categoryId', 'name type color icon');

        budgetResults.push({
          budget,
          reasoning: allocation.reasoning
        });
      }
    }

    res.json({
      success: true,
      message: 'AI budget allocation completed successfully',
      data: {
        totalAllocated: availableBalance,
        allocations: budgetResults,
        summary: {
          categoriesAllocated: budgetResults.length,
          averageAllocation: Math.round(availableBalance / budgetResults.length)
        }
      }
    });

  } catch (error) {
    console.error('AI auto-budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to allocate budgets using AI'
    });
  }
});

// Get AI budget suggestions without creating budgets
router.post('/suggest', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { availableBalance } = req.body;

    if (!availableBalance || availableBalance <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Available balance must be greater than 0'
      });
    }

    // Get user's expense categories
    const categories = await Category.find({
      userId,
      type: 'expense',
      isDefault: false
    });

    if (categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No expense categories found'
      });
    }

    // Get spending history
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const spendingHistory = await Transaction.aggregate([
      {
        $match: {
          userId,
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

    const spendingMap = {};
    spendingHistory.forEach(item => {
      spendingMap[item._id] = {
        totalSpent: item.totalSpent,
        transactionCount: item.transactionCount,
        avgAmount: item.avgAmount
      };
    });

    // Prepare data for AI
    const categoryData = categories.map(cat => ({
      name: cat.name,
      historicalSpending: spendingMap[cat.name] || { totalSpent: 0, transactionCount: 0, avgAmount: 0 },
      icon: cat.icon,
      color: cat.color
    }));

    // AI prompt for budget suggestions
    const systemPrompt = `You are a financial advisor AI. Suggest budget allocations for ₹${availableBalance} across expense categories based on their historical spending patterns.

Available categories with their historical data:
${categoryData.map(cat => 
  `- ${cat.name}: Total spent ₹${Math.round(cat.historicalSpending.totalSpent)}, ${cat.historicalSpending.transactionCount} transactions, avg ₹${Math.round(cat.historicalSpending.avgAmount)}`
).join('\n')}

Guidelines:
1. Allocate 100% of the available balance (₹${availableBalance})
2. Consider historical spending patterns
3. Apply financial best practices
4. Return ONLY a valid JSON array - no markdown, no explanations, no additional text

IMPORTANT: Your response must be ONLY a JSON array starting with [ and ending with ]. Do not include any markdown formatting, explanations, or additional text.

Example format:
[
  {"category": "Groceries", "amount": 15000, "reasoning": "Essential expense, high historical spending"},
  {"category": "Transportation", "amount": 8000, "reasoning": "Regular expense, moderate historical spending"}
]`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 2000
    });

    const aiResponse = completion.choices[0]?.message?.content;
    let suggestions;

    try {
      // Try to extract JSON from the response if it contains markdown
      let jsonString = aiResponse;
      
      // Look for JSON array in the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }
      
      suggestions = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      console.error('Parse error:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Failed to process AI budget suggestions. Please try again.'
      });
    }

    // Validate and normalize suggestions
    const totalSuggested = suggestions.reduce((sum, sug) => sum + (sug.amount || 0), 0);
    const scaleFactor = availableBalance / totalSuggested;

    const normalizedSuggestions = suggestions.map(sug => ({
      category: sug.category,
      amount: Math.round((sug.amount || 0) * scaleFactor),
      reasoning: sug.reasoning || 'AI-suggested based on spending patterns'
    }));

    res.json({
      success: true,
      data: {
        suggestions: normalizedSuggestions,
        totalAllocated: availableBalance,
        summary: {
          categoriesSuggested: normalizedSuggestions.length,
          averageAllocation: Math.round(availableBalance / normalizedSuggestions.length)
        }
      }
    });

  } catch (error) {
    console.error('AI budget suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI budget suggestions'
    });
  }
});

module.exports = router;
