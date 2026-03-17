const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Question = require('../models/Question');
const { auth, adminAuth } = require('../middleware/auth');

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

// Get questions for a test (students)
router.get('/test', auth, async (req, res) => {
  try {
    const { className, chapter, medium, limit = 20 } = req.query;
    const query = { className, chapter, medium, isActive: true };
    const total = await Question.countDocuments(query);
    const questions = await Question.aggregate([
      { $match: query },
      { $sample: { size: Math.min(parseInt(limit), total, 50) } },
      { $project: { correctOption: 0, explanation: 0, createdBy: 0 } }
    ]);
    res.json({ questions, total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch questions.' });
  }
});

// Get classes and chapters list
router.get('/meta', auth, async (req, res) => {
  try {
    const { medium } = req.query;
    const query = medium ? { medium, isActive: true } : { isActive: true };
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

// Admin: Add single question
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
      createdBy: req.user._id
    });
    await question.save();
    res.status(201).json({ message: 'Question added successfully.', question });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add question.' });
  }
});

// Admin: Bulk upload via CSV/XLSX
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
      // Support multiple column name formats
      const questionText = (row.question || row.Question || row.questionText || '').toString().trim();

      // Support: optionA, Option A, option_a, A
      const optA = (row.optionA || row['Option A'] || row.option_a || row.A || '').toString().trim();
      const optB = (row.optionB || row['Option B'] || row.option_b || row.B || '').toString().trim();
      const optC = (row.optionC || row['Option C'] || row.option_c || row.C || '').toString().trim();
      const optD = (row.optionD || row['Option D'] || row.option_d || row.D || '').toString().trim();

      // Support: answer, Answer — must be A/B/C/D
      const answerRaw = (row.answer || row.Answer || 'A').toString().trim().toUpperCase();
      const correctOption = ['A', 'B', 'C', 'D'].indexOf(answerRaw);

      // Support: medium, Medium
      const mediumVal = (row.medium || row.Medium || medium || 'hindi').toString().trim().toLowerCase();

      // Support: className, class, Class
      const classVal = (row.className || row.class || row.Class || className || '').toString().trim();

      // Support: chapter, Chapter
      const chapterVal = (row.chapter || row.Chapter || chapter || '').toString().trim();

      // Support: subject, Subject
      const subjectVal = (row.subject || row.Subject || subject || '').toString().trim();

      // Support: difficulty, Difficulty — normalize to lowercase
      const difficultyVal = (row.difficulty || row.Difficulty || 'medium').toString().trim().toLowerCase();

      // Support: isLatex, IsLatex, FALSE/TRUE/false/true
      const isLatexVal = (row.isLatex || row.IsLatex || 'false').toString().trim().toLowerCase() === 'true';

      const explanation = (row.explanation || row.Explanation || '').toString().trim();

      if (!questionText) {
        console.log(`Row ${idx + 1}: Skipped — empty question text`);
      }
      if (correctOption === -1) {
        console.log(`Row ${idx + 1}: Skipped — invalid answer "${answerRaw}" for question: "${questionText}"`);
      }

      return {
        questionText,
        options: [
          { text: optA, isLatex: false },
          { text: optB, isLatex: false },
          { text: optC, isLatex: false },
          { text: optD, isLatex: false },
        ],
        correctOption,
        medium: mediumVal,
        className: classVal,
        chapter: chapterVal,
        subject: subjectVal,
        explanation,
        difficulty: ['easy', 'medium', 'hard'].includes(difficultyVal) ? difficultyVal : 'medium',
        isLatex: isLatexVal,
        createdBy: req.user._id,
        isActive: true
      };
    }).filter(q => {
      return (
        q.questionText.length > 0 &&
        q.correctOption >= 0 &&
        q.options.every(o => o.text.length > 0)
      );
    });

    if (questions.length === 0) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: 'No valid questions found. Check: (1) answer column must be A/B/C/D, (2) all options must be filled, (3) question column must not be empty.'
      });
    }

    await Question.insertMany(questions, { ordered: false });
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json({
      message: `${questions.length} questions uploaded successfully.`,
      uploaded: questions.length,
      skipped: rows.length - questions.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Bulk upload failed: ' + err.message });
  }
});

// Admin: Edit/Update question
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
        isLatex: isLatex === true || isLatex === 'true'
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

// Admin: Get all questions with filters
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const { className, chapter, medium, page = 1, limit = 20 } = req.query;
    const query = {};
    if (className) query.className = className;
    if (chapter) query.chapter = chapter;
    if (medium) query.medium = medium;

    const total = await Question.countDocuments(query);
    const questions = await Question.find(query)
      .skip((page - 1) * limit).limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({ questions, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch questions.' });
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

module.exports = router;