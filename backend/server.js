require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config');
const connectDB = require('./database/connection');
const Category = require('./models/Category');

// Import routes
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');
const transactionRoutes = require('./routes/transactions');
const categoryRoutes = require('./routes/categories');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date(),
    environment: config.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TSEC Hack Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      protected: '/api/protected',
      transactions: '/api/transactions',
      categories: '/api/categories',
      health: '/health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(config.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Connect to MongoDB and start server
const PORT = config.PORT;

const startServer = async () => {
  try {
    // Debug: Check if environment variables are loaded
    console.log('🔍 Environment check:');
    console.log('MONGODB_URI:', config.MONGODB_URI ? 'Set' : 'Not set');
    console.log('PORT:', config.PORT);
    
    // Connect to MongoDB
    await connectDB();
    
    // Seed default categories
    await Category.seedDefaultCategories();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Environment: ${config.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API docs: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
