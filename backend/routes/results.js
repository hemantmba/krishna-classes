const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Question = require('../models/Question');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Submit test result
router.post('/submit', auth, async (req, res) => {
  try {
    const { className, chapter, subject, medium, answers, timeTaken } = req.body;

    // Fetch correct answers
    const questionIds = answers.map(a => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } }).select('correctOption marks');
    const questionMap = {};
    questions.forEach(q => { questionMap[q._id.toString()] = q; });

    let correct = 0, wrong = 0, skipped = 0, score = 0, maxScore = 0;
    const processedAnswers = answers.map(a => {
      const q = questionMap[a.questionId];
      if (!q) return a;
      const marks = q.marks || 1;
      maxScore += marks;
      if (a.selectedOption === -1) {
        skipped++;
        return { ...a, isCorrect: false };
      }
      const isCorrect = a.selectedOption === q.correctOption;
      if (isCorrect) { correct++; score += marks; }
      else wrong++;
      return { ...a, isCorrect };
    });

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    const result = new Result({
      userId: req.user._id,
      className, chapter, subject, medium,
      totalQuestions: answers.length,
      attempted: correct + wrong,
      correct, wrong, skipped,
      score, maxScore, percentage, timeTaken,
      answers: processedAnswers
    });
    await result.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalScore: score, totalTests: 1 }
    });

    res.json({ result, message: 'Test submitted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit test.' });
  }
});

// Get result with answers and explanations
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('userId', 'name className');
    if (!result) return res.status(404).json({ error: 'Result not found.' });
    if (result.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Access denied.' });

    // Fetch questions with explanations
    const questionIds = result.answers.map(a => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = {};
    questions.forEach(q => { questionMap[q._id.toString()] = q; });

    res.json({ result, questions: questionMap });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch result.' });
  }
});

// Get result by share token (public)
router.get('/share/:token', async (req, res) => {
  try {
    const result = await Result.findOne({ shareToken: req.params.token })
      .populate('userId', 'name className');
    if (!result) return res.status(404).json({ error: 'Result not found.' });
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch result.' });
  }
});

// Get user's test history
router.get('/history/me', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const total = await Result.countDocuments({ userId: req.user._id });
    const results = await Result.find({ userId: req.user._id })
      .select('-answers')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(parseInt(limit));
    res.json({ results, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

module.exports = router;
