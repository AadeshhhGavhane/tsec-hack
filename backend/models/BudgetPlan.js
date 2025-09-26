const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema({
  category: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  pct: { type: Number, required: true, min: 0 }
}, { _id: false });

const budgetPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  month: { type: String, required: true, index: true }, // format YYYY-MM
  method: { type: String, enum: ['50-30-20', 'Zero-based'], default: '50-30-20' },
  income: { type: Number, required: true, min: 0 },
  targetSavingsPct: { type: Number, default: 0 },
  allocations: { type: [allocationSchema], required: true },
  totals: {
    allocated: { type: Number, required: true },
    savings: { type: Number, required: true },
    remaining: { type: Number, required: true }
  }
}, { timestamps: true });

budgetPlanSchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('BudgetPlan', budgetPlanSchema);


