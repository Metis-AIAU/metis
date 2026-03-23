import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, setToken, clearToken, NetworkError } from '../services/api';

const AuthContext = createContext(null);

const AUTH_TOKEN_KEY = 'ot_auth_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);          // { id, username }
  const [isLoading, setIsLoading] = useState(true); // true during initial token validation
  const [isOffline, setIsOffline] = useState(false);

  // Validate stored token on mount
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }

    apiGet('/api/me')
      .then(userData => {
        setUser({ id: userData.id, username: userData.username });
        setIsOffline(false);
      })
      .catch(err => {
        if (err instanceof NetworkError) {
          // Server unreachable — treat as offline but still "authenticated" so
          // the app loads with localStorage data rather than redirecting to login.
          setUser({ id: null, username: '(offline)' });
          setIsOffline(true);
        } else {
          // 401 or other error — token is invalid, clear it
          clearToken();
          setUser(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Listen for token-expired events dispatched by api.js on 401 responses
  useEffect(() => {
    function handleExpired() {
      clearToken();
      setUser(null);
    }
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const login = useCallback(async (username, password) => {
    const { token, user: userData } = await apiPost('/api/auth/login', { username, password });
    setToken(token);
    setUser({ id: userData.id, username: userData.username });
    setIsOffline(false);
    return userData;
  }, []);

  const register = useCallback(async (username, password) => {
    const { token, user: userData } = await apiPost('/api/auth/register', { username, password });
    setToken(token);
    setUser({ id: userData.id, username: userData.username });
    setIsOffline(false);
    return userData;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setIsOffline(false);
    // Note: localStorage compliance state is intentionally kept as offline backup
  }, []);

  const value = {
    user,
    isLoading,
    isOffline,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
