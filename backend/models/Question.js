const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: { type: String, default: '' },
  image: { type: String },
  isLatex: { type: Boolean, default: false }
});

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  questionImage: { type: String },
  isLatex: { type: Boolean, default: false },
  options: [optionSchema],
  correctOption: { type: Number, required: true },
  medium: { type: String, enum: ['hindi', 'english'], default: 'hindi' },
  className: { type: String, required: true },
  chapter: { type: String, required: true },
  subject: { type: String },
  explanation: { type: String },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  isActive: { type: Boolean, default: true },

  // Approval system
  status: {
    type: String,
    enum: ['approved', 'pending', 'rejected'],
    default: 'approved' // admin uploads are auto-approved
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectedReason: { type: String },

  // Stores manager pending edits until admin approves
  pendingData: {
    questionText: String,
    isLatex: Boolean,
    options: [optionSchema],
    correctOption: Number,
    medium: String,
    className: String,
    chapter: String,
    subject: String,
    explanation: String,
    difficulty: String,
    editedAt: Date,
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }

}, { timestamps: true });

questionSchema.index({ className: 1 });
questionSchema.index({ chapter: 1 });
questionSchema.index({ medium: 1 });
questionSchema.index({ status: 1 });

module.exports = mongoose.model('Question', questionSchema);