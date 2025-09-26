const mongoose = require('mongoose');

const financialGoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Goal title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Goal description cannot exceed 500 characters']
  },
  targetAmount: {
    type: Number,
    required: true,
    min: [0, 'Target amount must be positive']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Current amount cannot be negative']
  },
  targetDate: {
    type: Date,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },
  category: {
    type: String,
    enum: ['emergency_fund', 'vacation', 'home', 'car', 'education', 'retirement', 'debt_payoff', 'investment', 'other'],
    default: 'other'
  },
  aiRoadmap: {
    suggested: {
      type: Boolean,
      default: false
    },
    monthlyContribution: {
      type: Number,
      default: 0
    },
    timeline: {
      years: { type: Number, default: 0 },
      months: { type: Number, default: 0 }
    },
    suggestions: [{
      phase: String,
      description: String,
      monthlyAmount: Number,
      duration: String,
      tips: [String]
    }],
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  milestones: [{
    title: String,
    targetAmount: Number,
    targetDate: Date,
    achieved: { type: Boolean, default: false },
    achievedDate: Date
  }]
}, {
  timestamps: true
});

// Index for better query performance
financialGoalSchema.index({ userId: 1, status: 1 });
financialGoalSchema.index({ userId: 1, targetDate: 1 });

// Virtual for progress percentage
financialGoalSchema.virtual('progressPercentage').get(function() {
  if (this.targetAmount === 0) return 0;
  return Math.min((this.currentAmount / this.targetAmount) * 100, 100);
});

// Virtual for time remaining
financialGoalSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const diffTime = this.targetDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for monthly contribution needed
financialGoalSchema.virtual('monthlyContributionNeeded').get(function() {
  const now = new Date();
  const diffTime = this.targetDate - now;
  const diffMonths = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)), 1);
  const remainingAmount = this.targetAmount - this.currentAmount;
  return Math.max(remainingAmount / diffMonths, 0);
});

// Method to check if goal is achievable
financialGoalSchema.methods.isAchievable = function(monthlyIncome, monthlyExpenses) {
  const availableForGoals = monthlyIncome - monthlyExpenses;
  const monthlyNeeded = this.monthlyContributionNeeded;
  return availableForGoals >= monthlyNeeded;
};

module.exports = mongoose.model('FinancialGoal', financialGoalSchema);
