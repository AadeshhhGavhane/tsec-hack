const mongoose = require('mongoose');

const learnProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  streakCount: { type: Number, default: 0 },
  lastQuizAt: { type: Date, default: null },
  reminderEnabled: { type: Boolean, default: false },
  preferredLength: { type: Number, enum: [5, 7], default: 5 }
}, { timestamps: true });

module.exports = mongoose.model('LearnProfile', learnProfileSchema);


