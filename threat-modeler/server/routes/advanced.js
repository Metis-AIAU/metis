const express  = require('express');
const router   = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { v4: uuidv4 } = require('uuid');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

function requireKey(res) {
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ success: false, error: 'ANTHROPIC_API_KEY not configured' });
    return false;
  }
  return true;
}

async function askClaude(prompt, maxTokens = 4096) {
  const msg = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  const raw = msg.content[0]?.text || '';
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}

// ── POST /api/advanced/full-docs ───────────────────────────────────────────────
// Body: { project, docContent: string }
// Generates a comprehensive threat model from architecture documents
router.post('/full-docs', async (req, res) => {
  if (!requireKey(res)) return;
  const { project = {}, docContent } = req.body;
  if (!docContent?.trim()) return res.status(400).json({ success: false, error: 'docContent required' });

  const prompt = `You are a senior security architect. Analyse the following architecture documentation and generate a comprehensive STRIDE threat model.

PROJECT: ${project.name || 'Unknown'}
DESCRIPTION: ${project.description || ''}

ARCHITECTURE DOCUMENTATION:
---
${docContent.slice(0, 12000)}
---

Tasks:
1. Extract all system components, data flows, trust boundaries, and entry points from the docs.
2. Generate 10-15 specific STRIDE threats that are directly traceable to the documented architecture.
3. For each threat, reference the specific component, flow, or decision in the docs that introduces the risk.

Return ONLY a valid JSON object with this exact structure (no markdown):
{
  "components": [
    { "name": "string", "type": "server|service|database|user|external|network|zone", "description": "string" }
  ],
  "dataFlows": [
    { "from": "string", "to": "string", "protocol": "string", "dataTypes": ["string"] }
  ],
  "threats": [
    {
      "strideCategory": "S|T|R|I|D|E",
      "name": "string",
      "description": "string — reference the specific doc section",
      "affectedComponent": "string",
      "likelihood": 1-5,
      "impact": 1-5,
      "rationale": "string — cite doc evidence",
      "recommendations": ["string", "string", "string"],
      "residualRiskScore": 1-25
    }
  ],
  "architectureSummary": "string — 2-3 sentence summary of what was found in docs",
  "trustBoundaries": ["string"]
}`;

  try {
    const json = await askClaude(prompt, 6000);
    const parsed = JSON.parse(json);
    const projectId = project.id || 'unknown';

    // Enrich threats with computed fields
    const threats = (parsed.threats || []).map(t => {
      const l = Math.min(5, Math.max(1, t.likelihood || 3));
      const i = Math.min(5, Math.max(1, t.impact || 3));
      const score = l * i;
      const lvl = score >= 20 ? 'CRITICAL' : score >= 15 ? 'HIGH' : score >= 10 ? 'MEDIUM' : score >= 5 ? 'LOW' : 'MINIMAL';
      const res = Math.max(1, t.residualRiskScore || Math.round(score * 0.3));
      const resLvl = res >= 20 ? 'CRITICAL' : res >= 15 ? 'HIGH' : res >= 10 ? 'MEDIUM' : res >= 5 ? 'LOW' : 'MINIMAL';
      return {
        id: uuidv4(), projectId,
        name: t.name, description: t.description,
        strideCategory: ['S','T','R','I','D','E'].includes(t.strideCategory) ? t.strideCategory : 'S',
        affectedComponents: [t.affectedComponent].filter(Boolean),
        likelihood: l, impact: i, riskScore: score, riskLevel: lvl,
        rationale: t.rationale,
        recommendations: (t.recommendations || []).map(String),
        residualRiskScore: res, residualRiskLevel: resLvl,
        attackVector: 'Network', aiGenerated: true, aiModel: 'claude-opus-4-6',
        createdAt: new Date().toISOString(),
      };
    }).sort((a, b) => b.riskScore - a.riskScore);

    return res.json({
      success: true,
      threats,
      components: parsed.components || [],
      dataFlows: parsed.dataFlows || [],
      architectureSummary: parsed.architectureSummary || '',
      trustBoundaries: parsed.trustBoundaries || [],
    });
  } catch (e) {
    console.error('[full-docs]', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
});

// ── POST /api/advanced/verify ──────────────────────────────────────────────────
// Body: { project, threats, codeFiles: [{ name, content }] }
// Returns file:line evidence for security controls in source code
router.post('/verify', async (req, res) => {
  if (!requireKey(res)) return;
  const { project = {}, threats = [], codeFiles = [] } = req.body;
  if (!codeFiles.length) return res.status(400).json({ success: false, error: 'codeFiles required' });

  const filesSummary = codeFiles.map(f =>
    `FILE: ${f.name}\n${(f.content || '').slice(0, 3000)}`
  ).join('\n\n---\n\n').slice(0, 15000);

  const threatList = threats.slice(0, 12).map(t =>
    `- [${t.strideCategory}] ${t.name}: ${t.recommendations?.slice(0,2).join('; ') || t.description}`
  ).join('\n');

  const prompt = `You are a security code reviewer. Analyse the following source code files and determine whether the security controls recommended for the threat model are actually implemented.

PROJECT: ${project.name || 'Unknown'}

THREATS & EXPECTED CONTROLS:
${threatList || 'No specific threats provided — identify any security controls present.'}

SOURCE CODE:
---
${filesSummary}
---

For each control (or expected control), find actual code evidence: function name, file, and approximate line number.

Return ONLY valid JSON (no markdown):
{
  "controls": [
    {
      "controlName": "string",
      "status": "IMPLEMENTED|PARTIAL|MISSING",
      "evidence": [
        { "file": "string", "line": number, "snippet": "string — exact code snippet max 80 chars", "description": "string" }
      ],
      "gap": "string — what is missing or could be improved (null if fully implemented)"
    }
  ],
  "overallCoverage": 0-100,
  "criticalGaps": ["string"],
  "summary": "string"
}`;

  try {
    const json = await askClaude(prompt, 4096);
    const parsed = JSON.parse(json);
    return res.json({ success: true, ...parsed });
  } catch (e) {
    console.error('[verify]', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
});

// ── POST /api/advanced/compliance-map ─────────────────────────────────────────
// Body: { project, threats }
// Maps threats to OWASP Top 10, SOC2, PCI-DSS, ISO 27001
router.post('/compliance-map', async (req, res) => {
  if (!requireKey(res)) return;
  const { project = {}, threats = [] } = req.body;
  if (!threats.length) return res.status(400).json({ success: false, error: 'threats array required' });

  const threatList = threats.slice(0, 15).map((t, i) =>
    `${i+1}. [${t.strideCategory}] ${t.name} (${t.riskLevel || 'UNKNOWN'}): ${t.description?.slice(0,120)}`
  ).join('\n');

  const prompt = `You are a compliance expert. Map the following security threats to industry compliance frameworks.

PROJECT: ${project.name || 'Unknown'}
FRAMEWORKS IN SCOPE: ${(project.complianceFrameworks || []).join(', ') || 'OWASP Top 10, SOC2, PCI-DSS v4, ISO 27001, NIST CSF'}

THREATS:
${threatList}

For each threat, map it to the specific requirement IDs/controls in each framework.

Return ONLY valid JSON (no markdown):
{
  "mappings": [
    {
      "threatName": "string",
      "strideCategory": "S|T|R|I|D|E",
      "frameworks": {
        "OWASP_Top10": { "id": "A01:2021 or similar", "name": "string", "relevance": "HIGH|MEDIUM|LOW" },
        "SOC2": { "id": "CC6.1 or similar", "name": "string", "relevance": "HIGH|MEDIUM|LOW" },
        "PCI_DSS": { "id": "Req 8.2 or similar", "name": "string", "relevance": "HIGH|MEDIUM|LOW" },
        "ISO27001": { "id": "A.9.1.1 or similar", "name": "string", "relevance": "HIGH|MEDIUM|LOW" },
        "NIST_CSF": { "id": "PR.AC-1 or similar", "name": "string", "relevance": "HIGH|MEDIUM|LOW" }
      }
    }
  ],
  "frameworkCoverage": {
    "OWASP_Top10": { "covered": ["A01","A02"], "uncovered": ["A09","A10"], "score": 0-100 },
    "SOC2": { "covered": ["CC6","CC7"], "uncovered": ["CC9"], "score": 0-100 },
    "PCI_DSS": { "covered": ["Req 1","Req 8"], "uncovered": ["Req 11"], "score": 0-100 },
    "ISO27001": { "covered": ["A.9","A.12"], "uncovered": ["A.17"], "score": 0-100 },
    "NIST_CSF": { "covered": ["PR.AC","DE.AE"], "uncovered": ["RC.RP"], "score": 0-100 }
  },
  "gaps": ["string — unmapped compliance areas that have no covering threat"],
  "summary": "string"
}`;

  try {
    const json = await askClaude(prompt, 5000);
    const parsed = JSON.parse(json);
    return res.json({ success: true, ...parsed });
  } catch (e) {
    console.error('[compliance-map]', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
});

// ── POST /api/advanced/drift ───────────────────────────────────────────────────
// Body: { project, threats, diffContent: string }
// Detects security drift from code changes
router.post('/drift', async (req, res) => {
  if (!requireKey(res)) return;
  const { project = {}, threats = [], diffContent } = req.body;
  if (!diffContent?.trim()) return res.status(400).json({ success: false, error: 'diffContent (git diff or changed files) required' });

  const threatList = threats.slice(0, 12).map(t =>
    `- [${t.id?.slice(0,8)}] [${t.strideCategory}] ${t.name}: ${t.description?.slice(0,100)}`
  ).join('\n');

  const prompt = `You are a security architect performing threat model drift analysis. Examine the following code changes and determine which existing threats are affected and whether new threats have been introduced.

PROJECT: ${project.name || 'Unknown'}

EXISTING THREAT MODEL:
${threatList || 'No existing threats.'}

CODE CHANGES (git diff or file delta):
---
${diffContent.slice(0, 10000)}
---

Analyse:
1. Which existing threats are now MORE or LESS likely due to these changes?
2. Are any existing security controls weakened or removed?
3. What new attack surface has been introduced?
4. Are there any new threats not covered by the existing model?

Return ONLY valid JSON (no markdown):
{
  "driftSeverity": "CRITICAL|HIGH|MEDIUM|LOW|NONE",
  "affectedThreats": [
    {
      "threatId": "string (from existing id prefix) or null",
      "threatName": "string",
      "changeType": "INCREASED|DECREASED|REMOVED|NEW",
      "reason": "string — specific code change that caused this",
      "codeEvidence": "string — file/function that changed",
      "newRiskLevel": "CRITICAL|HIGH|MEDIUM|LOW|MINIMAL|null"
    }
  ],
  "newThreats": [
    {
      "strideCategory": "S|T|R|I|D|E",
      "name": "string",
      "description": "string",
      "likelihood": 1-5,
      "impact": 1-5,
      "rationale": "string — specific change that introduced this",
      "recommendations": ["string"]
    }
  ],
  "removedControls": ["string — security controls that appear to have been deleted or weakened"],
  "summary": "string — 2-3 sentence executive summary of the drift",
  "requiresReview": true|false
}`;

  try {
    const json = await askClaude(prompt, 4096);
    const parsed = JSON.parse(json);

    // Enrich new threats with computed fields
    const projectId = project.id || 'unknown';
    const newThreats = (parsed.newThreats || []).map(t => {
      const l = Math.min(5, Math.max(1, t.likelihood || 3));
      const i = Math.min(5, Math.max(1, t.impact || 3));
      const score = l * i;
      const lvl = score >= 20 ? 'CRITICAL' : score >= 15 ? 'HIGH' : score >= 10 ? 'MEDIUM' : score >= 5 ? 'LOW' : 'MINIMAL';
      return {
        id: uuidv4(), projectId,
        name: t.name, description: t.description,
        strideCategory: ['S','T','R','I','D','E'].includes(t.strideCategory) ? t.strideCategory : 'S',
        likelihood: l, impact: i, riskScore: score, riskLevel: lvl,
        rationale: t.rationale,
        recommendations: (t.recommendations || []).map(String),
        residualRiskScore: Math.round(score * 0.3),
        attackVector: 'Network', aiGenerated: true, aiModel: 'claude-opus-4-6',
        fromDrift: true, createdAt: new Date().toISOString(),
      };
    });

    return res.json({ success: true, ...parsed, newThreats });
  } catch (e) {
    console.error('[drift]', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
