const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Question = require('../models/Question');
const { auth, adminAuth } = require('../middleware/auth');

// Manager auth middleware
const managerAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Manager or Admin access required' });
  }
  next();
};

// Storage for question images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/questions';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `q_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ─── STUDENT ROUTES ──────────────────────────────────────────────────────────

// Get questions for a test (only approved questions)
router.get('/test', auth, async (req, res) => {
  try {
    const { className, chapter, medium, limit = 20 } = req.query;
    const query = { className, chapter, medium, isActive: true, status: 'approved' };
    const total = await Question.countDocuments(query);
    const questions = await Question.aggregate([
      { $match: query },
      { $sample: { size: Math.min(parseInt(limit), total, 50) } },
      { $project: { correctOption: 0, explanation: 0, createdBy: 0, pendingData: 0 } }
    ]);
    res.json({ questions, total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch questions.' });
  }
});

// Get classes and chapters list (only approved)
router.get('/meta', auth, async (req, res) => {
  try {
    const { medium } = req.query;
    const query = medium ? { medium, isActive: true, status: 'approved' } : { isActive: true, status: 'approved' };
    const data = await Question.aggregate([
      { $match: query },
      { $group: { _id: { className: '$className', chapter: '$chapter', subject: '$subject' }, count: { $sum: 1 } } },
      { $sort: { '_id.className': 1, '_id.chapter': 1 } }
    ]);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch metadata.' });
  }
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

// Admin: Add single question (auto-approved)
router.post('/', adminAuth, upload.fields([
  { name: 'questionImage', maxCount: 1 },
  { name: 'option0Image', maxCount: 1 },
  { name: 'option1Image', maxCount: 1 },
  { name: 'option2Image', maxCount: 1 },
  { name: 'option3Image', maxCount: 1 },
]), async (req, res) => {
  try {
    const { questionText, options, correctOption, medium, className, chapter, subject, explanation, difficulty, isLatex } = req.body;
    let parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;

    for (let i = 0; i < 4; i++) {
      if (req.files?.[`option${i}Image`]) {
        parsedOptions[i].image = req.files[`option${i}Image`][0].path;
      }
    }

    const question = new Question({
      questionText,
      questionImage: req.files?.questionImage?.[0]?.path,
      isLatex: isLatex === 'true',
      options: parsedOptions,
      correctOption: parseInt(correctOption),
      medium, className, chapter, subject, explanation,
      difficulty: difficulty || 'medium',
      createdBy: req.user._id,
      status: 'approved', // admin questions auto-approved
      approvedBy: req.user._id,
      approvedAt: new Date()
    });
    await question.save();
    res.status(201).json({ message: 'Question added successfully.', question });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add question.' });
  }
});

// Admin: Bulk upload (auto-approved)
router.post('/bulk', adminAuth, upload.single('file'), async (req, res) => {
  try {
    const { medium, className, chapter, subject } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    let rows = [];

    if (ext === '.csv') {
      const { parse } = require('csv-parse/sync');
      const content = fs.readFileSync(req.file.path);
      rows = parse(content, { columns: true, skip_empty_lines: true, trim: true });
    } else if (ext === '.xlsx' || ext === '.xls') {
      const XLSX = require('xlsx');
      const workbook = XLSX.readFile(req.file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet);
    } else {
      return res.status(400).json({ error: 'Only CSV or XLSX files allowed.' });
    }

    const questions = rows.map((row, idx) => {
      const questionText = (row.question || row.Question || row.questionText || '').toString().trim();
      const optA = (row.optionA || row['Option A'] || row.option_a || row.A || '').toString().trim();
      const optB = (row.optionB || row['Option B'] || row.option_b || row.B || '').toString().trim();
      const optC = (row.optionC || row['Option C'] || row.option_c || row.C || '').toString().trim();
      const optD = (row.optionD || row['Option D'] || row.option_d || row.D || '').toString().trim();
      const answerRaw = (row.answer || row.Answer || 'A').toString().trim().toUpperCase();
      const correctOption = ['A', 'B', 'C', 'D'].indexOf(answerRaw);
      const mediumVal = (row.medium || row.Medium || medium || 'hindi').toString().trim().toLowerCase();
      const classVal = (row.className || row.class || row.Class || className || '').toString().trim();
      const chapterVal = (row.chapter || row.Chapter || chapter || '').toString().trim();
      const subjectVal = (row.subject || row.Subject || subject || '').toString().trim();
      const difficultyVal = (row.difficulty || row.Difficulty || 'medium').toString().trim().toLowerCase();
      const isLatexVal = (row.isLatex || row.IsLatex || 'false').toString().trim().toLowerCase() === 'true';
      const explanation = (row.explanation || row.Explanation || '').toString().trim();

      return {
        questionText,
        options: [
          { text: optA, isLatex: false }, { text: optB, isLatex: false },
          { text: optC, isLatex: false }, { text: optD, isLatex: false },
        ],
        correctOption,
        medium: mediumVal, className: classVal, chapter: chapterVal,
        subject: subjectVal, explanation,
        difficulty: ['easy', 'medium', 'hard'].includes(difficultyVal) ? difficultyVal : 'medium',
        isLatex: isLatexVal,
        createdBy: req.user._id,
        isActive: true,
        status: 'approved', // admin bulk upload auto-approved
        approvedBy: req.user._id,
        approvedAt: new Date()
      };
    }).filter(q => q.questionText.length > 0 && q.correctOption >= 0 && q.options.every(o => o.text.length > 0));

    if (questions.length === 0) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'No valid questions found. Check answer column must be A/B/C/D and all options must be filled.' });
    }

    await Question.insertMany(questions, { ordered: false });
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json({ message: `${questions.length} questions uploaded successfully.`, uploaded: questions.length, skipped: rows.length - questions.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Bulk upload failed: ' + err.message });
  }
});

// Admin: Get all questions with filters (includes pending)
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const { className, chapter, medium, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (className) query.className = className;
    if (chapter) query.chapter = chapter;
    if (medium) query.medium = medium;
    if (status) query.status = status;

    const total = await Question.countDocuments(query);
    const questions = await Question.find(query)
      .populate('createdBy', 'name role')
      .skip((page - 1) * limit).limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({ questions, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch questions.' });
  }
});

// Admin: Get pending count (for badge)
router.get('/pending-count', adminAuth, async (req, res) => {
  try {
    const count = await Question.countDocuments({ status: 'pending' });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending count.' });
  }
});

// Admin: Approve a question or pending edit
router.patch('/:id/approve', adminAuth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    // If question has pending edit data, apply it
    if (question.pendingData && question.pendingData.questionText) {
      question.questionText = question.pendingData.questionText;
      question.isLatex = question.pendingData.isLatex;
      question.options = question.pendingData.options;
      question.correctOption = question.pendingData.correctOption;
      question.medium = question.pendingData.medium;
      question.className = question.pendingData.className;
      question.chapter = question.pendingData.chapter;
      question.subject = question.pendingData.subject;
      question.explanation = question.pendingData.explanation;
      question.difficulty = question.pendingData.difficulty;
      question.pendingData = undefined;
    }

    question.status = 'approved';
    question.approvedBy = req.user._id;
    question.approvedAt = new Date();
    question.rejectedReason = undefined;
    await question.save();

    res.json({ message: 'Question approved successfully', question });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve question' });
  }
});

// Admin: Reject a question
router.patch('/:id/reject', adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    // If rejecting an edit, clear pending data but keep original
    if (question.pendingData && question.pendingData.questionText) {
      question.pendingData = undefined;
      question.status = 'approved'; // revert to approved with original data
    } else {
      question.status = 'rejected';
    }
    question.rejectedReason = reason || 'Rejected by admin';
    await question.save();

    res.json({ message: 'Question rejected', question });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject question' });
  }
});

