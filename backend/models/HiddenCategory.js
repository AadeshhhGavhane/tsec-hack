const mongoose = require('mongoose');

// Tracks which default categories a user has chosen to hide
const hiddenCategorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  }
}, {
  timestamps: true
});

hiddenCategorySchema.index({ userId: 1, categoryId: 1 }, { unique: true });

module.exports = mongoose.model('HiddenCategory', hiddenCategorySchema);


