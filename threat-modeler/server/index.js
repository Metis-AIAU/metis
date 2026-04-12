require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Initialise the database (creates tables on first run)
require('./db');

const authRoutes       = require('./routes/auth');
const stateRoutes      = require('./routes/state');
const meRoutes         = require('./routes/me');
const analyzeRoutes    = require('./routes/analyze');
const confluenceRoutes = require('./routes/confluence');
const advancedRoutes   = require('./routes/advanced');

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
app.use('/api/auth',       authRoutes);
app.use('/api/state',      stateRoutes);
app.use('/api/me',         meRoutes);
app.use('/api/analyze',    analyzeRoutes);
app.use('/api/confluence', confluenceRoutes);
app.use('/api/advanced',  advancedRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// 404 fallback for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Static frontend (production) ──────────────────────────────────────────
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback — serve index.html for any non-API route
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ── Start ─────────────────────────────────────────────────────────────────
// Bind to 0.0.0.0 so Cloud Run's health checks can reach the container
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] Metis running on port ${PORT}`);
});
