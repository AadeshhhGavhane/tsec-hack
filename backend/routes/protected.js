const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/protected/dashboard
// @desc    Get dashboard data (example protected route)
// @access  Private
router.get('/dashboard', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to your dashboard!',
    data: {
      user: req.user.toJSON(),
      dashboardData: {
        totalUsers: 1, // This would come from your database
        lastLogin: new Date(),
        notifications: []
      }
    }
  });
});

// @route   GET /api/protected/profile
// @desc    Get user profile (alternative to /api/auth/me)
// @access  Private
router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user.toJSON()
    }
  });
});

// @route   GET /api/protected/test
// @desc    Test protected route
// @access  Private
router.get('/test', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'This is a protected route!',
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      timestamp: new Date()
    }
  });
});

module.exports = router;
