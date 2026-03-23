const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { isValidUsername, isValidPassword } = require('../utils/validate');
require('dotenv').config();

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ── POST /api/auth/register ────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  if (!isValidUsername(username)) {
    return res.status(400).json({
      error: 'Username must be 3–50 characters and contain only letters, numbers, underscores, or hyphens.',
    });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  // Check for existing username (case-insensitive via COLLATE NOCASE)
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: 'Username is already taken.' });
  }

  try {
    const hash = await bcrypt.hash(password, 12);

    // Atomic: insert user + empty state row together
    db.exec('BEGIN');
    try {
      const { lastInsertRowid: userId } = db
        .prepare('INSERT INTO users (username, password) VALUES (?, ?)')
        .run(username, hash);

      db.prepare("INSERT INTO compliance_states (user_id, state_json) VALUES (?, '{}')").run(userId);
      db.exec('COMMIT');

      const user = { id: Number(userId), username };
      const token = signToken(user);
      return res.status(201).json({ token, user });
    } catch (innerErr) {
      db.exec('ROLLBACK');
      throw innerErr;
    }
  } catch (err) {
    console.error('[auth/register]', err);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ── POST /api/auth/login ───────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  // Use same error message for "not found" and "wrong password" to prevent enumeration
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  try {
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Update last_login timestamp
    db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);

    const token = signToken({ id: Number(user.id), username: user.username });
    return res.json({ token, user: { id: Number(user.id), username: user.username } });
  } catch (err) {
    console.error('[auth/login]', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

module.exports = router;
