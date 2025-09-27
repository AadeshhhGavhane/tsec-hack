const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Challenge title is required'],
    trim: true,
    maxlength: [100, 'Challenge title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Challenge description is required'],
    trim: true,
    maxlength: [500, 'Challenge description cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['amount', 'percentage', 'frequency', 'streak', 'roundup'],
    required: true
  },
  targetValue: {
    type: Number,
    required: true,
    min: [0, 'Target value cannot be negative']
  },
  duration: {
    type: Number, // in days
    required: true,
    min: [1, 'Duration must be at least 1 day']
  },
  reward: {
    points: {
      type: Number,
      default: 0,
      min: [0, 'Reward points cannot be negative']
    },
    badge: {
      type: String,
      trim: true,
      maxlength: [50, 'Badge name cannot exceed 50 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Reward description cannot exceed 200 characters']
    }
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['savings', 'budgeting', 'debt', 'investment', 'general'],
    default: 'savings'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  maxParticipants: {
    type: Number,
    default: 0, // 0 means unlimited
    min: [0, 'Max participants cannot be negative']
  },
  currentParticipants: {
    type: Number,
    default: 0,
    min: [0, 'Current participants cannot be negative']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
challengeSchema.index({ type: 1, isActive: 1 });
challengeSchema.index({ category: 1, isActive: 1 });
challengeSchema.index({ difficulty: 1, isActive: 1 });
challengeSchema.index({ endDate: 1 });

// Virtual for formatted target value
challengeSchema.virtual('formattedTargetValue').get(function() {
  if (this.type === 'percentage') {
    return `${this.targetValue}%`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(this.targetValue);
});

// Virtual for time remaining
challengeSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(diffDays, 0);
});

// Virtual for progress percentage
challengeSchema.virtual('progressPercentage').get(function() {
  const now = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const totalTime = end - start;
  const elapsed = now - start;
  return Math.min((elapsed / totalTime) * 100, 100);
});

// Static method to get available challenges
challengeSchema.statics.getAvailable = function() {
  return this.find({
    isActive: true,
    endDate: { $gt: new Date() },
    $or: [
      { maxParticipants: 0 },
      { $expr: { $lt: ['$currentParticipants', '$maxParticipants'] } }
    ]
  }).sort({ difficulty: 1, createdAt: -1 });
};

// Static method to get challenges by category
challengeSchema.statics.getByCategory = function(category) {
  return this.find({
    category,
    isActive: true,
    endDate: { $gt: new Date() }
  }).sort({ difficulty: 1, createdAt: -1 });
};

// Static method to get challenges by difficulty
challengeSchema.statics.getByDifficulty = function(difficulty) {
  return this.find({
    difficulty,
    isActive: true,
    endDate: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

// Method to check if challenge is joinable
challengeSchema.methods.isJoinable = function() {
  const now = new Date();
  return this.isActive && 
         this.endDate > now && 
         (this.maxParticipants === 0 || this.currentParticipants < this.maxParticipants);
};

// Method to join challenge
challengeSchema.methods.join = function() {
  if (!this.isJoinable()) {
    throw new Error('Challenge is not joinable');
  }
  this.currentParticipants += 1;
  return this.save();
};

// Method to leave challenge
challengeSchema.methods.leave = function() {
  if (this.currentParticipants > 0) {
    this.currentParticipants -= 1;
    return this.save();
  }
  return Promise.resolve(this);
};

// Ensure virtual fields are serialized
challengeSchema.set('toJSON', { virtuals: true });
challengeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SavingsChallenge', challengeSchema);
