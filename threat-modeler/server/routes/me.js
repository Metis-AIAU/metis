const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/me ────────────────────────────────────────────────────────────
router.get('/', verifyToken, (req, res) => {
  const user = db
    .prepare('SELECT id, username, created_at, last_login FROM users WHERE id = ?')
    .get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  return res.json(user);
});

module.exports = router;
