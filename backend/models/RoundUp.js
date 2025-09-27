const mongoose = require('mongoose');

const roundUpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  originalAmount: {
    type: Number,
    required: true,
    min: [0, 'Original amount cannot be negative']
  },
  roundUpAmount: {
    type: Number,
    required: true,
    min: [0, 'Round-up amount cannot be negative']
  },
  roundedAmount: {
    type: Number,
    required: true,
    min: [0, 'Rounded amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'transferred', 'failed'],
    default: 'pending'
  },
  transferredAt: {
    type: Date
  },
  savingsGoalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinancialGoal'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
roundUpSchema.index({ userId: 1, status: 1 });
roundUpSchema.index({ userId: 1, createdAt: -1 });
roundUpSchema.index({ transactionId: 1 });

// Virtual for formatted round-up amount
roundUpSchema.virtual('formattedRoundUpAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(this.roundUpAmount);
});

// Virtual for formatted rounded amount
roundUpSchema.virtual('formattedRoundedAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(this.roundedAmount);
});

// Static method to calculate round-up amount
roundUpSchema.statics.calculateRoundUp = function(amount) {
  const roundedAmount = Math.ceil(amount);
  const roundUpAmount = roundedAmount - amount;
  return {
    originalAmount: amount,
    roundedAmount,
    roundUpAmount: Math.max(roundUpAmount, 0)
  };
};

// Static method to get user's round-up summary
roundUpSchema.statics.getUserSummary = async function(userId, months = 6) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  const summary = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRoundUps: { $sum: '$roundUpAmount' },
        totalTransactions: { $sum: 1 },
        pendingAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'pending'] }, '$roundUpAmount', 0]
          }
        },
        transferredAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'transferred'] }, '$roundUpAmount', 0]
          }
        }
      }
    }
  ]);

  return summary[0] || {
    totalRoundUps: 0,
    totalTransactions: 0,
    pendingAmount: 0,
    transferredAmount: 0
  };
};

// Static method to get round-up trend
roundUpSchema.statics.getTrend = async function(userId, months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  const trend = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        totalRoundUps: { $sum: '$roundUpAmount' },
        transactionCount: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  return trend.map(item => ({
    month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
    totalRoundUps: item.totalRoundUps,
    transactionCount: item.transactionCount
  }));
};

// Ensure virtual fields are serialized
roundUpSchema.set('toJSON', { virtuals: true });
roundUpSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('RoundUp', roundUpSchema);
