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
      console.error('[firebaseAuth] Firebase Admin credentials not configured. Set FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY in server/.env for local dev.');
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

  try {
    const db = admin.firestore();
    const memberSnap = await db
      .collection('orgs').doc(orgId)
      .collection('members').doc(uid)
      .get();

    if (!memberSnap.exists || memberSnap.data()?.status === 'removed') {
      return res.status(403).json({ error: 'Forbidden — not a member of this organisation' });
    }

    req.orgRole = memberSnap.data().role;
    next();
  } catch (err) {
    console.error('[firebaseAuth] org membership check failed:', err.message);
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
