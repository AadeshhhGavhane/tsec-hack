const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  options: { type: [String], required: true, validate: v => Array.isArray(v) && v.length === 4 },
  correctIndex: { type: Number, required: true, min: 0, max: 3 },
  explanation: { type: String, default: '' }
}, { _id: false });

const quizSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  topic: { type: String, enum: ['Savings', 'Credit Score', 'Investing Basics', 'Budgeting'], required: true },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
  length: { type: Number, enum: [5, 7], default: 5 },
  seed: { type: String, required: true },
  questions: { type: [quizQuestionSchema], required: true },
}, { timestamps: true });

quizSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Quiz', quizSchema);


