const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Asset name cannot exceed 100 characters']
  },
  type: {
    type: String,
    enum: ['cash', 'savings', 'investment', 'property', 'vehicle', 'other'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: [0, 'Asset value cannot be negative']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  }
}, { _id: false });

const liabilitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Liability name cannot exceed 100 characters']
  },
  type: {
    type: String,
    enum: ['credit_card', 'loan', 'mortgage', 'student_loan', 'personal_loan', 'other'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: [0, 'Liability value cannot be negative']
  },
  interestRate: {
    type: Number,
    min: [0, 'Interest rate cannot be negative'],
    max: [100, 'Interest rate cannot exceed 100%']
  },
  minimumPayment: {
    type: Number,
    min: [0, 'Minimum payment cannot be negative']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  }
}, { _id: false });

const netWorthSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  assets: [assetSchema],
  liabilities: [liabilitySchema],
  totalAssets: {
    type: Number,
    default: 0,
    min: [0, 'Total assets cannot be negative']
  },
  totalLiabilities: {
    type: Number,
    default: 0,
    min: [0, 'Total liabilities cannot be negative']
  },
  netWorth: {
    type: Number,
    default: 0
  },
  isSnapshot: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
netWorthSchema.index({ userId: 1, date: -1 });
netWorthSchema.index({ userId: 1, isSnapshot: 1 });

// Virtual for formatted net worth
netWorthSchema.virtual('formattedNetWorth').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(this.netWorth);
});

// Virtual for formatted total assets
netWorthSchema.virtual('formattedTotalAssets').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(this.totalAssets);
});

// Virtual for formatted total liabilities
netWorthSchema.virtual('formattedTotalLiabilities').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(this.totalLiabilities);
});

// Pre-save middleware to calculate totals
netWorthSchema.pre('save', function(next) {
  this.totalAssets = this.assets.reduce((sum, asset) => sum + asset.value, 0);
  this.totalLiabilities = this.liabilities.reduce((sum, liability) => sum + liability.value, 0);
  this.netWorth = this.totalAssets - this.totalLiabilities;
  next();
});

// Method to get net worth trend
netWorthSchema.statics.getTrend = async function(userId, months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  return this.find({
    userId,
    date: { $gte: startDate },
    isSnapshot: true
  }).sort({ date: 1 }).select('date netWorth totalAssets totalLiabilities');
};

// Method to get current net worth
netWorthSchema.statics.getCurrent = async function(userId) {
  return this.findOne({ userId, isSnapshot: true })
    .sort({ date: -1 });
};

// Method to create snapshot
netWorthSchema.statics.createSnapshot = async function(userId, assets, liabilities) {
  // Mark previous snapshots as non-snapshots
  await this.updateMany(
    { userId, isSnapshot: true },
    { isSnapshot: false }
  );
  
  // Create new snapshot
  return this.create({
    userId,
    assets,
    liabilities,
    isSnapshot: true
  });
};

// Ensure virtual fields are serialized
netWorthSchema.set('toJSON', { virtuals: true });
netWorthSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('NetWorth', netWorthSchema);
