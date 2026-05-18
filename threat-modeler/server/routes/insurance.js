const express  = require('express');
const router   = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const mammoth  = require('mammoth');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

// ── POST /api/insurance/policy ────────────────────────────────────────────────
// Accepts: { documentBase64?, documentMimeType?, documentName?, policyText? }
// Returns: { success, requirements: [{ id, requirement, severity, section, compliant }] }
router.post('/policy', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ success: false, error: 'ANTHROPIC_API_KEY not configured' });
  }

  const { documentBase64, documentMimeType, documentName, policyText } = req.body;
  if (!documentBase64 && !policyText) {
    return res.status(400).json({ success: false, error: 'documentBase64 or policyText required' });
  }

  const extractionPrompt = `You are a senior cyber insurance analyst. Extract all security requirements from the provided cyber insurance policy document.

For each requirement found, return a JSON object with:
- "requirement": the full requirement text (concise but complete)
- "severity": one of "critical", "high", "medium", "low" (based on the impact if non-compliant)
- "section": the policy section reference (e.g. "Section 3.1", "Clause 4.2")
- "compliant": false (assessor will determine compliance separately)

Rules:
- Extract only actionable security requirements (not coverage terms or exclusions)
- Group similar requirements into one if they're in the same policy clause
- Minimum 8 requirements, maximum 20
- Map severity: mandatory/critical controls → critical, important controls → high, recommended → medium, optional → low

Return ONLY a JSON array, no markdown:
[{"requirement":"...","severity":"critical","section":"Section X.X","compliant":false}]`;

  try {
    let messageContent;

    if (documentBase64) {
      const isPdf  = documentMimeType === 'application/pdf';
      const isDocx = documentMimeType?.includes('word') || documentMimeType?.includes('msword');

      if (isPdf) {
        messageContent = [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: documentBase64 },
            title: documentName || 'Insurance Policy',
            context: 'Cyber insurance policy document. Extract all security requirements the insured must meet.',
          },
          { type: 'text', text: extractionPrompt },
        ];
      } else if (isDocx) {
        let docText = '';
        try {
          const buf    = Buffer.from(documentBase64, 'base64');
          const result = await mammoth.extractRawText({ buffer: buf });
          docText      = result.value?.slice(0, 15000) || '';
        } catch (e) {
          console.warn('[insurance/policy] mammoth failed:', e.message);
        }
        messageContent = `${extractionPrompt}\n\nPOLICY DOCUMENT CONTENT (${documentName || 'uploaded document'}):\n${docText}`;
      } else {
        messageContent = extractionPrompt;
      }
    } else {
      messageContent = `${extractionPrompt}\n\nPOLICY TEXT:\n${policyText}`;
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: messageContent }],
    });

    const rawText = message.content[0]?.text || '[]';
    const jsonStr = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return res.status(500).json({ success: false, error: 'AI returned invalid JSON', raw: rawText.slice(0, 300) });
    }

    if (!Array.isArray(parsed)) {
      return res.status(500).json({ success: false, error: 'Expected JSON array from AI' });
    }

    const requirements = parsed.map((r, i) => ({
      id: i + 1,
      requirement: String(r.requirement || ''),
      severity: ['critical','high','medium','low'].includes(r.severity) ? r.severity : 'medium',
      section: String(r.section || `Section ${i + 1}`),
      compliant: Boolean(r.compliant),
    }));

    console.log(`[insurance/policy] Extracted ${requirements.length} requirements | tokens: ${message.usage?.output_tokens}`);
    return res.json({ success: true, requirements });

  } catch (err) {
    console.error('[insurance/policy] error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/insurance/assess ────────────────────────────────────────────────
// Accepts: { formData }  (full manual assessment wizard output)
// Returns: { success, result: { riskScore, savings, recommendations[] } }
router.post('/assess', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ success: false, error: 'ANTHROPIC_API_KEY not configured' });
  }

  const { formData } = req.body;
  if (!formData) return res.status(400).json({ success: false, error: 'formData required' });

  const assessPrompt = `You are a senior cyber insurance underwriter and risk analyst. Analyse this security posture assessment and provide an insurance risk evaluation.

ORGANISATION PROFILE:
  Name: ${formData.orgName || 'Not provided'}
  Industry: ${formData.industry || 'Not specified'}
  Size: ${formData.orgSize || 'Not specified'} employees
  Current Annual Premium: $${formData.currentPremium || 'Unknown'} AUD
  Sum Insured: $${formData.sumInsured || 'Unknown'} AUD

ASSET INVENTORY:
  Asset types in scope: ${(formData.assetTypes || []).join(', ') || 'Not specified'}
  Cloud workload: ${formData.cloudPct || 'Unknown'}
  Critical systems: ${formData.criticalSystemCount || 'Unknown'}

SECURITY CONTROLS IN PLACE:
${(formData.controlsInPlace || []).map(c => `  ✓ ${c}`).join('\n') || '  None selected'}

CONTROLS MISSING:
${['Multi-Factor Authentication (MFA)','Endpoint Detection & Response (EDR)','Security Information & Event Mgmt (SIEM)','Privileged Access Management (PAM)','Data Loss Prevention (DLP)','Email Security Gateway','Web Application Firewall (WAF)','Network Segmentation / Zero Trust','Vulnerability Management','Security Awareness Training','Incident Response Plan','Immutable Backups']
  .filter(c => !(formData.controlsInPlace || []).includes(c))
  .map(c => `  ✗ ${c}`).join('\n') || '  None'}

INCIDENT HISTORY:
  Past incidents: ${(formData.incidentTypes || []).join(', ') || 'None reported'}
  IR retainer: ${formData.hasIRRetainer || 'Not specified'}

DOMAIN ASSESSMENT ANSWERS:
${JSON.stringify(formData.domainAnswers || {}, null, 2)}

Provide a risk evaluation. Return ONLY a JSON object, no markdown:
{
  "riskScore": <0-100, higher = more risk>,
  "riskLevel": "Low|Medium|High|Critical",
  "savings": <estimated annual premium reduction in AUD>,
  "controlsCovered": <number of controls in place>,
  "totalControls": 12,
  "assessment": {
    "riskScore": <same as above>,
    "potentialSavings": <same as savings>
  },
  "recommendations": [
    {
      "action": "<specific action>",
      "rationale": "<1 sentence why — reference this org's profile>",
      "savings": <estimated AUD premium reduction for this action>,
      "priority": "critical|high|medium"
    }
  ]
}

Rules:
- riskScore 0-100 (calibrate to industry, controls in place, incident history)
- savings should be realistic relative to the current premium (if provided)
- recommendations: 4-6 items, ordered by savings impact (highest first)
- reference the org's specific industry and control gaps in rationale`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: assessPrompt }],
    });

    const rawText = message.content[0]?.text || '{}';
    const jsonStr = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    let parsed;
    try { parsed = JSON.parse(jsonStr); }
    catch { return res.status(500).json({ success: false, error: 'AI returned invalid JSON' }); }

    console.log(`[insurance/assess] riskScore: ${parsed.riskScore} | savings: $${parsed.savings} | tokens: ${message.usage?.output_tokens}`);
    return res.json({ success: true, result: parsed });

  } catch (err) {
    console.error('[insurance/assess] error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/insurance/webhook ───────────────────────────────────────────────
// Make.com webhook endpoint
router.post('/webhook', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Bearer token required' });
  }
  console.log('[insurance/webhook] received payload:', JSON.stringify(req.body).slice(0, 200));
  return res.json({ ok: true, received: true, timestamp: new Date().toISOString() });
});

module.exports = router;
