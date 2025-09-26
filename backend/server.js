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
const learnRoutes = require('./routes/learn');
const budgetRoutes = require('./routes/budget');
const insightsRoutes = require('./routes/insights');
const alertsRoutes = require('./routes/alerts');
const passkeyRoutes = require('./routes/passkeys');
const chatRoutes = require('./routes/chat');
const bankStatementRoutes = require('./routes/bankStatements');
const categoryBudgetRoutes = require('./routes/categoryBudgets');
const aiBudgetRoutes = require('./routes/aiBudget');
const financialGoalRoutes = require('./routes/financialGoals');

const app = express();

// Middleware
// Open CORS for dev/mobile testing: allow all origins with credentials
app.use(cors({
  origin: true,
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
app.use('/api/learn', learnRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/passkeys', passkeyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/bank-statements', bankStatementRoutes);
app.use('/api/category-budgets', categoryBudgetRoutes);
app.use('/api/ai-budget', aiBudgetRoutes);
app.use('/api/financial-goals', financialGoalRoutes);

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
      learn: '/api/learn',
      budget: '/api/budget',
      insights: '/api/insights',
      alerts: '/api/alerts',
      passkeys: '/api/passkeys',
      chat: '/api/chat',
      bankStatements: '/api/bank-statements',
      categoryBudgets: '/api/category-budgets',
      aiBudget: '/api/ai-budget',
      financialGoals: '/api/financial-goals',
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
    
    // Ensure Category indexes are up to date (drop legacy unique on name+userId)
    try {
      const indexes = await Category.collection.indexes();
      const legacy = indexes.find(i => i.name === 'name_1_userId_1');
      if (legacy) {
        console.log('⚙️  Dropping legacy Category index name_1_userId_1');
        await Category.collection.dropIndex('name_1_userId_1');
      }
      await Category.syncIndexes();
      console.log('✅ Category indexes synchronized');
    } catch (e) {
      console.warn('Index sync warning:', e.message);
    }

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
