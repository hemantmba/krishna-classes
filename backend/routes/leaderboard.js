const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Overall leaderboard — supports schoolName and className filter
router.get('/overall', auth, async (req, res) => {
  try {
    const { limit = 50, schoolName, className } = req.query;

    // Build filter query
    const query = { role: 'student', isActive: true };
    if (schoolName) query.schoolName = schoolName;
    if (className) query.className = className;

    const topUsers = await User.find(query)
      .select('name className schoolName totalScore totalTests')
      .sort({ totalScore: -1 })
      .limit(parseInt(limit));

    const leaderboard = topUsers.map((user, idx) => ({
      rank: idx + 1,
      ...user.toObject()
    }));

    // Find current user's rank (with same filters)
    const myRankQuery = { ...query, totalScore: { $gt: req.user.totalScore } };
    const myRank = await User.countDocuments(myRankQuery) + 1;

    res.json({ leaderboard, myRank });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
});

// Class-wise leaderboard — supports schoolName filter
router.get('/class', auth, async (req, res) => {
  try {
    const { className, schoolName } = req.query;
    if (!className) return res.status(400).json({ error: 'className required.' });

    const query = { className, role: 'student', isActive: true };
    if (schoolName) query.schoolName = schoolName;

    const topUsers = await User.find(query)
      .select('name className schoolName totalScore totalTests')
      .sort({ totalScore: -1 })
      .limit(50);

    const leaderboard = topUsers.map((u, i) => ({ rank: i + 1, ...u.toObject() }));

    // My rank in this class
    const myRankQuery = { ...query, totalScore: { $gt: req.user.totalScore } };
    const myRank = await User.countDocuments(myRankQuery) + 1;

    res.json({ leaderboard, myRank });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
});

// Chapter-wise leaderboard — supports schoolName filter
router.get('/chapter', auth, async (req, res) => {
  try {
    const { className, chapter, schoolName } = req.query;
    if (!className || !chapter) return res.status(400).json({ error: 'className and chapter required.' });

    const results = await Result.aggregate([
      { $match: { className, chapter } },
      { $sort: { percentage: -1, timeTaken: 1 } },
      {
        $group: {
          _id: '$userId',
          bestScore: { $first: '$score' },
          bestPercentage: { $first: '$percentage' },
          timeTaken: { $first: '$timeTaken' },
          attempts: { $sum: 1 }
        }
      },
      { $sort: { bestPercentage: -1, timeTaken: 1 } },
      { $limit: 100 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          className: '$user.className',
          schoolName: '$user.schoolName',
          bestScore: 1,
          bestPercentage: 1,
          timeTaken: 1,
          attempts: 1
        }
      }
    ]);

    // Apply school filter after lookup
    const filtered = schoolName
      ? results.filter(r => r.schoolName === schoolName)
      : results;

    const leaderboard = filtered.slice(0, 50).map((r, i) => ({ ...r, rank: i + 1 }));
    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
});

module.exports = router;