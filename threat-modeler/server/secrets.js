const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const SECRET_NAME = 'projects/499037545252/secrets/APIkeyclaude/versions/latest';

/**
 * Fetches ANTHROPIC_API_KEY from Secret Manager if not already in the environment.
 * On Cloud Run, --set-secrets already injects it so this is a no-op.
 * For local dev, Application Default Credentials (gcloud auth application-default login) are used.
 */
async function loadSecrets() {
  if (process.env.ANTHROPIC_API_KEY) return;

  try {
    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({ name: SECRET_NAME });
    process.env.ANTHROPIC_API_KEY = version.payload.data.toString('utf8').trim();
    console.log('[secrets] ANTHROPIC_API_KEY loaded from Secret Manager');
  } catch (err) {
    console.warn('[secrets] Could not fetch ANTHROPIC_API_KEY from Secret Manager:', err.message);
    console.warn('[secrets] Set ANTHROPIC_API_KEY in server/.env or run: gcloud auth application-default login');
  }
}

module.exports = { loadSecrets };
