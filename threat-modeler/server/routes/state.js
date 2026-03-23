const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/state ─────────────────────────────────────────────────────────
// Returns the user's full compliance state, or {} if none saved yet.
router.get('/', verifyToken, (req, res) => {
  const row = db
    .prepare('SELECT state_json FROM compliance_states WHERE user_id = ?')
    .get(req.user.id);

  if (!row) {
    return res.json({});
  }

  try {
    const state = JSON.parse(row.state_json);
    return res.json(state);
  } catch {
    // Corrupted state — return empty so frontend uses initial state
    return res.json({});
  }
});

// ── PUT /api/state ─────────────────────────────────────────────────────────
// Replaces the entire compliance state for the authenticated user.
router.put('/', verifyToken, (req, res) => {
  const state = req.body;

  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    return res.status(400).json({ error: 'Request body must be a JSON object.' });
  }

  try {
    const json = JSON.stringify(state);

    db.prepare(`
      INSERT INTO compliance_states (user_id, state_json, updated_at)
        VALUES (?, ?, datetime('now'))
      ON CONFLICT(user_id)
        DO UPDATE SET state_json = excluded.state_json,
                      updated_at = excluded.updated_at
    `).run(req.user.id, json);

    const row = db
      .prepare('SELECT updated_at FROM compliance_states WHERE user_id = ?')
      .get(req.user.id);

    return res.json({ ok: true, updated_at: row.updated_at });
  } catch (err) {
    console.error('[state/PUT]', err);
    return res.status(500).json({ error: 'Failed to save state.' });
  }
});

// ── POST /api/state/assessment ─────────────────────────────────────────────
// Incremental patch: updates a single control assessment atomically.
router.post('/assessment', verifyToken, (req, res) => {
  const { controlId, updates } = req.body || {};

  if (!controlId || typeof updates !== 'object' || Array.isArray(updates)) {
    return res.status(400).json({ error: 'controlId (string) and updates (object) are required.' });
  }

  try {
    const row = db
      .prepare('SELECT state_json FROM compliance_states WHERE user_id = ?')
      .get(req.user.id);

    // Parse existing state (or start from empty)
    let state = {};
    if (row) {
      try { state = JSON.parse(row.state_json); } catch { state = {}; }
    }

    const now = new Date().toISOString();
    const existing = (state.assessments && state.assessments[controlId]) || {};
    const previousStatus = existing.status || null;
    const newStatus = updates.status || existing.status;

    // Merge the control update
    if (!state.assessments) state.assessments = {};
    state.assessments[controlId] = { ...existing, ...updates, lastUpdated: now };

    // Append to embedded audit log (capped at 200)
    if (!Array.isArray(state.auditLog)) state.auditLog = [];
    state.auditLog = [
      {
        id: Date.now(),
        timestamp: now,
        controlId,
        previousStatus,
        newStatus,
        action: 'Assessment Updated',
      },
      ...state.auditLog,
    ].slice(0, 200);

    // Write everything back atomically
    db.exec('BEGIN');
    try {
      db.prepare(`
        INSERT INTO compliance_states (user_id, state_json, updated_at)
          VALUES (?, ?, datetime('now'))
        ON CONFLICT(user_id)
          DO UPDATE SET state_json = excluded.state_json,
                        updated_at = excluded.updated_at
      `).run(req.user.id, JSON.stringify(state));

      db.prepare(`
        INSERT INTO audit_log (user_id, control_id, previous_status, new_status)
          VALUES (?, ?, ?, ?)
      `).run(req.user.id, controlId, previousStatus, newStatus);

      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    return res.json({ ok: true, controlId, lastUpdated: now });
  } catch (err) {
    console.error('[state/assessment]', err);
    return res.status(500).json({ error: 'Failed to save assessment.' });
  }
});

module.exports = router;
