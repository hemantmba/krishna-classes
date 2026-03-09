const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Result = require('../models/Result');
const Question = require('../models/Question');
const { adminAuth } = require('../middleware/auth');
const XLSX = require('xlsx');

// Dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [totalUsers, totalQuestions, totalTests] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Question.countDocuments({ isActive: true }),
      Result.countDocuments({})
    ]);
    const recentUsers = await User.find({ role: 'student' })
      .select('name className createdAt').sort({ createdAt: -1 }).limit(10);
    res.json({ totalUsers, totalQuestions, totalTests, recentUsers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// Get all users with filters
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { className, search, page = 1, limit = 20, isActive } = req.query;
    const query = { role: 'student' };
    if (className) query.className = className;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -resetToken')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(parseInt(limit));

    res.json({ users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// Toggle user active status
router.patch('/users/:id/toggle', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Result.deleteMany({ userId: req.params.id });
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// Download users report (XLSX)
router.get('/reports/users', adminAuth, async (req, res) => {
  try {
    const { className, isActive } = req.query;
    const query = { role: 'student' };
    if (className) query.className = className;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const users = await User.find(query).select('-password -resetToken -__v');
    const data = users.map(u => ({
      'Name': u.name,
      'Father Name': u.fatherName,
      'Class': u.className,
      'Email': u.email,
      'Language': u.language,
      'Total Score': u.totalScore,
      'Total Tests': u.totalTests,
      'Status': u.isActive ? 'Active' : 'Inactive',
      'Joined': u.createdAt?.toISOString().split('T')[0]
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="krishna_classes_users.xlsx"');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: 'Report generation failed.' });
  }
});

// Download rank report (XLSX)
router.get('/reports/ranks', adminAuth, async (req, res) => {
  try {
    const { className, chapter } = req.query;
    let data = [];

    if (chapter) {
      const results = await Result.aggregate([
        { $match: { className: className || { $exists: true }, chapter } },
        { $sort: { percentage: -1, timeTaken: 1 } },
        { $group: {
          _id: '$userId',
          bestScore: { $first: '$score' },
          bestPercentage: { $first: '$percentage' },
          timeTaken: { $first: '$timeTaken' },
          attempts: { $sum: 1 }
        }},
        { $sort: { bestPercentage: -1 } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' }
      ]);
      data = results.map((r, i) => ({
        'Rank': i + 1, 'Name': r.user.name, 'Class': r.user.className,
        'Chapter': chapter, 'Best Score': r.bestScore, 'Percentage': r.bestPercentage + '%',
        'Time Taken (s)': r.timeTaken, 'Attempts': r.attempts
      }));
    } else {
      const query = className ? { className, role: 'student' } : { role: 'student' };
      const users = await User.find(query).sort({ totalScore: -1 }).select('name className totalScore totalTests');
      data = users.map((u, i) => ({
        'Rank': i + 1, 'Name': u.name, 'Class': u.className,
        'Total Score': u.totalScore, 'Total Tests': u.totalTests
      }));
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Rankings');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="krishna_classes_ranks.xlsx"');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: 'Report generation failed.' });
  }
});

// Promote user to admin (using admin secret)
router.post('/make-admin', adminAuth, async (req, res) => {
  try {
    const { userId } = req.body;
    await User.findByIdAndUpdate(userId, { role: 'admin' });
    res.json({ message: 'User promoted to admin.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed.' });
  }
});

module.exports = router;
