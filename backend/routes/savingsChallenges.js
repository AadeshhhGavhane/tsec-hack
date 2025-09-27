const express = require('express');
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');
const SavingsChallenge = require('../models/SavingsChallenge');
const UserChallenge = require('../models/UserChallenge');
const Transaction = require('../models/Transaction');
const RoundUp = require('../models/RoundUp');

const router = express.Router();

// Get available challenges
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const { category, difficulty } = req.query;
    
    let query = {};
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    
    const challenges = await SavingsChallenge.find({
      ...query,
      isActive: true,
      endDate: { $gt: new Date() }
    }).sort({ difficulty: 1, createdAt: -1 });
    
    // Add joinability status to each challenge
    const challengesWithStatus = challenges.map(challenge => {
      const challengeObj = challenge.toObject();
      challengeObj.isJoinable = challenge.isJoinable();
      return challengeObj;
    });
    
    res.json({
      success: true,
      data: { challenges: challengesWithStatus }
    });
  } catch (error) {
    console.error('Get available challenges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available challenges'
    });
  }
});

// Get user's challenges
router.get('/my-challenges', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { status } = req.query;
    
    let query = { userId };
    if (status) query.status = status;
    
    const userChallenges = await UserChallenge.find(query)
      .populate('challengeId')
      .sort({ startDate: -1 });
    
    res.json({
      success: true,
      data: { userChallenges }
    });
  } catch (error) {
    console.error('Get user challenges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user challenges'
    });
  }
});

// Join a challenge
router.post('/join/:challengeId', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { challengeId } = req.params;
    
    // Check if challenge exists and is joinable
    const challenge = await SavingsChallenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }
    
    if (!challenge.isJoinable()) {
      return res.status(400).json({
        success: false,
        message: 'Challenge is not joinable'
      });
    }
    
    // Check if user is already participating
    const existingParticipation = await UserChallenge.findOne({
      userId,
      challengeId
    });
    
    if (existingParticipation) {
      return res.status(400).json({
        success: false,
        message: 'You are already participating in this challenge'
      });
    }
    
    // Create user challenge participation
    const userChallenge = await UserChallenge.create({
      userId,
      challengeId,
      progress: {
        currentValue: 0,
        targetValue: challenge.targetValue
      }
    });
    
    // Update challenge participant count
    await challenge.join();
    
    res.json({
      success: true,
      message: 'Successfully joined challenge',
      data: { userChallenge }
    });
  } catch (error) {
    console.error('Join challenge error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join challenge'
    });
  }
});

// Leave a challenge
router.post('/leave/:challengeId', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { challengeId } = req.params;
    
    const userChallenge = await UserChallenge.findOne({
      userId,
      challengeId,
      status: 'active'
    });
    
    if (!userChallenge) {
      return res.status(404).json({
        success: false,
        message: 'You are not participating in this challenge'
      });
    }
    
    // Update user challenge status
    userChallenge.status = 'abandoned';
    userChallenge.endDate = new Date();
    await userChallenge.save();
    
    // Update challenge participant count
    const challenge = await SavingsChallenge.findById(challengeId);
    if (challenge) {
      await challenge.leave();
    }
    
    res.json({
      success: true,
      message: 'Successfully left challenge'
    });
  } catch (error) {
    console.error('Leave challenge error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave challenge'
    });
  }
});

// Update challenge progress
router.patch('/progress/:challengeId', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { challengeId } = req.params;
    const { progressValue } = req.body;
    
    if (progressValue === undefined || progressValue < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid progress value'
      });
    }
    
    const userChallenge = await UserChallenge.findOne({
      userId,
      challengeId,
      status: 'active'
    }).populate('challengeId');
    
    if (!userChallenge) {
      return res.status(404).json({
        success: false,
        message: 'Active challenge participation not found'
      });
    }
    
    // Update progress
    await userChallenge.updateProgress(progressValue);
    
    // Check for milestones
    userChallenge.checkMilestones();
    
    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: { userChallenge }
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress'
    });
  }
});

// Get challenge leaderboard
router.get('/leaderboard/:challengeId', authenticateToken, async (req, res) => {
  try {
    const { challengeId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const leaderboard = await UserChallenge.getChallengeLeaderboard(challengeId, limit);
    
    res.json({
      success: true,
      data: { leaderboard }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard'
    });
  }
});

// Get user's achievements
router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 20;
    
    const achievements = await UserChallenge.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $unwind: '$achievements' },
      { $sort: { 'achievements.earnedAt': -1 } },
      { $limit: limit },
      { $project: {
        challengeTitle: '$challengeId.title',
        achievement: '$achievements',
        challengeType: '$challengeId.type'
      }}
    ]);
    
    // Get total points
    const totalPointsResult = await UserChallenge.getUserTotalPoints(userId);
    const totalPoints = totalPointsResult[0]?.totalPoints || 0;
    
    res.json({
      success: true,
      data: { 
        achievements,
        totalPoints
      }
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get achievements'
    });
  }
});

// Auto-update progress based on transactions
router.post('/auto-update', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user's active challenges
    const userChallenges = await UserChallenge.getUserActive(userId);
    
    const updates = [];
    
    for (const userChallenge of userChallenges) {
      const challenge = userChallenge.challengeId;
      let newProgress = 0;
      
      switch (challenge.type) {
        case 'amount':
          // Calculate total savings amount
          const savingsTransactions = await Transaction.find({
            userId,
            type: 'income',
            createdAt: { $gte: userChallenge.startDate }
          });
          newProgress = savingsTransactions.reduce((sum, t) => sum + t.amount, 0);
          break;
          
        case 'percentage':
          // Calculate savings percentage of income
          const incomeTransactions = await Transaction.find({
            userId,
            type: 'income',
            createdAt: { $gte: userChallenge.startDate }
          });
          const expenseTransactions = await Transaction.find({
            userId,
            type: 'expense',
            createdAt: { $gte: userChallenge.startDate }
          });
          
          const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
          const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
          const savings = totalIncome - totalExpenses;
          
          if (totalIncome > 0) {
            newProgress = (savings / totalIncome) * 100;
          }
          break;
          
        case 'roundup':
          // Calculate round-up savings
          const roundUps = await RoundUp.find({
            userId,
            status: 'transferred',
            createdAt: { $gte: userChallenge.startDate }
          });
          newProgress = roundUps.reduce((sum, r) => sum + r.roundUpAmount, 0);
          break;
          
        case 'frequency':
          // Count savings transactions
          const savingsCount = await Transaction.countDocuments({
            userId,
            type: 'income',
            createdAt: { $gte: userChallenge.startDate }
          });
          newProgress = savingsCount;
          break;
          
        case 'streak':
          // This is handled in the updateProgress method
          newProgress = userChallenge.streak.current;
          break;
      }
      
      if (newProgress !== userChallenge.progress.currentValue) {
        await userChallenge.updateProgress(newProgress);
        userChallenge.checkMilestones();
        updates.push(userChallenge);
      }
    }
    
    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: { 
        updatedChallenges: updates.length,
        challenges: updates
      }
    });
  } catch (error) {
    console.error('Auto-update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-update progress'
    });
  }
});

// Get challenge categories
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await SavingsChallenge.distinct('category', { isActive: true });
    
    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories'
    });
  }
});

module.exports = router;
