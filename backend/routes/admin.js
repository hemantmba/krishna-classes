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
      .select('name className schoolName createdAt').sort({ createdAt: -1 }).limit(10);
    res.json({ totalUsers, totalQuestions, totalTests, recentUsers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// Get all users with filters
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { className, search, page = 1, limit = 20, isActive, schoolName } = req.query;
    const query = { role: 'student' };
    if (className) query.className = className;
    if (schoolName) query.schoolName = schoolName;
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

// Promote/change user role
router.patch('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'admin', 'manager'].includes(role)) return res.status(400).json({ error: 'Invalid role.' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ message: `User role changed to ${role}.`, user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role.' });
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

// ─── REPORTS ────────────────────────────────────────────────────────────────

// Helper: style header row bold + bg color
function styleSheet(ws, colCount) {
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= colCount - 1; C++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
    if (cell) {
      cell.s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '0D1B4B' } },
        alignment: { horizontal: 'center' }
      };
    }
  }
  return ws;
}

// Download users report (XLSX)
router.get('/reports/users', adminAuth, async (req, res) => {
  try {
    const { className, isActive, schoolName } = req.query;
    const query = { role: 'student' };
    if (className) query.className = className;
    if (schoolName) query.schoolName = schoolName;
    if (isActive !== undefined && isActive !== '') query.isActive = isActive === 'true';

    const users = await User.find(query)
      .select('-password -resetToken -__v')
      .sort({ totalScore: -1 });

    const data = users.map((u, i) => ({
      'S.No': i + 1,
      'Name': u.name,
      'Father Name': u.fatherName || '—',
      'Class': u.className,
      'School Name': u.schoolName || '—',
      'Email': u.email,
      'Language': u.language === 'hindi' ? 'हिंदी' : 'English',
      'Total Score': u.totalScore || 0,
      'Total Tests': u.totalTests || 0,
      'Avg Score': u.totalTests > 0 ? (u.totalScore / u.totalTests).toFixed(1) : 0,
      'Status': u.isActive ? 'Active' : 'Inactive',
      'Role': u.role,
      'Joined Date': u.createdAt?.toISOString().split('T')[0]
    }));

    // Set column widths
    const colWidths = [
      { wch: 6 }, { wch: 22 }, { wch: 22 }, { wch: 8 }, { wch: 30 },
      { wch: 28 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 10 }, { wch: 10 }, { wch: 14 }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="krishna_classes_students.xlsx"');
    res.send(buf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Report generation failed.' });
  }
});

// Download rank report (XLSX)
router.get('/reports/ranks', adminAuth, async (req, res) => {
  try {
    const { className, chapter, schoolName } = req.query;
    let data = [];

    if (chapter) {
      // Chapter-wise ranking
      const matchQuery = { chapter };
      if (className) matchQuery.className = className;

      const results = await Result.aggregate([
        { $match: matchQuery },
        { $sort: { percentage: -1, timeTaken: 1 } },
        {
          $group: {
            _id: '$userId',
            bestScore: { $first: '$score' },
            maxScore: { $first: '$maxScore' },
            bestPercentage: { $first: '$percentage' },
            timeTaken: { $first: '$timeTaken' },
            attempts: { $sum: 1 },
            chapter: { $first: '$chapter' },
            subject: { $first: '$subject' },
          }
        },
        { $sort: { bestPercentage: -1 } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' }
      ]);

      // Filter by school after lookup
      const filtered = schoolName
        ? results.filter(r => r.user.schoolName === schoolName)
        : results;

      data = filtered.map((r, i) => ({
        'Rank': i + 1,
        'Name': r.user.name,
        'Father Name': r.user.fatherName || '—',
        'Class': r.user.className,
        'School Name': r.user.schoolName || '—',
        'Email': r.user.email,
        'Language': r.user.language === 'hindi' ? 'हिंदी' : 'English',
        'Chapter': r.chapter || chapter,
        'Subject': r.subject || '—',
        'Best Score': r.bestScore,
        'Max Score': r.maxScore,
        'Percentage': r.bestPercentage + '%',
        'Time Taken (sec)': r.timeTaken,
        'Attempts': r.attempts
      }));
    } else {
      // Overall ranking
      const query = { role: 'student' };
      if (className) query.className = className;
      if (schoolName) query.schoolName = schoolName;

      const users = await User.find(query)
        .sort({ totalScore: -1 })
        .select('name fatherName className schoolName email language totalScore totalTests');

      data = users.map((u, i) => ({
        'Rank': i + 1,
        'Name': u.name,
        'Father Name': u.fatherName || '—',
        'Class': u.className,
        'School Name': u.schoolName || '—',
        'Email': u.email,
        'Language': u.language === 'hindi' ? 'हिंदी' : 'English',
        'Total Score': u.totalScore || 0,
        'Total Tests': u.totalTests || 0,
        'Avg Score': u.totalTests > 0 ? (u.totalScore / u.totalTests).toFixed(1) : 0,
      }));
    }

    // Column widths
    const colWidths = [
      { wch: 6 }, { wch: 22 }, { wch: 22 }, { wch: 8 }, { wch: 30 },
      { wch: 28 }, { wch: 10 }, { wch: 18 }, { wch: 14 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 10 }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, 'Rankings');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="krishna_classes_rankings.xlsx"');
    res.send(buf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Report generation failed.' });
  }
});

// Promote user to admin
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