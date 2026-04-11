const express = require('express');
const router  = express.Router();

/**
 * POST /api/confluence/page
 * Body: { config: { baseUrl, email, apiToken }, payload: Confluence page object }
 * Creates a new page in Confluence and returns { pageUrl, pageId }
 */
router.post('/page', async (req, res) => {
  const { config, payload } = req.body;

  if (!config?.baseUrl || !config?.email || !config?.apiToken) {
    return res.status(400).json({ error: 'Confluence config incomplete: baseUrl, email, apiToken required' });
  }

  const base    = config.baseUrl.replace(/\/$/, '');
  const token   = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
  const apiUrl  = `${base}/wiki/rest/api/content`;

  try {
    const cfResp = await fetch(apiUrl, {
      method:  'POST',
      headers: {
        'Authorization': `Basic ${token}`,
        'Content-Type':  'application/json',
        'Accept':        'application/json',
      },
      body: JSON.stringify(payload),
    });

    const cfData = await cfResp.json();

    if (!cfResp.ok) {
      const msg = cfData?.message || cfData?.errorMessages?.[0] || `Confluence API error ${cfResp.status}`;
      return res.status(cfResp.status).json({ error: msg });
    }

    const pageId  = cfData.id;
    const pageUrl = `${base}/wiki${cfData._links?.webui || `/spaces/${payload.space?.key}/pages/${pageId}`}`;

    return res.json({ pageId, pageUrl });
  } catch (err) {
    console.error('[confluence] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
