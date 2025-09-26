const mongoose = require('mongoose');

const categoryBudgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  categoryName: {
    type: String,
    required: true,
    trim: true
  },
  budgetAmount: {
    type: Number,
    required: true,
    min: 0
  },
  period: {
    type: String,
    enum: ['monthly', 'weekly', 'yearly'],
    default: 'monthly'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  alertThreshold: {
    type: Number,
    default: 80, // Alert when 80% of budget is used
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Ensure one budget per category per user
categoryBudgetSchema.index({ userId: 1, categoryId: 1 }, { unique: true });

// Static method to check if budget is exceeded
categoryBudgetSchema.statics.checkBudgetExceeded = async function(userId, categoryName, spentAmount) {
  const budget = await this.findOne({
    userId,
    categoryName,
    isActive: true
  });

  if (!budget) return null;

  const thresholdAmount = (budget.budgetAmount * budget.alertThreshold) / 100;
  const isExceeded = spentAmount >= budget.budgetAmount;
  const isNearThreshold = spentAmount >= thresholdAmount;

  return {
    budget,
    isExceeded,
    isNearThreshold,
    spentAmount,
    remainingAmount: budget.budgetAmount - spentAmount,
    percentageUsed: (spentAmount / budget.budgetAmount) * 100
  };
};

module.exports = mongoose.model('CategoryBudget', categoryBudgetSchema);
