import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  updatePassword as fbUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

// The one and only application administrator
const APP_ADMIN_EMAIL = 'ariel.egber@gmail.com';

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Creates a personal org for a newly registered user.
 * Called inside register() before returning the profile.
 */
async function createPersonalOrg(fbUser, username) {
  const orgId = uuidv4();
  const orgName = `${username}'s Organisation`;
  try {
    await setDoc(doc(db, 'orgs', orgId), {
      name: orgName,
      sector: '',
      plan: 'free',
      ownerId: fbUser.uid,
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'orgs', orgId, 'members', fbUser.uid), {
      role: 'owner',
      email: fbUser.email,
      displayName: username,
      joinedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'users', fbUser.uid, 'orgs', orgId), {
      role: 'owner',
      joinedAt: serverTimestamp(),
    });
    localStorage.setItem(`metis_org_${fbUser.uid}`, orgId);
  } catch (err) {
    // Non-fatal — OrgOnboarding will prompt the user to create one manually
    console.warn('[AuthContext] personal org creation failed:', err.message);
  }
}

/**
 * Fetches the Firestore user profile (teamId, role, accountType, etc.)
 * and merges it with the Firebase Auth object.
 */
async function loadUserProfile(fbUser) {
  const isAppAdmin = fbUser.email?.toLowerCase() === APP_ADMIN_EMAIL;
  // App admin bypasses email verification requirement
  const emailVerified = fbUser.emailVerified || isAppAdmin;
  try {
    const snap = await getDoc(doc(db, 'users', fbUser.uid));
    const profile = snap.exists() ? snap.data() : {};
    return {
      id:            fbUser.uid,
      email:         fbUser.email,
      emailVerified,
      username:      profile.username || fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
      accountType:   profile.accountType || 'individual',
      teamId:        profile.teamId   || null,
      teamRole:      profile.teamRole || null,
      isAppAdmin,
    };
  } catch {
    return {
      id:            fbUser.uid,
      email:         fbUser.email,
      emailVerified,
      username:      fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
      accountType:   'individual',
      teamId:        null,
      teamRole:      null,
      isAppAdmin,
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

  /** Create a new account — accountType is 'individual' or 'team' */
  const register = useCallback(async (email, password, displayName, accountType = 'individual') => {
    const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);

    const username = (displayName && displayName.trim()) || email.split('@')[0];
    const isAppAdmin = email?.toLowerCase() === APP_ADMIN_EMAIL;

    updateProfile(fbUser, { displayName: username }).catch(() => {});
    setDoc(doc(db, 'users', fbUser.uid), {
      email,
      username,
      accountType,
      teamId:      null,
      teamRole:    null,
      createdAt:   serverTimestamp(),
      lastLogin:   serverTimestamp(),
    }).catch(() => {});

    // Auto-create personal org — skip for join-team (they'll accept an invite via OrgOnboarding)
    if (accountType !== 'join-team') {
      await createPersonalOrg(fbUser, username);
    }

    // Send verification email (non-blocking — admin skips)
    if (!isAppAdmin) {
      sendEmailVerification(fbUser).catch(() => {});
    }

    const profile = {
      id:            fbUser.uid,
      email,
      emailVerified: isAppAdmin, // new users are unverified unless admin
      username,
      accountType,
      teamId:        null,
      teamRole:      null,
      isAppAdmin,
    };
    setUser(profile);
    return profile;
  }, []);

  /** Sign out */
  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  /** Re-send verification email to the current user. */
  const resendVerification = useCallback(async () => {
    const fbUser = auth.currentUser;
    if (!fbUser) return;
    await sendEmailVerification(fbUser);
  }, []);

  /**
   * Reload the Firebase Auth token and check whether the user has now verified
   * their email. If yes, refreshes the in-memory profile and returns true.
   */
  const checkEmailVerified = useCallback(async () => {
    const fbUser = auth.currentUser;
    if (!fbUser) return false;
    await fbUser.reload();
    const refreshed = auth.currentUser;
    if (refreshed?.emailVerified) {
      const profile = await loadUserProfile(refreshed);
      setUser(profile);
      return true;
    }
    return false;
  }, []);

  /** Update the user's display name in Firebase Auth and Firestore. */
  const updateDisplayName = useCallback(async (name) => {
    const fbUser = auth.currentUser;
    if (!fbUser) throw new Error('Not authenticated');
    const trimmed = name.trim();
    await updateProfile(fbUser, { displayName: trimmed });
    await setDoc(doc(db, 'users', fbUser.uid), { username: trimmed }, { merge: true });
    setUser(prev => ({ ...prev, username: trimmed }));
  }, []);

  /**
   * Re-authenticates with currentPassword then sets newPassword.
   * Throws a friendly error if the current password is wrong.
   */
  const updateUserPassword = useCallback(async (currentPassword, newPassword) => {
    const fbUser = auth.currentUser;
    if (!fbUser) throw new Error('Not authenticated');
    const credential = EmailAuthProvider.credential(fbUser.email, currentPassword);
    try {
      await reauthenticateWithCredential(fbUser, credential);
    } catch {
      throw new Error('Current password is incorrect.');
    }
    await fbUpdatePassword(fbUser, newPassword);
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
    resendVerification,
    checkEmailVerified,
    updateDisplayName,
    updateUserPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