// Admin: Edit question directly (auto-approved)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { questionText, options, correctOption, medium, className,
      chapter, subject, explanation, difficulty, isLatex } = req.body;

    const updated = await Question.findByIdAndUpdate(
      req.params.id,
      {
        questionText,
        options: options.map(o => ({ text: o.text, isLatex: false })),
        correctOption: parseInt(correctOption),
        medium, className, chapter, subject, explanation,
        difficulty: difficulty || 'medium',
        isLatex: isLatex === true || isLatex === 'true',
        status: 'approved',
        pendingData: undefined
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Question not found' });
    res.json({ message: 'Question updated successfully', question: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// Admin: Delete question
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete question.' });
  }
});

// ─── MANAGER ROUTES ───────────────────────────────────────────────────────────

// Manager: Bulk upload (saved as pending)
router.post('/manager-bulk', auth, managerAuth, upload.single('file'), async (req, res) => {
  try {
    const { medium, className, chapter, subject } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    let rows = [];

    if (ext === '.csv') {
      const { parse } = require('csv-parse/sync');
      const content = fs.readFileSync(req.file.path);
      rows = parse(content, { columns: true, skip_empty_lines: true, trim: true });
    } else if (ext === '.xlsx' || ext === '.xls') {
      const XLSX = require('xlsx');
      const workbook = XLSX.readFile(req.file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet);
    } else {
      return res.status(400).json({ error: 'Only CSV or XLSX files allowed.' });
    }

    const questions = rows.map(row => {
      const questionText = (row.question || row.Question || row.questionText || '').toString().trim();
      const optA = (row.optionA || row['Option A'] || row.option_a || row.A || '').toString().trim();
      const optB = (row.optionB || row['Option B'] || row.option_b || row.B || '').toString().trim();
      const optC = (row.optionC || row['Option C'] || row.option_c || row.C || '').toString().trim();
      const optD = (row.optionD || row['Option D'] || row.option_d || row.D || '').toString().trim();
      const answerRaw = (row.answer || row.Answer || 'A').toString().trim().toUpperCase();
      const correctOption = ['A', 'B', 'C', 'D'].indexOf(answerRaw);
      const mediumVal = (row.medium || row.Medium || medium || 'hindi').toString().trim().toLowerCase();
      const classVal = (row.className || row.class || row.Class || className || '').toString().trim();
      const chapterVal = (row.chapter || row.Chapter || chapter || '').toString().trim();
      const subjectVal = (row.subject || row.Subject || subject || '').toString().trim();
      const difficultyVal = (row.difficulty || row.Difficulty || 'medium').toString().trim().toLowerCase();
      const isLatexVal = (row.isLatex || row.IsLatex || 'false').toString().trim().toLowerCase() === 'true';
      const explanation = (row.explanation || row.Explanation || '').toString().trim();

      return {
        questionText,
        options: [
          { text: optA, isLatex: false }, { text: optB, isLatex: false },
          { text: optC, isLatex: false }, { text: optD, isLatex: false },
        ],
        correctOption,
        medium: mediumVal, className: classVal, chapter: chapterVal,
        subject: subjectVal, explanation,
        difficulty: ['easy', 'medium', 'hard'].includes(difficultyVal) ? difficultyVal : 'medium',
        isLatex: isLatexVal,
        createdBy: req.user._id,
        isActive: true,
        status: 'pending' // manager uploads need approval
      };
    }).filter(q => q.questionText.length > 0 && q.correctOption >= 0 && q.options.every(o => o.text.length > 0));

    if (questions.length === 0) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'No valid questions found.' });
    }

    await Question.insertMany(questions, { ordered: false });
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json({ message: `${questions.length} questions submitted for admin approval.`, uploaded: questions.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Bulk upload failed: ' + err.message });
  }
});

// Manager: Get own questions
router.get('/manager-questions', auth, managerAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { createdBy: req.user._id };
    if (status) query.status = status;

    const total = await Question.countDocuments(query);
    const questions = await Question.find(query)
      .skip((page - 1) * limit).limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({ questions, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch questions.' });
  }
});

// Manager: Edit question (saves as pendingData, sets status to pending)
router.put('/:id/manager-edit', auth, managerAuth, async (req, res) => {
  try {
    const { questionText, options, correctOption, medium, className,
      chapter, subject, explanation, difficulty, isLatex } = req.body;

    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    // Only allow manager to edit their own questions
    if (req.user.role === 'manager' && question.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only edit your own questions' });
    }

    // Save pending edit — keep original until admin approves
    question.pendingData = {
      questionText,
      isLatex: isLatex === true || isLatex === 'true',
      options: options.map(o => ({ text: o.text, isLatex: false })),
      correctOption: parseInt(correctOption),
      medium, className, chapter, subject, explanation,
      difficulty: difficulty || 'medium',
      editedAt: new Date(),
      editedBy: req.user._id
    };
    question.status = 'pending';
    await question.save();

    res.json({ message: 'Edit submitted for admin approval.', question });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit edit' });
  }
});

module.exports = router;