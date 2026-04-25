import { auth } from '../firebase';

/**
 * Wrapper around fetch that attaches the current user's Firebase ID token.
 * Use in place of fetch() for all calls to /api/* routes.
 */
export async function fetchWithAuth(url, options = {}) {
  const user = auth.currentUser;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
}
