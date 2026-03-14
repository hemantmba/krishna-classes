const express = require('express');
const router = express.Router();
const School = require('../models/School');
const { auth, adminAuth } = require('../middleware/auth');

// Public - get all active schools (for registration dropdown)
router.get('/', async (req, res) => {
  try {
    const schools = await School.find({ isActive: true }).sort({ name: 1 }).select('name');
    res.json({ schools });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
});

// Admin - add new school
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'School name is required' });
    const existing = await School.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ error: 'School already exists' });
    const school = await School.create({ name: name.trim(), createdBy: req.user._id });
    res.status(201).json({ school, message: 'School added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add school' });
  }
});

// Admin - delete school
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await School.findByIdAndDelete(req.params.id);
    res.json({ message: 'School deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete school' });
  }
});

module.exports = router;