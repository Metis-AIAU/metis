import { useState } from 'react';
import { motion } from 'framer-motion';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useOrg, ORG_ROLES, ORG_PLANS } from '../context/OrgContext';
import { useAuth } from '../context/AuthContext';

const ROLE_OPTIONS = ['admin', 'member', 'viewer'];

const SECTORS = [
  'Energy', 'Water', 'Transport', 'Health', 'Communications',
  'Banking & Finance', 'Defence', 'Education', 'Government', 'Other',
];

// ── Sub-components ────────────────────────────────────────────────────────────

function MemberRow({ member, currentUserId, isAdmin, orgId }) {
  const [updating, setUpdating] = useState(false);

  async function changeRole(role) {
    setUpdating(true);
    try {
      await setDoc(doc(db, 'orgs', orgId, 'members', member.uid), { role }, { merge: true });
    } finally {
      setUpdating(false);
    }
  }

  const isSelf = member.uid === currentUserId;
  const isOwner = member.role === 'owner';

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
          {(member.displayName || member.email || '?')[0].toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {member.displayName || member.email}
            {isSelf && <span className="ml-2 text-xs text-gray-400">(you)</span>}
          </p>
          <p className="text-xs text-gray-500">{member.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isOwner || !isAdmin || isSelf ? (
          <span className="text-xs font-medium text-gray-500 capitalize px-2 py-1 bg-gray-100 rounded">
            {member.role}
          </span>
        ) : (
          <select
            value={member.role}
            onChange={e => changeRole(e.target.value)}
            disabled={updating}
            className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {ROLE_OPTIONS.map(r => (
              <option key={r} value={r}>{ORG_ROLES[r].label}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

function InviteForm({ onInvite, orgId }) {
  const [email, setEmail] = useState('');
  const [role, setRole]   = useState('member');
  const [inviteCode, setInviteCode] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    setStatus('');
    setInviteCode('');
    try {
      const inviteId = await onInvite(email.trim().toLowerCase(), role);
      const code = `${orgId}:${inviteId}`;
      setInviteCode(code);
      setStatus('Invite created. Share this code with the user:');
      setEmail('');
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="colleague@example.com"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {ROLE_OPTIONS.map(r => (
            <option key={r} value={r}>{ORG_ROLES[r].label}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          {isLoading ? '…' : 'Invite'}
        </button>
      </div>
      {status && (
        <p className={`text-xs px-3 py-2 rounded-lg ${status.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          {status}
        </p>
      )}
      {inviteCode && (
        <div className="mt-1 flex items-center gap-2">
          <code className="flex-1 text-xs font-mono bg-gray-100 text-gray-800 px-3 py-2 rounded-lg break-all select-all">
            {inviteCode}
          </code>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(inviteCode)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
          >
            Copy
          </button>
        </div>
      )}
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrgSettings() {
  const { user } = useAuth();
  const { currentOrg, orgs, members, orgRole, canAdmin, canWrite, switchOrg, createOrg, updateOrg, inviteMember } = useOrg();

  const [newOrgName, setNewOrgName] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [showNewOrg, setShowNewOrg]   = useState(false);
  const [createError, setCreateError] = useState('');

  const [editing, setEditing]     = useState(false);
  const [editName, setEditName]   = useState('');
  const [editSector, setEditSector] = useState('');
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState('');

  function startEdit() {
    setEditName(currentOrg.name);
    setEditSector(currentOrg.sector || '');
    setSaveError('');
    setEditing(true);
  }

  async function handleSaveOrg(e) {
    e.preventDefault();
    if (!editName.trim()) { setSaveError('Name is required'); return; }
    setSaving(true);
    setSaveError('');
    try {
      await updateOrg({ name: editName.trim(), sector: editSector });
      setEditing(false);
    } catch (err) {
      setSaveError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (!currentOrg) return null;

  async function handleCreateOrg(e) {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setCreatingOrg(true);
    setCreateError('');
    try {
      await createOrg({ name: newOrgName.trim() });
      setNewOrgName('');
      setShowNewOrg(false);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreatingOrg(false);
    }
  }

  const plan = ORG_PLANS[currentOrg.plan] || ORG_PLANS.free;
  const activeMembers = members.filter(m => m.status !== 'removed');

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organisation Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your workspace, members, and plan.</p>
      </div>

      {/* Org switcher */}
      {orgs.length > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <h2 className="font-semibold text-gray-900 mb-3">Switch Organisation</h2>
          <div className="space-y-2">
            {orgs.map(org => (
              <button
                key={org.id}
                onClick={() => switchOrg(org.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-colors ${
                  org.id === currentOrg.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <span className="font-medium">{org.name}</span>
                <span className="text-xs text-gray-400 capitalize">{org.myRole}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Current org info + edit */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
        {editing ? (
          <form onSubmit={handleSaveOrg} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organisation name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
              <select
                value={editSector}
                onChange={e => setEditSector(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">— None —</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {saveError && (
              <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">{saveError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{currentOrg.name}</h2>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  currentOrg.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                  currentOrg.plan === 'pro'        ? 'bg-blue-100 text-blue-700'     :
                                                      'bg-gray-100 text-gray-600'
                }`}>
                  {plan.label}
                </span>
                <span className="text-xs text-gray-400 capitalize px-2 py-1 bg-gray-50 rounded-full">
                  {orgRole}
                </span>
                {canAdmin && (
                  <button
                    onClick={startEdit}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeMembers.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Members{plan.maxMembers ? ` / ${plan.maxMembers}` : ''}
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 capitalize">{currentOrg.sector || '—'}</p>
                <p className="text-xs text-gray-500 mt-1">Sector</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {plan.aiCalls != null ? plan.aiCalls : '∞'}
                </p>
                <p className="text-xs text-gray-500 mt-1">AI calls / mo</p>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Members */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
        <h2 className="font-semibold text-gray-900 mb-1">Members</h2>
        <p className="text-xs text-gray-500 mb-4">
          <strong>Owner</strong> — full control &nbsp;·&nbsp;
          <strong>Admin</strong> — manage members &nbsp;·&nbsp;
          <strong>Member</strong> — read/write data &nbsp;·&nbsp;
          <strong>Viewer</strong> — read-only
        </p>

        <div className="divide-y divide-gray-100">
          {members.map(m => (
            <MemberRow
              key={m.uid}
              member={m}
              currentUserId={user?.id}
              isAdmin={canAdmin}
              orgId={currentOrg.id}
            />
          ))}
        </div>

        {canAdmin && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Invite member</h3>
            <InviteForm onInvite={inviteMember} orgId={currentOrg.id} />
          </div>
        )}
      </motion.div>

      {/* Create new org */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
        <h2 className="font-semibold text-gray-900 mb-1">Create another organisation</h2>
        <p className="text-xs text-gray-500 mb-3">
          Useful for separating clients, projects, or business units.
        </p>

        {showNewOrg ? (
          <form onSubmit={handleCreateOrg} className="space-y-3">
            <input
              type="text"
              value={newOrgName}
              onChange={e => setNewOrgName(e.target.value)}
              placeholder="Organisation name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              autoFocus
            />
            {createError && (
              <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">{createError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creatingOrg}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {creatingOrg ? 'Creating…' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowNewOrg(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowNewOrg(true)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + New organisation
          </button>
        )}
      </motion.div>
    </div>
  );
}
