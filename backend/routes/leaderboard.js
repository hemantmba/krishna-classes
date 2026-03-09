const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Overall leaderboard
router.get('/overall', auth, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const topUsers = await User.find({ role: 'student', isActive: true })
      .select('name className totalScore totalTests')
      .sort({ totalScore: -1 })
      .limit(parseInt(limit));

    const leaderboard = topUsers.map((user, idx) => ({
      rank: idx + 1,
      ...user.toObject()
    }));

    // Find current user's rank
    const myRank = await User.countDocuments({
      role: 'student',
      isActive: true,
      totalScore: { $gt: req.user.totalScore }
    }) + 1;

    res.json({ leaderboard, myRank });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
});

// Chapter-wise leaderboard
router.get('/chapter', auth, async (req, res) => {
  try {
    const { className, chapter } = req.query;
    if (!className || !chapter) return res.status(400).json({ error: 'className and chapter required.' });

    const results = await Result.aggregate([
      { $match: { className, chapter } },
      { $sort: { percentage: -1, timeTaken: 1 } },
      { $group: {
        _id: '$userId',
        bestScore: { $first: '$score' },
        bestPercentage: { $first: '$percentage' },
        timeTaken: { $first: '$timeTaken' },
        attempts: { $sum: 1 }
      }},
      { $sort: { bestPercentage: -1, timeTaken: 1 } },
      { $limit: 50 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: {
        userId: '$_id',
        name: '$user.name',
        className: '$user.className',
        bestScore: 1, bestPercentage: 1, timeTaken: 1, attempts: 1
      }}
    ]);

    const leaderboard = results.map((r, i) => ({ ...r, rank: i + 1 }));
    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
});

// Class-wise leaderboard
router.get('/class', auth, async (req, res) => {
  try {
    const { className } = req.query;
    if (!className) return res.status(400).json({ error: 'className required.' });

    const topUsers = await User.find({ className, role: 'student', isActive: true })
      .select('name className totalScore totalTests')
      .sort({ totalScore: -1 }).limit(50);

    const leaderboard = topUsers.map((u, i) => ({ rank: i + 1, ...u.toObject() }));
    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
});

module.exports = router;
