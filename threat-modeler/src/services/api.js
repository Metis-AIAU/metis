/**
 * Thin API client for the OT Compliance Tracker backend.
 * No React imports — usable in any module context.
 */

const AUTH_TOKEN_KEY = 'ot_auth_token';

function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(method, path, body) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new NetworkError('Unable to reach the server. Working in offline mode.');
  }

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    if (token) {
      // A stored token was rejected — it has expired or been invalidated.
      // Notify the app to log the user out.
      window.dispatchEvent(new CustomEvent('auth:expired'));
      throw new ApiError('Session expired. Please log in again.', 401);
    }
    // No token (e.g. login/register returning 401) — plain auth failure
    throw new ApiError(data.error || 'Invalid credentials.', 401);
  }

  if (!response.ok) {
    throw new ApiError(data.error || `Request failed (${response.status})`, response.status);
  }

  return data;
}

export function apiGet(path) {
  return request('GET', path);
}

export function apiPost(path, body) {
  return request('POST', path, body);
}

export function apiPut(path, body) {
  return request('PUT', path, body);
}
