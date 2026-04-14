import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Copy,
  RefreshCw,
  LogOut,
  Crown,
  Shield,
  UserX,
  ChevronUp,
  ChevronDown,
  Check,
  AlertTriangle,
  Hash,
  Settings2,
  Link2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';

// ── Helpers ────────────────────────────────────────────────────────────────

function roleLabel(role) {
  if (role === 'owner') return 'Owner';
  if (role === 'admin') return 'Admin';
  return 'Member';
}

function RoleBadge({ role }) {
  if (role === 'owner') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
        <Crown className="w-3 h-3" /> Owner
      </span>
    );
  }
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        <Shield className="w-3 h-3" /> Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      Member
    </span>
  );
}

function Avatar({ name, size = 'md' }) {
  const initials = (name || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const sizeClass = size === 'lg' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ── Create Team form ───────────────────────────────────────────────────────

function CreateTeamForm({ onCreated }) {
  const { createTeam } = useTeam();
  const { refreshUserProfile } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shareProjects, setShareProjects] = useState(true);
  const [shareControls, setShareControls] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setErr('');
    try {
      const result = await createTeam({ name, description, shareProjects, shareControls });
      await refreshUserProfile();
      onCreated?.(result);
    } catch (e) {
      setErr(e.message || 'Failed to create team.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Team Name *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Security Operations"
          required
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What does this team work on?"
          rows={2}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Sharing Defaults</p>
        {[
          { label: 'Share Projects', sub: 'All team members see and edit projects', val: shareProjects, set: setShareProjects },
          { label: 'Share Controls', sub: 'Control library is shared across the team', val: shareControls, set: setShareControls },
        ].map(({ label, sub, val, set }) => (
          <label key={label} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
            <div>
              <p className="text-sm font-medium text-gray-800">{label}</p>
              <p className="text-xs text-gray-500">{sub}</p>
            </div>
            <div
              onClick={() => set(v => !v)}
              className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${val ? 'bg-blue-500' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${val ? 'left-5' : 'left-1'}`} />
            </div>
          </label>
        ))}
      </div>

      {err && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {err}
        </div>
      )}

      <button
        type="submit"
        disabled={busy || !name.trim()}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl text-sm transition-colors"
      >
        {busy ? 'Creating…' : 'Create Team'}
      </button>
    </form>
  );
}

// ── Join Team form ─────────────────────────────────────────────────────────

function JoinTeamForm({ onJoined }) {
  const { joinTeam } = useTeam();
  const { refreshUserProfile } = useAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const result = await joinTeam(code);
      await refreshUserProfile();
      onJoined?.(result);
    } catch (e) {
      setErr(e.message || 'Invalid invite code.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Invite Code</label>
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. AB3K7Z"
          maxLength={6}
          required
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-mono tracking-widest outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all uppercase"
        />
        <p className="text-xs text-gray-400 mt-1">6-character code from your team admin</p>
      </div>

      {err && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {err}
        </div>
      )}

      <button
        type="submit"
        disabled={busy || code.length < 6}
        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold rounded-xl text-sm transition-colors"
      >
        {busy ? 'Joining…' : 'Join Team'}
      </button>
    </form>
  );
}

// ── No-team view ───────────────────────────────────────────────────────────

function NoTeamView() {
  const [panel, setPanel] = useState(null); // 'create' | 'join'

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">You're not in a team yet</h2>
        <p className="text-gray-500 mt-2">Create a new team or join an existing one with an invite code.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`card cursor-pointer border-2 transition-colors ${panel === 'create' ? 'border-blue-400' : 'border-transparent hover:border-gray-300'}`}
          onClick={() => setPanel(p => p === 'create' ? null : 'create')}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Create a Team</h3>
              <p className="text-xs text-gray-500">Start fresh, invite others</p>
            </div>
            {panel === 'create' ? <ChevronUp className="w-4 h-4 text-gray-400 ml-auto" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />}
          </div>

          <AnimatePresence>
            {panel === 'create' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
                onClick={e => e.stopPropagation()}
              >
                <div className="border-t border-gray-100 pt-4 mt-2">
                  <CreateTeamForm />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Join */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`card cursor-pointer border-2 transition-colors ${panel === 'join' ? 'border-purple-400' : 'border-transparent hover:border-gray-300'}`}
          onClick={() => setPanel(p => p === 'join' ? null : 'join')}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Join a Team</h3>
              <p className="text-xs text-gray-500">Enter an invite code</p>
            </div>
            {panel === 'join' ? <ChevronUp className="w-4 h-4 text-gray-400 ml-auto" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />}
          </div>

          <AnimatePresence>
            {panel === 'join' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
                onClick={e => e.stopPropagation()}
              >
                <div className="border-t border-gray-100 pt-4 mt-2">
                  <JoinTeamForm />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

// ── Team dashboard ─────────────────────────────────────────────────────────

function TeamDashboard() {
  const { user, refreshUserProfile } = useAuth();
  const {
    team, memberList, myRole, isTeamOwner, isTeamAdmin,
    leaveTeam, removeMember, promoteToAdmin, demoteToMember,
    updateTeamSettings, regenerateInviteCode,
  } = useTeam();

  const [copied, setCopied] = useState(false);
  const [regenBusy, setRegenBusy] = useState(false);
  const [leaveBusy, setLeaveBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(null);
  const [shareProjects, setShareProjects] = useState(team?.shareProjects ?? true);
  const [shareControls, setShareControls] = useState(team?.shareControls ?? true);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const canManage = isTeamOwner || isTeamAdmin;

  function copyCode() {
    navigator.clipboard.writeText(team.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleRegen() {
    setRegenBusy(true);
    try { await regenerateInviteCode(); } finally { setRegenBusy(false); }
  }

  async function handleLeave() {
    if (!confirm('Are you sure you want to leave this team?')) return;
    setLeaveBusy(true);
    try {
      await leaveTeam();
      await refreshUserProfile();
    } finally {
      setLeaveBusy(false);
    }
  }

  async function handleRemove(uid) {
    if (!confirm('Remove this member from the team?')) return;
    setActionBusy(uid + '_remove');
    try { await removeMember(uid); } finally { setActionBusy(null); }
  }

  async function handlePromote(uid) {
    setActionBusy(uid + '_promote');
    try { await promoteToAdmin(uid); } finally { setActionBusy(null); }
  }

  async function handleDemote(uid) {
    setActionBusy(uid + '_demote');
    try { await demoteToMember(uid); } finally { setActionBusy(null); }
  }

  async function handleSaveSettings() {
    await updateTeamSettings({ shareProjects, shareControls });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  }

  const sortedMembers = [...memberList].sort((a, b) => {
    const order = { owner: 0, admin: 1, member: 2 };
    return (order[a.role] ?? 3) - (order[b.role] ?? 3);
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Team header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center shadow-md">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{team.name}</h2>
              {team.description && <p className="text-sm text-gray-500 mt-0.5">{team.description}</p>}
              <p className="text-xs text-gray-400 mt-1">
                {memberList.length} member{memberList.length !== 1 ? 's' : ''} · Your role: <strong>{roleLabel(myRole)}</strong>
              </p>
            </div>
          </div>
          {!isTeamOwner && (
            <button
              onClick={handleLeave}
              disabled={leaveBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              {leaveBusy ? 'Leaving…' : 'Leave'}
            </button>
          )}
        </div>
      </motion.div>

      {/* Invite code */}
      {canManage && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Invite Code</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Share this code with colleagues so they can join your team from the Team page.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl flex-1">
              <Hash className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="font-mono text-lg font-bold tracking-widest text-gray-900 flex-1 text-center">
                {team.inviteCode}
              </span>
            </div>
            <button
              onClick={copyCode}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors border ${
                copied
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            {isTeamOwner && (
              <button
                onClick={handleRegen}
                disabled={regenBusy}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                title="Generate new code (invalidates current code)"
              >
                <RefreshCw className={`w-4 h-4 ${regenBusy ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Members */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
        <div className="flex items-center gap-2 mb-5">
          <Users className="w-4 h-4 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Members</h3>
          <span className="ml-auto text-xs text-gray-400">{memberList.length} total</span>
        </div>

        <div className="space-y-2">
          {sortedMembers.map(member => {
            const isMe = member.uid === user?.id;
            const canModify = canManage && !isMe && member.role !== 'owner';
            return (
              <div
                key={member.uid}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isMe ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50'}`}
              >
                <Avatar name={member.username} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{member.username}</p>
                    {isMe && <span className="text-xs text-blue-500 font-medium">(you)</span>}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{member.email}</p>
                </div>
                <RoleBadge role={member.role} />
                {canModify && (
                  <div className="flex items-center gap-1 ml-2">
                    {member.role === 'member' ? (
                      <button
                        onClick={() => handlePromote(member.uid)}
                        disabled={actionBusy === member.uid + '_promote'}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Promote to Admin"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDemote(member.uid)}
                        disabled={actionBusy === member.uid + '_demote'}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                        title="Demote to Member"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(member.uid)}
                      disabled={actionBusy === member.uid + '_remove'}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Remove from team"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Sharing settings — owner only */}
      {isTeamOwner && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card">
          <div className="flex items-center gap-2 mb-5">
            <Settings2 className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Sharing Settings</h3>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Share Projects', sub: 'All members can view and edit team projects', val: shareProjects, set: setShareProjects },
              { label: 'Share Controls', sub: 'Control library is shared across the team', val: shareControls, set: setShareControls },
            ].map(({ label, sub, val, set }) => (
              <label key={label} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-500">{sub}</p>
                </div>
                <div
                  onClick={() => set(v => !v)}
                  className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${val ? 'bg-blue-500' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${val ? 'left-5' : 'left-1'}`} />
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={handleSaveSettings}
            className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              settingsSaved
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-slate-900 text-white hover:bg-slate-700'
            }`}
          >
            {settingsSaved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Settings'}
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const { team, teamLoading } = useTeam();

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Team</h1>
        <p className="text-gray-500 mt-1">
          {team ? `Manage your team and collaborate with colleagues` : 'Create or join a team to collaborate'}
        </p>
      </motion.div>

      {teamLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : team ? (
        <TeamDashboard />
      ) : (
        <NoTeamView />
      )}
    </div>
  );
}
