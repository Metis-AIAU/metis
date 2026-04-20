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

  console.log('[analyze] Project:', project.name, '| Type:', formData.projectType || 'General', '| Industry:', formData.industry || 'n/a', '| Canvas nodes:', canvasElements.length);

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

  const diagramContext = componentNames.length > 0
    ? `\nDIAGRAM COMPONENTS (nodes the user drew on the architecture canvas):\n${componentNames.map(n => `  - ${n}`).join('\n')}`
    : '';

  const prompt = `You are a senior cybersecurity threat modeler specialising in ${isOT ? 'OT/ICS and industrial control systems (IEC 62443, Purdue Model, NERC CIP)' : isIT ? 'IT and cloud security (OWASP, NIST, cloud-native threats)' : 'enterprise security'}. Perform a thorough STRIDE threat model analysis on the following system.

SYSTEM CONTEXT — read every field carefully, they define the attack surface:
  Name: ${project.name}
  Description: ${project.description || 'Not provided'}
  Environment Type: ${formData.projectType || 'General IT/OT'}
  Industry Sector: ${formData.industry || 'Not specified'}
  Business Criticality: ${formData.criticality || 'medium'}
  Sensitive / Regulated Data in Scope: ${(formData.sensitiveData || []).join(', ') || 'None specified'}
  Compliance Frameworks Required: ${(formData.complianceFrameworks || []).join(', ') || 'None'}
${otContext}${itContext}${diagramContext}

TASK: Generate 6–8 STRIDE threats specific to this system. Be concise — keep all text fields short.
Rules:
- Reference this system's technology/industry/data in every threat (no generic boilerplate)
- Calibrate scores to this system's criticality and data types
- Cover at least 4 STRIDE categories

Return ONLY a JSON array, no markdown:
[{"strideCategory":"S","name":"<10 words>","description":"<1-2 sentences referencing this system>","likelihood":4,"impact":4,"rationale":"<1-2 sentences specific to this system>","recommendations":["<action 1>","<action 2>"],"residualRiskScore":8,"residualRiskLevel":"MEDIUM","residualRationale":"<1 sentence>"}]

strideCategory: S|T|R|I|D|E. likelihood/impact: 1-5. residualRiskScore < likelihood×impact. residualRiskLevel: CRITICAL≥20,HIGH≥15,MEDIUM≥10,LOW≥5,MINIMAL<5`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3500,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = message.content[0]?.text || '[]';
    console.log('[analyze] stop_reason:', message.stop_reason, '| tokens:', message.usage?.output_tokens);

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
        aiModel:          'claude-sonnet-4-6',
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
