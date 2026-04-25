const admin = require('firebase-admin');

if (!admin.apps.length) {
  // On Cloud Run / GCP: Application Default Credentials are picked up automatically.
  // For local dev: set GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
  // OR set FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY env vars.
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

  const credential =
    process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
      ? admin.credential.cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        })
      : admin.credential.applicationDefault();

  admin.initializeApp({ credential, projectId });
}

module.exports = admin;
