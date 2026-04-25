const express    = require('express');
const Anthropic  = require('@anthropic-ai/sdk');
const { askComplianceQuestion, getControlGuidance } = require('../services/complianceRAG');

const router = express.Router();

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

/**
 * POST /api/compliance/ask
 * Body: { query, framework?, organisationContext? }
 * Returns: { answer, relevantControls }
 */
router.post('/ask', async (req, res) => {
  const { query, framework, organisationContext } = req.body;
  if (!query?.trim()) return res.status(400).json({ error: 'query is required' });

  try {
    const result = await askComplianceQuestion(query, {
      framework,
      organisationContext,
      anthropicClient: getClient(),
    });
    res.json(result);
  } catch (err) {
    console.error('[compliance/ask]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/compliance/guidance
 * Body: { controlId, organisationContext? }
 * Returns: { answer, relevantControls }
 */
router.post('/guidance', async (req, res) => {
  const { controlId, organisationContext } = req.body;
  if (!controlId?.trim()) return res.status(400).json({ error: 'controlId is required' });

  try {
    const result = await getControlGuidance(controlId, getClient(), organisationContext);
    res.json(result);
  } catch (err) {
    console.error('[compliance/guidance]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
