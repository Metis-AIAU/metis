require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Initialise the database (creates tables on first run)
require('./db');

const authRoutes = require('./routes/auth');
const stateRoutes = require('./routes/state');
const meRoutes = require('./routes/me');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Accept up to 2MB JSON bodies (compliance state blobs can be large)
app.use(express.json({ limit: '2mb' }));

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/state', stateRoutes);
app.use('/api/me', meRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// 404 fallback for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] OT Compliance API running on http://localhost:${PORT}`);
});
