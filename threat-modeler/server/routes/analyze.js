const express = require('express');
const router  = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

const STRIDE = { S: 'Spoofing', T: 'Tampering', R: 'Repudiation', I: 'Information Disclosure', D: 'Denial of Service', E: 'Elevation of Privilege' };

function riskLevel(score) {
  if (score >= 20) return 'CRITICAL';
  if (score >= 15) return 'HIGH';
  if (score >= 10) return 'MEDIUM';
  if (score >= 5)  return 'LOW';
  return 'MINIMAL';
}

/**
 * POST /api/analyze
 * Body: { project, formData, canvasElements }
 * Returns: { success, threatRows, threats, controls, assets, dataFlows, summary }
 */
router.post('/', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ success: false, error: 'ANTHROPIC_API_KEY not configured on server' });
  }

  const { project, formData = {}, canvasElements = [] } = req.body;
  if (!project?.id) return res.status(400).json({ success: false, error: 'project.id required' });

  const projectId = project.id;

  // Build a rich prompt from all available context
  const componentNames = canvasElements
    .filter(e => !['internet_zone','dmz_zone','corporate_lan','ot_ics_zone','cloud_zone','secure_zone'].includes(e.type))
    .map(e => e.label || e.type)
    .filter(Boolean);

  const isOT = formData.projectType === 'OT';
  const isIT = formData.projectType === 'IT';

  const otContext = isOT ? `
OT / ICS ENVIRONMENT:
- Purdue Model Zones in Scope: ${(formData.purdueZones || []).join(', ') || 'Not specified'}
- IEC 62443 Target Security Level: SL-${formData.iec62443SL || 'Not specified'}
- OT Protocols in Use: ${(formData.otProtocols || []).join(', ') || 'None specified'}
- Remote Access Method: ${formData.otRemoteAccess || 'Not specified'}
- Safety Instrumented System (SIL): ${formData.silLevel || 'None'}
- Patch Management Cadence: ${formData.otPatchCadence || 'Not specified'}
- Legacy / End-of-Life Systems Present: ${formData.otLegacySystems ? 'YES' : 'NO'}
- Network Air-Gap or Segmentation in Place: ${formData.otAirGap ? 'YES' : 'NO'}
- Third-Party / Vendor Remote Access: ${formData.otVendorAccess ? 'YES' : 'NO'}
- Applicable OT Standards: ${(formData.otStandards || []).join(', ') || 'None specified'}` : '';

  const itContext = isIT ? `
IT / CLOUD ENVIRONMENT:
- Deployment Model: ${formData.deploymentModel || 'Not specified'}
- Cloud Providers: ${(formData.cloudProviders || []).join(', ') || 'None'}
- Architecture Pattern: ${formData.itArchPattern || 'Not specified'}
- Cloud / Infrastructure Services: ${(formData.cloudServices || []).join(', ') || 'None'}
- Network Exposure: ${formData.networkExposure || 'Not specified'}
- Identity Provider / IAM: ${(formData.identityProvider || []).join(', ') || 'Not specified'}
- Authentication Mechanisms: ${Array.isArray(formData.authMechanism) ? formData.authMechanism.join(', ') : (formData.authMechanism || 'Not specified')}
- Network Security Controls: ${(formData.networkSecurity || []).join(', ') || 'None'}
- CI/CD Pipeline Security: ${(formData.cicdSecurity || []).join(', ') || 'None'}
- Technology Stack: ${formData.technologyStack || 'Not specified'}
- Data Residency: ${formData.dataResidency || 'Not specified'}` : '';

  const prompt = `You are a senior cybersecurity threat modeler specialising in ${isOT ? 'OT/ICS and industrial control systems (IEC 62443, Purdue Model, NERC CIP)' : isIT ? 'IT and cloud security (OWASP, NIST, cloud-native threats)' : 'enterprise security'}. Perform a thorough STRIDE threat model analysis on the following system.

SYSTEM DETAILS:
- Name: ${project.name}
- Description: ${project.description || 'Not provided'}
- Environment Type: ${formData.projectType || 'General IT'}
- Industry: ${formData.industry || 'Not specified'}
- Sensitive Data Types: ${(formData.sensitiveData || []).join(', ') || 'None specified'}
- Compliance Frameworks: ${(formData.complianceFrameworks || []).join(', ') || 'None'}
- Criticality: ${formData.criticality || 'medium'}
${otContext}${itContext}
${componentNames.length > 0 ? `- Diagram Components: ${componentNames.join(', ')}` : ''}

Identify exactly 8-12 realistic, specific threats using the STRIDE methodology. Each threat must be directly relevant to this specific system — NOT generic boilerplate.

Return ONLY a valid JSON array (no markdown, no explanation) with this exact structure:
[
  {
    "strideCategory": "S",
    "name": "Short specific threat name",
    "description": "2-3 sentence technical description specific to this system",
    "likelihood": 4,
    "impact": 4,
    "rationale": "2-3 sentences explaining why this risk level applies to THIS specific system given its characteristics",
    "recommendations": [
      "Specific actionable mitigation step 1",
      "Specific actionable mitigation step 2",
      "Specific actionable mitigation step 3"
    ],
    "residualRiskScore": 8,
    "residualRiskLevel": "MEDIUM",
    "residualRationale": "1-2 sentences on residual risk after mitigations"
  }
]

Rules:
- strideCategory must be one of: S, T, R, I, D, E
- likelihood and impact must be integers 1-5
- riskScore = likelihood × impact (you do not need to include this, we compute it)
- residualRiskScore must be 1-25 and lower than likelihood×impact
- residualRiskLevel must match residualRiskScore: CRITICAL(≥20), HIGH(≥15), MEDIUM(≥10), LOW(≥5), MINIMAL(<5)
- Cover multiple STRIDE categories, do not repeat the same category more than 3 times
- Make threats specific to the system — reference the technology stack, industry, data types, and components
- Recommendations must be concrete and actionable, not generic advice`;

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = message.content[0]?.text || '[]';

    // Parse — strip any markdown fences if model adds them despite instructions
    const jsonStr = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return res.status(500).json({ success: false, error: 'Claude returned invalid JSON', raw: rawText.slice(0, 500) });
    }

    if (!Array.isArray(parsed)) {
      return res.status(500).json({ success: false, error: 'Expected JSON array from Claude' });
    }

    const { v4: uuidv4 } = require('uuid');

    const threatRows = parsed.map(t => {
      const likelihood = Math.min(5, Math.max(1, Number(t.likelihood) || 3));
      const impact     = Math.min(5, Math.max(1, Number(t.impact)     || 3));
      const riskScore  = likelihood * impact;
      const residualRiskScore = Math.min(riskScore - 1, Math.max(1, Number(t.residualRiskScore) || Math.round(riskScore * 0.3)));

      return {
        id:               uuidv4(),
        projectId,
        name:             String(t.name || 'Unnamed Threat'),
        strideCategory:   ['S','T','R','I','D','E'].includes(t.strideCategory) ? t.strideCategory : 'S',
        description:      String(t.description || ''),
        affectedComponents: componentNames.slice(0, 3),
        likelihood,
        impact,
        riskScore,
        riskLevel:        riskLevel(riskScore),
        rationale:        String(t.rationale || ''),
        recommendations:  Array.isArray(t.recommendations) ? t.recommendations.map(String) : [],
        residualRiskScore,
        residualRiskLevel: riskLevel(residualRiskScore),
        residualRationale: String(t.residualRationale || ''),
        attackVector:     'Network',
        aiGenerated:      true,
        aiModel:          'claude-opus-4-6',
        createdAt:        new Date().toISOString(),
      };
    });

    threatRows.sort((a, b) => b.riskScore - a.riskScore);

    // Generate minimal assets + controls from threat data (no extra AI call needed)
    const assets = componentNames.length > 0
      ? componentNames.map(name => ({ id: uuidv4(), projectId, name, type: 'SYSTEM', sensitivity: 'CONFIDENTIAL', aiGenerated: true, createdAt: new Date().toISOString() }))
      : [{ id: uuidv4(), projectId, name: project.name, type: 'SYSTEM', sensitivity: 'CONFIDENTIAL', aiGenerated: true, createdAt: new Date().toISOString() }];

    const controls = threatRows.flatMap(t =>
      (t.recommendations || []).slice(0, 1).map(rec => ({
        id:           uuidv4(),
        projectId,
        name:         rec,
        type:         'PREVENTIVE',
        status:       'NOT_STARTED',
        linkedThreats: [t.id],
        aiGenerated:  true,
        createdAt:    new Date().toISOString(),
      }))
    );

    const summary = {
      threatCount:     threatRows.length,
      criticalThreats: threatRows.filter(t => t.riskLevel === 'CRITICAL').length,
      highThreats:     threatRows.filter(t => t.riskLevel === 'HIGH').length,
      controlCount:    controls.length,
      assetCount:      assets.length,
      riskScore:       threatRows.length > 0
        ? Math.round(threatRows.reduce((s, t) => s + t.riskScore, 0) / threatRows.length) : 0,
    };

    return res.json({
      success:    true,
      threatRows,
      threats:    threatRows,
      controls,
      assets,
      dataFlows:  [],
      summary,
    });
  } catch (err) {
    console.error('[analyze] Claude API error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
