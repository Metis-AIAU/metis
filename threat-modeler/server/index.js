require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const { loadSecrets }                                        = require('./secrets');
const { verifyFirebaseToken, requireOrgMember } = require('./middleware/firebaseAuth');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────
const isProd = process.env.NODE_ENV === 'production';
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN
    ? process.env.ALLOWED_ORIGIN.split(',').map(s => s.trim())
    : (isProd ? false : '*'),          // prod with no ALLOWED_ORIGIN set → deny all cross-origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Org-Id'],
}));

app.use(express.json({ limit: '2mb' }));

// ── Health check (public — used by Cloud Run) ────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// ── Static frontend (production) ──────────────────────────────────────────
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ── Async startup: fetch secrets first, then wire routes ─────────────────
(async () => {
  await loadSecrets();

  // Routes required AFTER secret is loaded so Anthropic client picks up the key
  const analyzeRoutes    = require('./routes/analyze');
  const confluenceRoutes = require('./routes/confluence');
  const advancedRoutes   = require('./routes/advanced');
  const complianceRoutes = require('./routes/compliance');

  app.use('/api/analyze',    verifyFirebaseToken, requireOrgMember, analyzeRoutes);
  app.use('/api/confluence', verifyFirebaseToken, requireOrgMember, confluenceRoutes);
  app.use('/api/advanced',   verifyFirebaseToken, requireOrgMember, advancedRoutes);
  app.use('/api/compliance', verifyFirebaseToken, requireOrgMember, complianceRoutes);

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[server] Metis running on port ${PORT}`);
  });
})();
