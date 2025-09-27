const mongoose = require('mongoose');

const userChallengeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SavingsChallenge',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'failed', 'abandoned'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  progress: {
    currentValue: {
      type: Number,
      default: 0,
      min: [0, 'Current value cannot be negative']
    },
    targetValue: {
      type: Number,
      required: true,
      min: [0, 'Target value cannot be negative']
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  achievements: [{
    type: {
      type: String,
      enum: ['milestone', 'completion', 'streak', 'bonus'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Achievement title cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Achievement description cannot exceed 200 characters']
    },
    points: {
      type: Number,
      default: 0,
      min: [0, 'Achievement points cannot be negative']
    },
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  streak: {
    current: {
      type: Number,
      default: 0,
      min: [0, 'Current streak cannot be negative']
    },
    longest: {
      type: Number,
      default: 0,
      min: [0, 'Longest streak cannot be negative']
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  totalPoints: {
    type: Number,
    default: 0,
    min: [0, 'Total points cannot be negative']
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
userChallengeSchema.index({ userId: 1, challengeId: 1 }, { unique: true });
userChallengeSchema.index({ userId: 1, status: 1 });
userChallengeSchema.index({ challengeId: 1, status: 1 });

// Virtual for progress percentage
userChallengeSchema.virtual('progressPercentage').get(function() {
  if (this.progress.targetValue === 0) return 0;
  return Math.min((this.progress.currentValue / this.progress.targetValue) * 100, 100);
});

// Virtual for formatted current value
userChallengeSchema.virtual('formattedCurrentValue').get(function() {
  const challenge = this.populated('challengeId') || this.challengeId;
  if (challenge && challenge.type === 'percentage') {
    return `${this.progress.currentValue}%`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(this.progress.currentValue);
});

// Virtual for formatted target value
userChallengeSchema.virtual('formattedTargetValue').get(function() {
  const challenge = this.populated('challengeId') || this.challengeId;
  if (challenge && challenge.type === 'percentage') {
    return `${this.progress.targetValue}%`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(this.progress.targetValue);
});

// Method to update progress
userChallengeSchema.methods.updateProgress = function(newValue) {
  this.progress.currentValue = Math.max(newValue, 0);
  this.progress.lastUpdated = new Date();
  
  // Update streak
  const now = new Date();
  const lastActivity = new Date(this.streak.lastActivity);
  const daysDiff = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 1) {
    // Consecutive day
    this.streak.current += 1;
    this.streak.longest = Math.max(this.streak.current, this.streak.longest);
  } else if (daysDiff > 1) {
    // Streak broken
    this.streak.current = 1;
  }
  
  this.streak.lastActivity = now;
  
  // Check for completion
  if (this.progress.currentValue >= this.progress.targetValue && this.status === 'active') {
    this.status = 'completed';
    this.endDate = new Date();
    this.addAchievement('completion', 'Challenge Completed!', 'You successfully completed this challenge!', 100);
  }
  
  return this.save();
};

// Method to add achievement
userChallengeSchema.methods.addAchievement = function(type, title, description, points = 0) {
  this.achievements.push({
    type,
    title,
    description,
    points,
    earnedAt: new Date()
  });
  this.totalPoints += points;
  return this.save();
};

// Method to check milestone achievements
userChallengeSchema.methods.checkMilestones = function() {
  const progress = this.progressPercentage;
  const milestones = [25, 50, 75, 90];
  
  for (const milestone of milestones) {
    if (progress >= milestone && !this.hasMilestone(milestone)) {
      this.addAchievement(
        'milestone',
        `${milestone}% Complete!`,
        `You've reached ${milestone}% of your challenge goal!`,
        milestone / 10
      );
    }
  }
};

// Method to check if milestone already achieved
userChallengeSchema.methods.hasMilestone = function(percentage) {
  return this.achievements.some(achievement => 
    achievement.type === 'milestone' && 
    achievement.title.includes(`${percentage}%`)
  );
};

// Static method to get user's active challenges
userChallengeSchema.statics.getUserActive = function(userId) {
  return this.find({
    userId,
    status: 'active'
  }).populate('challengeId').sort({ startDate: -1 });
};

// Static method to get user's completed challenges
userChallengeSchema.statics.getUserCompleted = function(userId, limit = 10) {
  return this.find({
    userId,
    status: 'completed'
  }).populate('challengeId').sort({ endDate: -1 }).limit(limit);
};

// Static method to get user's total points
userChallengeSchema.statics.getUserTotalPoints = function(userId) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, totalPoints: { $sum: '$totalPoints' } } }
  ]);
};

// Static method to get leaderboard for a challenge
userChallengeSchema.statics.getChallengeLeaderboard = function(challengeId, limit = 10) {
  return this.find({
    challengeId,
    status: { $in: ['active', 'completed'] }
  }).populate('userId', 'name email').sort({ 'progress.currentValue': -1 }).limit(limit);
};

// Ensure virtual fields are serialized
userChallengeSchema.set('toJSON', { virtuals: true });
userChallengeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('UserChallenge', userChallengeSchema);
