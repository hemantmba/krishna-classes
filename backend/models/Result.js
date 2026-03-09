const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  selectedOption: { type: Number, default: -1 }, // -1 = not attempted
  isCorrect: Boolean,
  timeTaken: Number // seconds
});

const resultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  className: { type: String, required: true },
  chapter: { type: String, required: true },
  subject: String,
  medium: String,
  totalQuestions: Number,
  attempted: Number,
  correct: Number,
  wrong: Number,
  skipped: Number,
  score: Number,
  maxScore: Number,
  percentage: Number,
  timeTaken: Number, // total seconds
  answers: [answerSchema],
  rank: Number,
  shareToken: { type: String, unique: true, sparse: true }
}, { timestamps: true });

// Indexes
resultSchema.index({ userId: 1 });
resultSchema.index({ className: 1, chapter: 1 });
resultSchema.index({ score: -1 });
resultSchema.index({ createdAt: -1 });

// Generate share token before save
resultSchema.pre('save', function(next) {
  if (!this.shareToken) {
    this.shareToken = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
  next();
});

module.exports = mongoose.model('Result', resultSchema);
