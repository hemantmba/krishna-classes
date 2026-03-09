const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  image: String,
  isLatex: { type: Boolean, default: false }
});

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  questionImage: String,
  isLatex: { type: Boolean, default: false },
  options: [optionSchema],
  correctOption: { type: Number, required: true, min: 0, max: 3 },
  explanation: String,
  medium: { type: String, enum: ['hindi', 'english'], required: true },
  className: { type: String, required: true },
  chapter: { type: String, required: true },
  subject: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  marks: { type: Number, default: 1 },
  tags: [String],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Indexes for fast querying
questionSchema.index({ className: 1, chapter: 1, medium: 1 });
questionSchema.index({ subject: 1, className: 1 });
questionSchema.index({ isActive: 1 });

module.exports = mongoose.model('Question', questionSchema);
