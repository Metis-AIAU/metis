import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  doc,
  setDoc,
  updateDoc,
  deleteField,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const TeamContext = createContext(null);

// ── Helpers ────────────────────────────────────────────────────────────────

/** Generates a 6-char alphanumeric invite code (no ambiguous chars) */
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ── Provider ───────────────────────────────────────────────────────────────

export function TeamProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [team, setTeam]             = useState(null);
  const [teamLoading, setTeamLoading] = useState(true);

  // ── Real-time subscription to the team document ────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user?.teamId) {
      setTeam(null);
      setTeamLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, 'teams', user.teamId),
      (snap) => {
        setTeam(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setTeamLoading(false);
      },
      (err) => {
        console.warn('[TeamContext] snapshot error:', err.message);
        setTeamLoading(false);
      }
    );

    return () => unsub();
  }, [user?.teamId, isAuthenticated]);

  // ── Create a brand-new team ────────────────────────────────────────────
  const createTeam = useCallback(async ({ name, description = '', shareControls, shareProjects }) => {
    if (!user) throw new Error('Not authenticated');

    const teamId    = randomId();
    const inviteCode = generateInviteCode();

    await setDoc(doc(db, 'teams', teamId), {
      name:          name.trim(),
      description:   description.trim(),
      createdBy:     user.id,
      createdAt:     serverTimestamp(),
      inviteCode,
      shareControls: !!shareControls,
      shareProjects: !!shareProjects,
      members: {
        [user.id]: {
          username: user.username,
          email:    user.email,
          role:     'owner',
          joinedAt: serverTimestamp(),
        },
      },
    });

    // Update the user's own profile so AuthContext picks up the new teamId
    await setDoc(
      doc(db, 'users', user.id),
      { accountType: 'team', teamId, teamRole: 'owner' },
      { merge: true }
    );

    return { teamId, inviteCode };
  }, [user]);

  // ── Join a team via invite code ────────────────────────────────────────
  const joinTeam = useCallback(async (rawCode) => {
    if (!user) throw new Error('Not authenticated');

    const code = rawCode.trim().toUpperCase();
    const q    = query(collection(db, 'teams'), where('inviteCode', '==', code));
    const snap = await getDocs(q);

    if (snap.empty) throw new Error('Invalid invite code — no team found.');

    const teamDoc = snap.docs[0];
    const teamId  = teamDoc.id;
    const data    = teamDoc.data();

    if (data.members?.[user.id]) {
      throw new Error('You are already a member of this team.');
    }

    await updateDoc(doc(db, 'teams', teamId), {
      [`members.${user.id}`]: {
        username: user.username,
        email:    user.email,
        role:     'member',
        joinedAt: serverTimestamp(),
      },
    });

    await setDoc(
      doc(db, 'users', user.id),
      { accountType: 'team', teamId, teamRole: 'member' },
      { merge: true }
    );

    return { teamId, teamName: data.name };
  }, [user]);

  // ── Leave the current team ─────────────────────────────────────────────
  const leaveTeam = useCallback(async () => {
    if (!user || !team) return;

    await updateDoc(doc(db, 'teams', team.id), {
      [`members.${user.id}`]: deleteField(),
    });

    await setDoc(
      doc(db, 'users', user.id),
      { accountType: 'individual', teamId: null, teamRole: null },
      { merge: true }
    );
  }, [user, team]);

  // ── Update sharing / name / description (owner only) ──────────────────
  const updateTeamSettings = useCallback(async (updates) => {
    if (!team) return;
    await updateDoc(doc(db, 'teams', team.id), updates);
  }, [team]);

  // ── Regenerate invite code (owner/admin only) ──────────────────────────
  const regenerateInviteCode = useCallback(async () => {
    if (!team) return null;
    const code = generateInviteCode();
    await updateDoc(doc(db, 'teams', team.id), { inviteCode: code });
    return code;
  }, [team]);

  // ── Remove a specific member (owner/admin only) ────────────────────────
  const removeMember = useCallback(async (memberId) => {
    if (!team) return;
    await updateDoc(doc(db, 'teams', team.id), {
      [`members.${memberId}`]: deleteField(),
    });
    // Reset the removed user's profile
    await setDoc(
      doc(db, 'users', memberId),
      { accountType: 'individual', teamId: null, teamRole: null },
      { merge: true }
    );
  }, [team]);

  // ── Promote member to admin ────────────────────────────────────────────
  const promoteToAdmin = useCallback(async (memberId) => {
    if (!team) return;
    await updateDoc(doc(db, 'teams', team.id), {
      [`members.${memberId}.role`]: 'admin',
    });
  }, [team]);

  // ── Demote admin back to member ────────────────────────────────────────
  const demoteToMember = useCallback(async (memberId) => {
    if (!team) return;
    await updateDoc(doc(db, 'teams', team.id), {
      [`members.${memberId}.role`]: 'member',
    });
  }, [team]);

  // ── Derived values ─────────────────────────────────────────────────────
  const myRole      = team?.members?.[user?.id]?.role ?? null;
  const isTeamOwner = !!user && team?.createdBy === user.id;
  const isTeamAdmin = myRole === 'owner' || myRole === 'admin';

  const memberList = team
    ? Object.entries(team.members || {}).map(([uid, data]) => ({ uid, ...data }))
    : [];

  // Convenience Firestore doc refs consumed by ThreatContext / ComplianceContext
  const teamThreatDocRef     = team ? doc(db, 'teams', team.id, 'sharedData', 'threatData')     : null;
  const teamComplianceDocRef = team ? doc(db, 'teams', team.id, 'sharedData', 'complianceData') : null;

  const value = {
    team,
    teamLoading,
    memberList,
    myRole,
    isTeamOwner,
    isTeamAdmin,
    createTeam,
    joinTeam,
    leaveTeam,
    updateTeamSettings,
    regenerateInviteCode,
    removeMember,
    promoteToAdmin,
    demoteToMember,
    teamThreatDocRef,
    teamComplianceDocRef,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within a TeamProvider');
  return ctx;
}
