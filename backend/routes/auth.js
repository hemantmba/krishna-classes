const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, fatherName, className, email, password, language, schoolName } = req.body;
    if (!name || !fatherName || !className || !email || !password)
      return res.status(400).json({ error: 'All fields are required.' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered.' });

    const user = new User({
      name, fatherName, className, email, password,
      language: language || 'hindi',
      schoolName: schoolName || ''
    });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password.' });
    if (!user.isActive) return res.status(400).json({ error: 'Account is deactivated. Contact admin.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password.' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Login failed.' });
  }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'No account found with this email.' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    if (scriptUrl) {
      const https = require('https');
      const querystring = require('querystring');
      const params = querystring.stringify({ to: email, name: user.name, resetLink, app: 'Krishna Classes' });
      https.get(`${scriptUrl}?${params}`, () => {}).on('error', () => {});
    }

    res.json({ message: 'Password reset link sent to your email.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send reset email.' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token.' });

    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    res.json({ message: 'Password reset successful.' });
  } catch (err) {
    res.status(500).json({ error: 'Password reset failed.' });
  }
});

// Change password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect.' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Password change failed.' });
  }
});

// Get current user — always returns fresh data from DB
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -resetToken -resetTokenExpiry');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Helper — always includes role, schoolName, all needed fields
function safeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    fatherName: user.fatherName,
    email: user.email,
    className: user.className,
    language: user.language,
    role: user.role,
    schoolName: user.schoolName || '',
    totalScore: user.totalScore || 0,
    totalTests: user.totalTests || 0,
    isActive: user.isActive,
    avatar: user.avatar,
    createdAt: user.createdAt
  };
}

module.exports = router;