const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -resetToken');
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid token or account deactivated.' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {});
    if (!req.user) return;
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
    next();
  } catch (err) {
    res.status(403).json({ error: 'Access denied.' });
  }
};

// Fix: use inline admin check
const adminMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Access denied.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid token.' });
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = { auth, adminAuth: adminMiddleware };
