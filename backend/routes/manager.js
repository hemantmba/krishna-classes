const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Result = require('../models/Result');
const { auth } = require('../middleware/auth');

// Manager auth middleware
const managerAuth = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Manager access required' });
  }
  next();
};

// Get all schools list
router.get('/schools', auth, managerAuth, async (req, res) => {
  try {
    const schools = await User.distinct('schoolName', {
      role: 'student',
      schoolName: { $ne: '' }
    });
    res.json({ schools: schools.sort() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
});

// Get rankings filtered by school
router.get('/rankings', auth, managerAuth, async (req, res) => {
  try {
    const { schoolName, className, page = 1, limit = 50 } = req.query;

    const query = { role: 'student', isActive: true };
    if (schoolName) query.schoolName = schoolName;
    if (className) query.className = className;

    const total = await User.countDocuments(query);

    const students = await User.find(query)
      .select('name fatherName className schoolName totalScore totalTests language createdAt')
      .sort({ totalScore: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Add rank number
    const offset = (page - 1) * limit;
    const rankedStudents = students.map((s, i) => ({
      ...s.toObject(),
      rank: offset + i + 1,
      avgScore: s.totalTests > 0 ? (s.totalScore / s.totalTests).toFixed(1) : 0
    }));

    res.json({ students: rankedStudents, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rankings' });
  }
});

// Get school-wise summary
router.get('/school-summary', auth, managerAuth, async (req, res) => {
  try {
    const summary = await User.aggregate([
      { $match: { role: 'student', schoolName: { $ne: '' } } },
      {
        $group: {
          _id: '$schoolName',
          totalStudents: { $sum: 1 },
          totalScore: { $sum: '$totalScore' },
          totalTests: { $sum: '$totalTests' },
          avgScore: { $avg: '$totalScore' },
          topScore: { $max: '$totalScore' }
        }
      },
      { $sort: { avgScore: -1 } }
    ]);

    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch school summary' });
  }
});

// Get stats overview
router.get('/stats', auth, managerAuth, async (req, res) => {
  try {
    const { schoolName } = req.query;
    const query = { role: 'student' };
    if (schoolName) query.schoolName = schoolName;

    const totalStudents = await User.countDocuments(query);
    const activeStudents = await User.countDocuments({ ...query, totalTests: { $gt: 0 } });
    const schools = await User.distinct('schoolName', { role: 'student', schoolName: { $ne: '' } });

    res.json({ totalStudents, activeStudents, totalSchools: schools.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;