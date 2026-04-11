# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

All commands run from `threat-modeler/`.

### Frontend (Vite + React)
```bash
npm run dev        # dev server on :5173 (proxies /api/* → :3001)
npm run build      # production build → dist/
npm run lint       # ESLint
```

### Backend (Express)
```bash
cd server
npm run dev        # watch mode (node --watch --experimental-sqlite)
npm start          # production
```

> The `--experimental-sqlite` flag is required — the server uses Node's built-in `node:sqlite` module (Node 20+).

### End-to-end tests
```bash
npm run test:e2e          # headless Playwright
npm run test:e2e:ui       # Playwright UI mode
npm run test:e2e:report   # view last report
```

### Docker (local)
```bash
docker build -t metis-local .
docker run -p 8080:8080 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e JWT_SECRET=dev-secret \
  metis-local
```

---

## Environment variables

**`threat-modeler/.env`** (frontend, Vite — prefix `VITE_`):
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, etc.

**`threat-modeler/server/.env`** (backend):
- `ANTHROPIC_API_KEY` — Claude API key for AI analysis
- `JWT_SECRET` — signs auth tokens for the Express session system
- `PORT` — defaults to `3001` (dev) / `8080` (Cloud Run)
- `DB_PATH` — SQLite file path, defaults to `./data/compliance.db`
- `ALLOWED_ORIGIN` — CORS origin, defaults to `*`

---

## Architecture

### Two co-existing auth systems

The app has **two separate auth layers** that handle different concerns:

1. **Firebase Auth + Firestore** — primary user identity and threat-model data storage.  
   `src/context/AuthContext.jsx` wraps `onAuthStateChanged`; `src/firebase.js` exports `auth` and `db`.  
   User profiles live at `Firestore: users/{uid}` and threat data at `users/{uid}/data/threatData`.

2. **Express JWT auth** (`server/routes/auth.js` + `server/middleware/auth.js`) — guards the compliance and AI backend routes. Uses bcrypt passwords stored in SQLite and issues short-lived JWTs.  
   These are separate credentials from Firebase; a user must be registered in both systems.

### Data flow and state

`ThreatContext` (`src/context/ThreatContext.jsx`) is the central store — a `useReducer` holding `projects`, `threats`, `controls`, `assets`, `dataFlows`. It:
- Loads from Firestore on login, falls back to `localStorage` → sample data offline.
- Debounces writes back to Firestore (1.5 s) after every state change.
- Supports **team sharing**: if the user belongs to a team, shared collections are overlaid from/written to a team Firestore doc and kept live via `onSnapshot`.

**Critical field-name duality**: AI analysis results coming from `POST /api/analyze` use `name`/`strideCategory`/`riskLevel`/`riskScore` as canonical fields. The Diagram page stores AI results in `project.workspaceThreatRows` (a non-standard field on the project object), while `getProjectThreats(projectId)` reads only from `state.threats`. ProjectDetail merges both sources with field normalisation:
```js
const workspaceRows = (project.workspaceThreatRows || []).map(r => ({
  ...r,
  name: r.name || r.threat,
  strideCategory: r.strideCategory || r.stride?.[0],
  riskLevel: r.riskLevel || r.risk,
  riskScore: r.riskScore ?? (r.likelihood * r.impact),
}));
```

### Backend routes

| Route | Purpose |
|-------|---------|
| `POST /api/auth/register` / `/login` | SQLite-based JWT auth |
| `GET /api/me` | JWT-protected profile |
| `GET/PUT /api/state` | Compliance framework state (SQLite `compliance_states`) |
| `POST /api/analyze` | Single-project STRIDE threat generation via Claude |
| `POST /api/confluence/page` | Proxy page creation to Atlassian REST API |
| `POST /api/advanced/full-docs` | Full STRIDE model from architecture doc text |
| `POST /api/advanced/verify` | Source code security control evidence (file:line) |
| `POST /api/advanced/compliance-map` | Map threats → OWASP/SOC2/PCI-DSS/ISO27001/NIST |
| `POST /api/advanced/drift` | Security drift detection from git diff |

All `/api/advanced/*` and `/api/analyze` routes call Claude (`claude-sonnet-4-6`) and return structured JSON. They strip markdown fences before `JSON.parse`.

### Frontend pages and routing

Routes are defined in `src/App.jsx`; sidebar navigation in `src/components/Layout.jsx`.

| Path | Page | Notes |
|------|------|-------|
| `/` | Dashboard | Overview stats |
| `/projects` | Projects | List; links to ProjectDetail |
| `/projects/:projectId` | ProjectDetail | Tabs: Overview, Threats, Attack Paths, Controls, Assets, Data Flows |
| `/diagram` | Diagram | SVG canvas + AI analysis panel |
| `/advanced` | AdvancedAnalysis | 4 tools: Full Docs, Verify, Compliance Map, Drift |
| `/compliance/*` | Compliance Tracker | AESCSF, SOCI, ASD Fortify, Essential Eight, Gap Analysis, Report |
| `/settings` | Settings | Confluence config (stored in `localStorage`) |

### Compliance tracker

`ComplianceContext` (`src/context/ComplianceContext.jsx`) manages Australian framework state (AESCSF, SOCI, ASD Fortify, Essential Eight). It persists to the Express backend (`/api/state`) which stores it in the SQLite `compliance_states` table, keyed to the JWT user.

### Diagram canvas

`ThreatModelCanvas.jsx` is a full SVG canvas with drag-and-drop nodes, Bézier connectors, and a component palette. Design language is defined in `src/pages/threat-cartography-philosophy.md`: slate-900 toolbar, `#f8fafc` canvas background, 20px dot grid, monospace labels, deliberate saturated component colors only on the canvas.

### Container / deployment

`Dockerfile` is a two-stage build: stage 1 compiles the React app with Node 20; stage 2 runs Express with production server deps only. In production (`NODE_ENV=production`) the server serves `dist/` as static files with an SPA catch-all. Cloud Run CI/CD is in `.github/workflows/deploy-cloud-run.yml`; see `threat-modeler/DEPLOY.md` for GCP setup steps.

---

## Key constants (ThreatContext)

- **STRIDE_CATEGORIES**: `S T R I D E` — Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege.
- **Risk score** = `likelihood × impact` (both 1–5). Thresholds: ≥20 CRITICAL, ≥15 HIGH, ≥10 MEDIUM, ≥5 LOW, else MINIMAL.
- **Residual risk**: stored separately as `residualRiskScore` / `residualRiskLevel` after control application.
