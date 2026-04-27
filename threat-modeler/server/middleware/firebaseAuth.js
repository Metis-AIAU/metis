const admin = require('../firebase-admin');

/**
 * Middleware: verifies the Firebase ID token in the Authorization header.
 * On success, attaches:
 *   req.user = { uid, email }
 *   req.orgId = X-Org-Id header value (if present; validated against Firestore in requireOrgMember)
 */
async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized — missing token' });
  }

  const idToken = authHeader.slice(7);

  // Dev bypass: decode JWT payload without verifying signature (no Firebase Admin needed).
  // Set DEV_SKIP_AUTH=true in server/.env — ignored in production.
  if (process.env.DEV_SKIP_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
    try {
      const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64url').toString());
      req.user  = { uid: payload.user_id || payload.sub, email: payload.email || '' };
      req.orgId = req.headers['x-org-id'] || null;
      console.warn(`[firebaseAuth] DEV_SKIP_AUTH=true — token not verified, uid=${req.user.uid}`);
      return next();
    } catch {
      return res.status(401).json({ error: 'Unauthorized — could not decode token' });
    }
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user  = { uid: decoded.uid, email: decoded.email };
    req.orgId = req.headers['x-org-id'] || null;
    next();
  } catch (err) {
    const isCredentialError = err.message?.includes('default credentials') ||
      err.message?.includes('service account') ||
      err.code === 'app/invalid-credential';
    if (isCredentialError) {
      console.error('[firebaseAuth] Firebase Admin credentials not configured. Set FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY in server/.env for local dev, or set DEV_SKIP_AUTH=true.');
      return res.status(500).json({ error: 'Server misconfigured — Firebase Admin credentials missing. See server logs.' });
    }
    return res.status(401).json({ error: 'Unauthorized — invalid or expired token' });
  }
}

/**
 * Middleware: verifies that req.user is a member of req.orgId.
 * Must run AFTER verifyFirebaseToken.
 * Attaches req.orgRole = 'owner' | 'admin' | 'member' | 'viewer'
 */
async function requireOrgMember(req, res, next) {
  const { uid } = req.user;
  const orgId = req.orgId;

  if (!orgId) {
    return res.status(400).json({ error: 'X-Org-Id header required' });
  }

  // Dev escape hatch: set DEV_SKIP_ORG_CHECK=true in server/.env to bypass
  // Firestore membership check when Firebase Admin credentials aren't configured locally.
  if (process.env.DEV_SKIP_ORG_CHECK === 'true' && process.env.NODE_ENV !== 'production') {
    console.warn('[firebaseAuth] DEV_SKIP_ORG_CHECK=true — skipping org membership verification (dev only)');
    req.orgRole = 'owner';
    return next();
  }

  try {
    const db = admin.firestore();
    const memberSnap = await db
      .collection('orgs').doc(orgId)
      .collection('members').doc(uid)
      .get();

    if (!memberSnap.exists || memberSnap.data()?.status === 'removed') {
      console.warn(`[firebaseAuth] uid=${uid} not found in org=${orgId}`);
      return res.status(403).json({ error: 'Forbidden — not a member of this organisation' });
    }

    req.orgRole = memberSnap.data().role;
    next();
  } catch (err) {
    const isCredentialError =
      err.message?.includes('default credentials') ||
      err.message?.includes('service account') ||
      err.message?.includes('Could not load') ||
      err.message?.includes('UNAUTHENTICATED') ||
      err.code === 'app/invalid-credential';

    if (isCredentialError) {
      console.error(
        '[firebaseAuth] Firebase Admin credentials not configured for Firestore access.\n' +
        '  → For local dev, add to server/.env:\n' +
        '      FIREBASE_CLIENT_EMAIL=<service-account-email>\n' +
        '      FIREBASE_PRIVATE_KEY=<private-key>\n' +
        '  → OR run: gcloud auth application-default login\n' +
        '  → OR set DEV_SKIP_ORG_CHECK=true in server/.env (dev only)'
      );
      return res.status(500).json({
        error: 'Server misconfigured — Firebase Admin credentials missing for Firestore. See server logs.',
      });
    }

    console.error('[firebaseAuth] org membership check failed:', err.message, { uid, orgId });
    return res.status(500).json({ error: 'Failed to verify org membership' });
  }
}

/**
 * Middleware: asserts req.orgRole is 'owner' or 'admin'.
 * Must run AFTER requireOrgMember.
 */
function requireOrgAdmin(req, res, next) {
  if (!['owner', 'admin'].includes(req.orgRole)) {
    return res.status(403).json({ error: 'Forbidden — admin role required' });
  }
  next();
}

module.exports = { verifyFirebaseToken, requireOrgMember, requireOrgAdmin };
