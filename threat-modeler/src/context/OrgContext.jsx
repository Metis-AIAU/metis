import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  doc, collection, getDoc, setDoc, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { setOrgIdSupplier } from '../services/fetchWithAuth';

const OrgContext = createContext(null);

export const ORG_ROLES = {
  owner:  { label: 'Owner',  canWrite: true,  canAdmin: true  },
  admin:  { label: 'Admin',  canWrite: true,  canAdmin: true  },
  member: { label: 'Member', canWrite: true,  canAdmin: false },
  viewer: { label: 'Viewer', canWrite: false, canAdmin: false },
};

export const ORG_PLANS = {
  free:       { label: 'Free',       maxMembers: 3,   aiCalls: 50  },
  pro:        { label: 'Pro',        maxMembers: 20,  aiCalls: 500 },
  enterprise: { label: 'Enterprise', maxMembers: null, aiCalls: null },
};

// ── Provider ─────────────────────────────────────────────────────────────────

export function OrgProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const [orgs, setOrgs]           = useState([]);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [members, setMembers]     = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Load all orgs the user belongs to ───────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setOrgs([]);
      setCurrentOrg(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    // Denormalized membership list at users/{uid}/orgs/{orgId}
    const userOrgsRef = collection(db, 'users', user.id, 'orgs');

    const unsub = onSnapshot(userOrgsRef, async (snap) => {
      const entries = snap.docs.map(d => ({ orgId: d.id, role: d.data().role }));

      const resolved = await Promise.all(
        entries.map(async ({ orgId, role }) => {
          try {
            const orgSnap = await getDoc(doc(db, 'orgs', orgId));
            if (!orgSnap.exists()) return null;
            return { id: orgId, ...orgSnap.data(), myRole: role };
          } catch { return null; }
        })
      );

      const validOrgs = resolved.filter(Boolean);
      setOrgs(validOrgs);

      // Restore last used org or default to first
      const savedId = localStorage.getItem(`metis_org_${user.id}`);
      const preferred = validOrgs.find(o => o.id === savedId) || validOrgs[0] || null;
      setCurrentOrg(preferred);
      setIsLoading(false);
    }, (err) => {
      console.warn('[OrgContext] snapshot error:', err.message);
      setIsLoading(false);
    });

    return () => unsub();
  }, [isAuthenticated, user?.id]);

  // ── Subscribe to current org members ────────────────────────────────────
  useEffect(() => {
    if (!currentOrg?.id) { setMembers([]); return; }
    const ref = collection(db, 'orgs', currentOrg.id, 'members');
    const unsub = onSnapshot(ref, (snap) => {
      setMembers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [currentOrg?.id]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const switchOrg = useCallback((orgId) => {
    const org = orgs.find(o => o.id === orgId);
    if (!org || !user?.id) return;
    setCurrentOrg(org);
    localStorage.setItem(`metis_org_${user.id}`, orgId);
  }, [orgs, user?.id]);

  /**
   * Create a new org and make the current user its owner.
   * Returns the new orgId.
   */
  const createOrg = useCallback(async ({ name, sector = '' }) => {
    if (!user?.id) throw new Error('Not authenticated');
    const orgId = uuidv4();

    await setDoc(doc(db, 'orgs', orgId), {
      name,
      sector,
      plan: 'free',
      ownerId: user.id,
      createdAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'orgs', orgId, 'members', user.id), {
      role: 'owner',
      email: user.email,
      displayName: user.username,
      joinedAt: serverTimestamp(),
    });
    // Denormalized back-link so we can list user's orgs cheaply
    await setDoc(doc(db, 'users', user.id, 'orgs', orgId), {
      role: 'owner',
      joinedAt: serverTimestamp(),
    });

    localStorage.setItem(`metis_org_${user.id}`, orgId);
    return orgId;
  }, [user]);

  /** Create a pending invite record. Actual acceptance handled client-side via OrgOnboarding. */
  const inviteMember = useCallback(async (email, role = 'member') => {
    if (!currentOrg?.id) throw new Error('No org selected');
    if (!ORG_ROLES[role]) throw new Error(`Invalid role: ${role}`);

    const inviteRef = doc(collection(db, 'orgs', currentOrg.id, 'invites'));
    await setDoc(inviteRef, {
      email,
      role,
      orgId:     currentOrg.id,
      orgName:   currentOrg.name,
      invitedBy: user.id,
      invitedAt: serverTimestamp(),
      status:    'pending',
    });
    return inviteRef.id;
  }, [currentOrg, user?.id]);

  /** Accept an invite — adds the current user to the org. */
  const acceptInvite = useCallback(async (inviteId, orgId) => {
    if (!user?.id) throw new Error('Not authenticated');

    const inviteRef = doc(db, 'orgs', orgId, 'invites', inviteId);
    const inviteSnap = await getDoc(inviteRef);
    if (!inviteSnap.exists()) throw new Error('Invite not found');

    const invite = inviteSnap.data();
    if (invite.status !== 'pending') throw new Error('Invite already used');
    if (invite.email.toLowerCase() !== user.email.toLowerCase())
      throw new Error('Invite email does not match your account');

    await setDoc(doc(db, 'orgs', orgId, 'members', user.id), {
      role: invite.role,
      email: user.email,
      displayName: user.username,
      joinedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'users', user.id, 'orgs', orgId), {
      role: invite.role,
      joinedAt: serverTimestamp(),
    });
    await setDoc(inviteRef, { status: 'accepted' }, { merge: true });
  }, [user]);

  /** Remove a member (admin/owner only). */
  const removeMember = useCallback(async (uid) => {
    if (!currentOrg?.id) throw new Error('No org selected');
    if (uid === currentOrg.ownerId) throw new Error('Cannot remove org owner');
    // NOTE: Firestore rules enforce this is only callable by admins/owners
    await setDoc(doc(db, 'orgs', currentOrg.id, 'members', uid), { status: 'removed' }, { merge: true });
  }, [currentOrg]);

  // Keep fetchWithAuth supplier in sync with current org
  const currentOrgRef = useRef(currentOrg);
  currentOrgRef.current = currentOrg;
  useEffect(() => {
    setOrgIdSupplier(() => currentOrgRef.current?.id ?? null);
  }, []);

  const orgRole  = currentOrg?.myRole ?? null;
  const canWrite = ORG_ROLES[orgRole]?.canWrite ?? false;
  const canAdmin = ORG_ROLES[orgRole]?.canAdmin ?? false;

  return (
    <OrgContext.Provider value={{
      orgs,
      currentOrg,
      orgRole,
      members,
      isLoading,
      canWrite,
      canAdmin,
      switchOrg,
      createOrg,
      inviteMember,
      acceptInvite,
      removeMember,
    }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within OrgProvider');
  return ctx;
}
