const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
  answers: { type: [Number], required: true },
  score: { type: Number, required: true, min: 0, max: 100 },
  timeTakenSec: { type: Number, default: 0 },
}, { timestamps: true });

quizAttemptSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);


