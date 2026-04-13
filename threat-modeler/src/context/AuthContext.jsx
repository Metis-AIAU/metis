import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Fetches the Firestore user profile (teamId, role, accountType, etc.)
 * and merges it with the Firebase Auth object.
 */
async function loadUserProfile(fbUser) {
  try {
    const snap = await getDoc(doc(db, 'users', fbUser.uid));
    const profile = snap.exists() ? snap.data() : {};
    return {
      id:          fbUser.uid,
      email:       fbUser.email,
      username:    profile.username || fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
      accountType: profile.accountType || 'individual',
      teamId:      profile.teamId   || null,
      teamRole:    profile.teamRole || null,
    };
  } catch {
    // Firestore unavailable — build minimal profile from Auth only
    return {
      id:          fbUser.uid,
      email:       fbUser.email,
      username:    fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
      accountType: 'individual',
      teamId:      null,
      teamRole:    null,
    };
  }
}

// ── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const profileVersion = useRef(0);

  // Subscribe to Firebase auth state changes
  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 8000);

    const unsubscribe = onAuthStateChanged(
      auth,
      async (fbUser) => {
        clearTimeout(timeout);
        if (fbUser) {
          const profile = await loadUserProfile(fbUser);
          setUser(profile);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      },
      () => {
        clearTimeout(timeout);
        setIsLoading(false);
      }
    );

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  /**
   * Re-reads the user's Firestore profile and refreshes the in-memory user
   * object.  Call this after creating/joining a team so teamId propagates
   * immediately without waiting for the next auth state event.
   */
  const refreshUserProfile = useCallback(async () => {
    const fbUser = auth.currentUser;
    if (!fbUser) return;
    const profile = await loadUserProfile(fbUser);
    profileVersion.current += 1;
    setUser(profile);
  }, []);

  /** Sign in with email + password */
  const login = useCallback(async (email, password) => {
    const { user: fbUser } = await signInWithEmailAndPassword(auth, email, password);
    // Update last-login timestamp (best effort, non-blocking)
    setDoc(doc(db, 'users', fbUser.uid), { lastLogin: serverTimestamp() }, { merge: true })
      .catch(() => {});
    const profile = await loadUserProfile(fbUser);
    setUser(profile);
    return profile;
  }, []);

  /** Create a new account — does NOT assign a team yet */
  const register = useCallback(async (email, password, displayName) => {
    const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);

    const username = (displayName && displayName.trim()) || email.split('@')[0];

    updateProfile(fbUser, { displayName: username }).catch(() => {});
    setDoc(doc(db, 'users', fbUser.uid), {
      email,
      username,
      accountType: 'individual',
      teamId:      null,
      teamRole:    null,
      createdAt:   serverTimestamp(),
      lastLogin:   serverTimestamp(),
    }).catch(() => {});

    const profile = {
      id:          fbUser.uid,
      email,
      username,
      accountType: 'individual',
      teamId:      null,
      teamRole:    null,
    };
    setUser(profile);
    return profile;
  }, []);

  /** Sign out */
  const logout = useCallback(async () => {
    await signOut(auth);
    // AuthStateChanged listener will clear user state automatically
  }, []);

  const value = {
    user,
    isLoading,
    isOffline:       false,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
