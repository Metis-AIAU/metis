const admin = require('../firebase-admin');

const PROJECT_ID = '499037545252';
const LOCATION   = 'us-central1';
const MODEL      = 'text-embedding-004';
const ENDPOINT   = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:predict`;

/**
 * Embed a single string using Vertex AI text-embedding-004 (768 dimensions).
 * Reuses the firebase-admin credential — no extra SDK needed.
 */
async function embedText(text) {
  const tokenResponse = await admin.app().options.credential.getAccessToken();
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenResponse.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ instances: [{ content: text }] }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Vertex AI embedding failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  return data.predictions[0].embeddings.values; // float[]
}

/**
 * Batch embed — Vertex AI allows up to 250 instances per request.
 */
async function embedBatch(texts) {
  const tokenResponse = await admin.app().options.credential.getAccessToken();
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenResponse.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ instances: texts.map(content => ({ content })) }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Vertex AI batch embedding failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  return data.predictions.map(p => p.embeddings.values);
}

module.exports = { embedText, embedBatch };
