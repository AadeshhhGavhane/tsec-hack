const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const BudgetPlan = require('../models/BudgetPlan');
const CategoryBudget = require('../models/CategoryBudget');

const router = express.Router();

function monthBounds(monthKey) {
  const [y,m] = monthKey.split('-').map(Number);
  return { start: new Date(y, m-1, 1), end: new Date(y, m, 1) };
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const month = String(req.query.month || `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`);
    const alerts = [];

    // Check category budgets
    const categoryBudgets = await CategoryBudget.find({ 
      userId, 
      isActive: true 
    }).populate('categoryId', 'name type');

    const { start, end } = monthBounds(month);
    const spend = await Transaction.aggregate([
      { $match: { userId, type: 'expense', date: { $gte: start, $lt: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);
    const spendMap = {}; 
    spend.forEach(s => spendMap[s._id] = s.total);

    // Check category budget alerts
    for (const budget of categoryBudgets) {
      const spent = spendMap[budget.categoryName] || 0;
      const percentageUsed = (spent / budget.budgetAmount) * 100;
      
      if (spent >= budget.budgetAmount) {
        // Budget exceeded
        alerts.push({
          id: `category-budget-exceeded-${budget._id}`,
          type: 'category_budget_exceeded',
          title: `${budget.categoryName} budget exceeded!`,
          message: `Spent ₹${Math.round(spent).toLocaleString()} vs budget ₹${Math.round(budget.budgetAmount).toLocaleString()} (${Math.round(percentageUsed)}%)`,
          severity: 'error',
          meta: { 
            category: budget.categoryName, 
            spent, 
            budget: budget.budgetAmount,
            percentageUsed,
            budgetId: budget._id
          }
        });
      } else if (spent >= (budget.budgetAmount * budget.alertThreshold / 100)) {
        // Near threshold
        alerts.push({
          id: `category-budget-threshold-${budget._id}`,
          type: 'category_budget_threshold',
          title: `${budget.categoryName} near budget limit`,
          message: `Spent ₹${Math.round(spent).toLocaleString()} vs budget ₹${Math.round(budget.budgetAmount).toLocaleString()} (${Math.round(percentageUsed)}%)`,
          severity: 'warning',
          meta: { 
            category: budget.categoryName, 
            spent, 
            budget: budget.budgetAmount,
            percentageUsed,
            budgetId: budget._id
          }
        });
      }
    }

    // Check monthly budget plan alerts (existing logic)
    const plan = await BudgetPlan.findOne({ userId, month });
    if (plan) {
      for (const a of plan.allocations) {
        const used = spendMap[a.category] || 0;
        if (a.amount > 0 && used > a.amount * 1.15) {
          alerts.push({
            id: `${a.category}-over`,
            type: 'budget_over',
            title: `${a.category} over budget`,
            message: `Spent ₹${Math.round(used).toLocaleString()} vs budget ₹${Math.round(a.amount).toLocaleString()}`,
            severity: 'warning',
            meta: { category: a.category, used, budget: a.amount }
          });
        }
      }
    }

    res.json({ success: true, data: { alerts } });
  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({ success: false, message: 'Failed to load alerts' });
  }
});

module.exports = router;


