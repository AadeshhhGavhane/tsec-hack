const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    minlength: [2, 'Category name must be at least 2 characters'],
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return !this.isDefault;
    },
    index: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: '#3b82f6',
    match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color']
  },
  icon: {
    type: String,
    default: 'tag'
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    default: 'expense'
  }
}, {
  timestamps: true
});

// Index for better query performance
categorySchema.index({ userId: 1, isDefault: 1 });

// Remove uniqueness across global defaults; we will clone defaults per user

// Ensure user categories are unique per user AND type
categorySchema.index({ name: 1, userId: 1, type: 1 }, { 
  unique: true, 
  partialFilterExpression: { isDefault: false } 
});

// Static method to get default categories
categorySchema.statics.getDefaultCategories = function() {
  return [
    // Expense Categories
    { name: 'Food & Dining', color: '#ef4444', icon: 'utensils', isDefault: true, type: 'expense' },
    { name: 'Groceries', color: '#22c55e', icon: 'shopping-cart', isDefault: true, type: 'expense' },
    { name: 'Transportation', color: '#3b82f6', icon: 'car', isDefault: true, type: 'expense' },
    { name: 'Entertainment', color: '#a855f7', icon: 'film', isDefault: true, type: 'expense' },
    { name: 'Utilities', color: '#f97316', icon: 'zap', isDefault: true, type: 'expense' },
    { name: 'Healthcare', color: '#06b6d4', icon: 'heart', isDefault: true, type: 'expense' },
    { name: 'Shopping', color: '#8b5cf6', icon: 'shopping-bag', isDefault: true, type: 'expense' },
    { name: 'Education', color: '#10b981', icon: 'book', isDefault: true, type: 'expense' },
    { name: 'Travel', color: '#f59e0b', icon: 'plane', isDefault: true, type: 'expense' },
    { name: 'Other Expense', color: '#6b7280', icon: 'more-horizontal', isDefault: true, type: 'expense' },
    
    // Income Categories
    { name: 'Salary', color: '#22c55e', icon: 'briefcase', isDefault: true, type: 'income' },
    { name: 'Freelance', color: '#3b82f6', icon: 'laptop', isDefault: true, type: 'income' },
    { name: 'Investment', color: '#84cc16', icon: 'trending-up', isDefault: true, type: 'income' },
    { name: 'Business', color: '#8b5cf6', icon: 'building', isDefault: true, type: 'income' },
    { name: 'Gift', color: '#f59e0b', icon: 'gift', isDefault: true, type: 'income' },
    { name: 'Other Income', color: '#6b7280', icon: 'plus-circle', isDefault: true, type: 'income' }
  ];
};

// Static method to seed default categories
categorySchema.statics.seedDefaultCategories = async function() {
  const defaultCategories = this.getDefaultCategories();
  
  for (const categoryData of defaultCategories) {
    await this.findOneAndUpdate(
      { name: categoryData.name, isDefault: true },
      categoryData,
      { upsert: true, new: true }
    );
  }
  
  console.log('✅ Default categories seeded successfully');
};

module.exports = mongoose.model('Category', categorySchema);
