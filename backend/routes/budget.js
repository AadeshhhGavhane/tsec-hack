const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { z } = require('zod');
const { parseBody } = require('../middleware/validation');
const BudgetPlan = require('../models/BudgetPlan');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Groq = require('groq-sdk');

const router = express.Router();

const MonthSchema = z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) });

const GenerateSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  income: z.number().min(0),
  targetSavingsPct: z.number().min(0).max(90).default(10),
  method: z.enum(['50-30-20', 'Zero-based']).default('50-30-20')
});

const SaveSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  method: z.enum(['50-30-20', 'Zero-based']),
  income: z.number().min(0),
  targetSavingsPct: z.number().min(0).max(90),
  allocations: z.array(z.object({ category: z.string(), amount: z.number().min(0), pct: z.number().min(0) })).min(1)
});

function monthBounds(month) {
  const [y, m] = month.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  return { start, end };
}

async function getMtdByCategory(userId, month) {
  const { start, end } = monthBounds(month);
  const result = await Transaction.aggregate([
    { $match: { userId, type: 'expense', date: { $gte: start, $lt: end } } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } }
  ]);
  const map = {};
  result.forEach(r => { map[r._id] = r.total; });
  return map;
}

router.post('/generate', authenticateToken, parseBody(GenerateSchema), async (req, res) => {
  try {
    const userId = req.userId;
    const { month, income, targetSavingsPct, method } = req.body;
    // Only expense categories should be budgeted
    const categories = await Category.find({ userId, type: 'expense' }).select('name');
    const catNames = categories.map(c => c.name);

    // Simple baseline: allocate fixed percentages or zero-based equal split after savings
    const savingsAmount = Math.round((income * targetSavingsPct) / 100);
    const spendable = Math.max(income - savingsAmount, 0);
    const per = catNames.length ? Math.floor(spendable / catNames.length) : 0;
    const allocations = catNames.map(name => ({ category: name, amount: per, pct: spendable ? Math.round((per / income) * 100) : 0 }));

    const totals = { allocated: allocations.reduce((a, c) => a + c.amount, 0), savings: savingsAmount, remaining: income - savingsAmount - allocations.reduce((a, c) => a + c.amount, 0) };

    // Try LLM refinement with guardrails (best-effort)
    try {
      if (process.env.GROQ_API_KEY) {
        const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const response = await client.chat.completions.create({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [
            { role: 'system', content: 'Return JSON only matching schema. Create monthly budget allocations across provided categories. No NSFW.' },
            { role: 'user', content: `Income: ${income}, SavingsTargetPct: ${targetSavingsPct}, Method: ${method}, Categories: ${catNames.join(', ')}` }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'budget',
              schema: { type: 'object', properties: { allocations: { type: 'array', items: { type: 'object', properties: { category: { type: 'string' }, amount: { type: 'number' } }, required: ['category', 'amount'] } } }, required: ['allocations'] }
            }
          }
        });
        const raw = JSON.parse(response.choices?.[0]?.message?.content || '{}');
        if (Array.isArray(raw.allocations)) {
          const refined = [];
          let sum = 0;
          raw.allocations.forEach(r => {
            if (catNames.includes(r.category) && r.amount >= 0) { refined.push({ category: r.category, amount: Math.round(r.amount) }); sum += Math.round(r.amount); }
          });
          if (refined.length) {
            const clamped = Math.min(sum, spendable);
            const scale = sum ? clamped / sum : 1;
            allocations.forEach(a => {
              const found = refined.find(r => r.category === a.category);
              if (found) a.amount = Math.round(found.amount * scale);
              a.pct = income ? Math.round((a.amount / income) * 100) : 0;
            });
            totals.allocated = allocations.reduce((a, c) => a + c.amount, 0);
            totals.remaining = income - savingsAmount - totals.allocated;
          }
        }
      }
    } catch (e) {
      // swallow and keep baseline
    }

    res.json({ success: true, data: { plan: { month, method, income, targetSavingsPct, allocations, totals }, mtd: await getMtdByCategory(userId, month) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate budget' });
  }
});

router.post('/save', authenticateToken, parseBody(SaveSchema), async (req, res) => {
  try {
    const userId = req.userId;
    const { month, method, income, targetSavingsPct, allocations } = req.body;
    const totals = {
      allocated: allocations.reduce((a, c) => a + c.amount, 0),
      savings: Math.round((income * targetSavingsPct) / 100),
      remaining: 0
    };
    totals.remaining = income - totals.savings - totals.allocated;

    const doc = await BudgetPlan.findOneAndUpdate(
      { userId, month },
      { userId, month, method, income, targetSavingsPct, allocations, totals },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: { plan: doc } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save budget' });
  }
});

router.get('/current', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const month = String(req.query.month);
    const plan = await BudgetPlan.findOne({ userId, month });
    const mtd = await getMtdByCategory(userId, month);
    res.json({ success: true, data: { plan, mtd } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load budget' });
  }
});

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const items = await BudgetPlan.find({ userId }).sort({ month: -1 }).limit(24);
    res.json({ success: true, data: { items } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load history' });
  }
});

const RecommendSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  income: z.number().min(0),
  targetSavingsPct: z.number().min(0).max(90),
  allocations: z.array(z.object({ category: z.string(), amount: z.number().min(0) }))
});

router.post('/recommend', authenticateToken, parseBody(RecommendSchema), async (req, res) => {
  try {
    const { month, income, targetSavingsPct, allocations } = req.body;
    const totalAlloc = allocations.reduce((a,c)=>a+c.amount,0);
    const savingsAmount = Math.round((income * targetSavingsPct)/100);
    const remaining = income - savingsAmount - totalAlloc;
    const changes = [];
    // Simple rules: if remaining < 0, trim from largest discretionary categories
    if (remaining < 0) {
      const sorted = [...allocations].sort((a,b)=>b.amount-a.amount);
      let deficit = -remaining;
      for (const item of sorted) {
        if (deficit <= 0) break;
        const trim = Math.min(Math.round(item.amount * 0.1), deficit); // trim up to 10%
        if (trim > 0) { changes.push({ category: item.category, deltaAmount: -trim, reason: 'Trim to fit savings target' }); deficit -= trim; }
      }
    } else if (remaining > 0 && savingsAmount < Math.round(income*0.2)) {
      // Suggest moving some remainder to savings if savings < 20%
      const add = Math.min(remaining, Math.round(income*0.05));
      changes.push({ category: 'Savings', deltaAmount: add, reason: 'Accelerate savings goal' });
    }

    // Try LLM enhancement for rationale if key available
    try {
      if (process.env.GROQ_API_KEY) {
        const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const response = await client.chat.completions.create({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [
            { role: 'system', content: 'Provide JSON with suggested budget changes and short reasons. No NSFW.' },
            { role: 'user', content: `Income ${income}, SavingsTarget ${targetSavingsPct}%, Current allocations: ${allocations.map(a=>`${a.category}:${a.amount}`).join(', ')}` }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: { name: 'reco', schema: { type: 'object', properties: { changes: { type: 'array', items: { type: 'object', properties: { category: { type:'string' }, deltaAmount: { type: 'number' }, reason: { type:'string' } }, required: ['category','deltaAmount','reason'] } } }, required: ['changes'] } }
          }
        });
        const raw = JSON.parse(response.choices?.[0]?.message?.content || '{}');
        if (Array.isArray(raw.changes)) {
          raw.changes.forEach(c=>{ if (typeof c.deltaAmount === 'number' && c.category) changes.push(c); });
        }
      }
    } catch {}

    res.json({ success: true, data: { changes } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to recommend' });
  }
});

module.exports = router;


