const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const BudgetPlan = require('../models/BudgetPlan');

const router = express.Router();

function monthBounds(monthKey) {
  const [y,m] = monthKey.split('-').map(Number);
  return { start: new Date(y, m-1, 1), end: new Date(y, m, 1) };
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const month = String(req.query.month || `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`);
    const plan = await BudgetPlan.findOne({ userId, month });
    const alerts = [];
    if (plan) {
      const { start, end } = monthBounds(month);
      const spend = await Transaction.aggregate([
        { $match: { userId, type: 'expense', date: { $gte: start, $lt: end } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } }
      ]);
      const spendMap = {}; spend.forEach(s=> spendMap[s._id] = s.total);
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


