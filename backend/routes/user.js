const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Update language preference
router.patch('/language', auth, async (req, res) => {
  try {
    const { language } = req.body;
    await User.findByIdAndUpdate(req.user._id, { language });
    res.json({ message: 'Language updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed.' });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -resetToken');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed.' });
  }
});

module.exports = router;
