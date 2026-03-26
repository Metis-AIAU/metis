import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

/** Map a Firebase user object to our app's user shape */
function mapFirebaseUser(fbUser) {
  return {
    id:       fbUser.uid,
    email:    fbUser.email,
    username: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
  };
}

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to Firebase auth state changes (persists across page reloads)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setUser(fbUser ? mapFirebaseUser(fbUser) : null);
      setIsLoading(false);
    });
    return unsubscribe; // cleanup listener on unmount
  }, []);

  /** Sign in with email + password */
  const login = useCallback(async (email, password) => {
    const { user: fbUser } = await signInWithEmailAndPassword(auth, email, password);
    // Update last-login timestamp in Firestore (non-blocking)
    setDoc(doc(db, 'users', fbUser.uid), { lastLogin: serverTimestamp() }, { merge: true })
      .catch(() => {});
    return mapFirebaseUser(fbUser);
  }, []);

  /** Create a new account with email, password, and an optional display name */
  const register = useCallback(async (email, password, displayName) => {
    const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);

    const username = (displayName && displayName.trim()) || email.split('@')[0];

    // Set display name on the Firebase Auth profile
    await updateProfile(fbUser, { displayName: username });

    // Create the user profile document in Firestore
    await setDoc(doc(db, 'users', fbUser.uid), {
      email,
      username,
      createdAt:  serverTimestamp(),
      lastLogin:  serverTimestamp(),
    });

    return mapFirebaseUser({ ...fbUser, displayName: username });
  }, []);

  /** Sign out */
  const logout = useCallback(async () => {
    await signOut(auth);
    // AuthStateChanged listener will clear user state automatically
  }, []);

  const value = {
    user,
    isLoading,
    isOffline:       false,   // Firebase SDK handles offline transparently
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
