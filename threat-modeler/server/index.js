require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const { verifyFirebaseToken } = require('./middleware/firebaseAuth');
const analyzeRoutes    = require('./routes/analyze');
const confluenceRoutes = require('./routes/confluence');
const advancedRoutes   = require('./routes/advanced');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '2mb' }));

// ── Routes (all require Firebase auth) ───────────────────────────────────
app.use('/api/analyze',    verifyFirebaseToken, analyzeRoutes);
app.use('/api/confluence', verifyFirebaseToken, confluenceRoutes);
app.use('/api/advanced',   verifyFirebaseToken, advancedRoutes);

// Health check (public — used by Cloud Run)
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Static frontend (production) ──────────────────────────────────────────
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] Metis running on port ${PORT}`);
});
