const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Transaction = require('../models/Transaction');

const router = express.Router();

function monthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

router.get('/spending', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const months = Math.max(1, Math.min(24, parseInt(req.query.months || '6')));
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    const rows = await Transaction.find({ userId, type: 'expense', date: { $gte: start } }).select('amount category date').lean();

    const monthlyTotals = {};
    const categoryTotals = {};
    for (const r of rows) {
      const mk = monthKey(r.date);
      monthlyTotals[mk] = (monthlyTotals[mk] || 0) + r.amount;
      categoryTotals[r.category] = (categoryTotals[r.category] || 0) + r.amount;
    }

    // Build ordered months array
    const monthsKeys = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsKeys.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
    }
    const monthly = monthsKeys.map(mk => ({ month: mk, total: monthlyTotals[mk] || 0 }));

    const categories = Object.entries(categoryTotals)
      .sort((a,b)=>b[1]-a[1])
      .map(([name, total])=>({ name, total }));
    const topCategories = categories.slice(0,5);

    res.json({ success: true, data: { monthly, topCategories, categories } });
  } catch (error) {
    console.error('Insights spending error:', error);
    res.status(500).json({ success: false, message: 'Failed to load spending insights' });
  }
});

module.exports = router;


