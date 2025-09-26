const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token - user not found' 
      });
    }

    // Add user to request object
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
        req.userId = user._id;
      }
    }
    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};
