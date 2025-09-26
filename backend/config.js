module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/tsec-hack'
};
