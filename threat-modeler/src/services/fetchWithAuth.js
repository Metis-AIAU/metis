import { auth } from '../firebase';

let _getOrgId = null;

/**
 * Register an org-id supplier so fetchWithAuth can attach X-Org-Id.
 * Called once from OrgContext on mount.
 */
export function setOrgIdSupplier(fn) {
  _getOrgId = fn;
}

/**
 * Wrapper around fetch that attaches:
 *  - Authorization: Bearer <firebase-id-token>
 *  - X-Org-Id: <current-org-id>  (if available)
 *
 * Use in place of fetch() for all /api/* calls.
 */
export async function fetchWithAuth(url, options = {}) {
  const user = auth.currentUser;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const orgId = _getOrgId?.();
  if (orgId) {
    headers['X-Org-Id'] = orgId;
  }

  return fetch(url, { ...options, headers });
}
