const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Placeholder - test logic is in results route
router.get('/ping', auth, (req, res) => res.json({ ok: true }));

module.exports = router;
