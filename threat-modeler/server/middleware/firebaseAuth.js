const admin = require('../firebase-admin');

/**
 * Middleware: verifies the Firebase ID token in the Authorization header.
 * On success, attaches req.user = { uid, email }.
 * On failure, responds with 401.
 */
async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — missing token' });
  }

  const idToken = authHeader.slice(7);
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch (err) {
    const isCredentialError = err.message?.includes('default credentials') ||
      err.message?.includes('service account') ||
      err.code === 'app/invalid-credential';
    if (isCredentialError) {
      console.error('[firebaseAuth] Firebase Admin credentials not configured. Set FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY in server/.env for local dev.');
      return res.status(500).json({ error: 'Server misconfigured — Firebase Admin credentials missing. See server logs.' });
    }
    return res.status(401).json({ error: 'Unauthorized — invalid or expired token' });
  }
}

module.exports = { verifyFirebaseToken };
