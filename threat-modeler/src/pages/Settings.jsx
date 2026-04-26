import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2,
  RefreshCcw,
  Database,
  FileJson,
  AlertTriangle,
  CheckCircle2,
  Info,
  Shield,
  Eye,
  EyeOff,
  Server,
  Key,
  Globe,
  Lock,
  ExternalLink,
  Save,
  ShieldCheck,
  Users,
  ArrowDown,
  ArrowRight,
  Zap,
  XCircle,
} from 'lucide-react';
import { useThreatContext } from '../context/ThreatContext';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';

export default function Settings() {
  const { state, resetToSampleData } = useThreatContext();
  const { user, isAuthenticated, updateDisplayName, updateUserPassword } = useAuth();
  const { currentOrg, canAdmin, orgRole } = useOrg();
  const [exportStatus, setExportStatus] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [showSecrets, setShowSecrets] = useState(false);

  // ── Profile state ──────────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(user?.username || '');
  const [nameStatus, setNameStatus]   = useState('');
  const [nameSaving, setNameSaving]   = useState(false);

  const [currentPwd, setCurrentPwd]   = useState('');
  const [newPwd, setNewPwd]           = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [pwdStatus, setPwdStatus]     = useState('');
  const [pwdSaving, setPwdSaving]     = useState(false);
  const [showPwds, setShowPwds]       = useState(false);

  async function handleSaveName(e) {
    e.preventDefault();
    if (!displayName.trim()) return;
    setNameSaving(true);
    setNameStatus('');
    try {
      await updateDisplayName(displayName.trim());
      setNameStatus('saved');
      setTimeout(() => setNameStatus(''), 2500);
    } catch (err) {
      setNameStatus(err.message || 'Failed to update name');
    } finally {
      setNameSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (newPwd !== confirmPwd) { setPwdStatus('Passwords do not match.'); return; }
    if (newPwd.length < 6)     { setPwdStatus('New password must be at least 6 characters.'); return; }
    setPwdSaving(true);
    setPwdStatus('');
    try {
      await updateUserPassword(currentPwd, newPwd);
      setPwdStatus('saved');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setTimeout(() => setPwdStatus(''), 2500);
    } catch (err) {
      setPwdStatus(err.message || 'Failed to update password');
    } finally {
      setPwdSaving(false);
    }
  }

  // Confluence config — persisted in localStorage per user
  const CONFLUENCE_KEY = 'confluenceConfig';
  const [confluenceConfig, setConfluenceConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CONFLUENCE_KEY) || '{}'); } catch { return {}; }
  });
  const [showConfluenceToken, setShowConfluenceToken] = useState(false);
  const [confluenceSaved, setConfluenceSaved] = useState(false);

  const saveConfluenceConfig = () => {
    localStorage.setItem(CONFLUENCE_KEY, JSON.stringify(confluenceConfig));
    setConfluenceSaved(true);
    setTimeout(() => setConfluenceSaved(false), 2500);
  };

  const clearConfluenceConfig = () => {
    localStorage.removeItem(CONFLUENCE_KEY);
    setConfluenceConfig({});
  };

  // Only ariel.egber@gmail.com is the application admin
  const isAdmin = !!user?.isAppAdmin;

  const firebaseConfig = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || '',
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || '',
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || '',
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '',
    measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID    || '',
  };

  const maskValue = (value) => {
    if (!value) return '—';
    if (showSecrets) return value;
    if (value.length <= 8) return '••••••••';
    return value.slice(0, 4) + '••••' + value.slice(-4);
  };

  const handleExport = () => {
    try {
      const { isLoading, ...dataToExport } = state;
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `threat-model-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportStatus({ type: 'success', message: 'Data exported successfully!' });
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      setExportStatus({ type: 'error', message: 'Failed to export data' });
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.projects && data.threats && data.controls) {
          localStorage.setItem('threatModelingData', JSON.stringify(data));
          setImportStatus({ type: 'success', message: 'Data imported successfully! Refreshing...' });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          throw new Error('Invalid data format');
        }
      } catch (error) {
        setImportStatus({ type: 'error', message: 'Invalid file format' });
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset to sample data? All your current data will be lost.')) {
      resetToSampleData();
      setExportStatus({ type: 'success', message: 'Data reset to sample data!' });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
      localStorage.removeItem('threatModelingData');
      setExportStatus({ type: 'success', message: 'All data cleared!' });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const stats = {
    projects: state.projects.length,
    threats: state.threats.length,
    controls: state.controls.length,
    assets: state.assets.length,
    dataFlows: state.dataFlows.length,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage application settings and data</p>
      </motion.div>

      {/* ── Profile ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-8"
      >
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold text-gray-900">Profile</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Display name */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Display name</h3>
            <div className="mb-2">
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <p className="text-sm text-gray-800 font-mono bg-gray-50 px-3 py-2 rounded-lg">{user?.email}</p>
            </div>
            <form onSubmit={handleSaveName} className="space-y-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              {nameStatus && nameStatus !== 'saved' && (
                <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-1.5">{nameStatus}</p>
              )}
              <button
                type="submit"
                disabled={nameSaving || !displayName.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {nameStatus === 'saved'
                  ? <><CheckCircle2 className="w-4 h-4" /> Saved</>
                  : nameSaving ? 'Saving…' : <><Save className="w-4 h-4" /> Save name</>
                }
              </button>
            </form>
          </div>

          {/* Change password */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Change password</h3>
            <form onSubmit={handleChangePassword} className="space-y-2">
              {[
                { label: 'Current password', value: currentPwd, onChange: setCurrentPwd, auto: 'current-password' },
                { label: 'New password',     value: newPwd,     onChange: setNewPwd,     auto: 'new-password' },
                { label: 'Confirm new',      value: confirmPwd, onChange: setConfirmPwd,  auto: 'new-password' },
              ].map(({ label, value, onChange, auto }) => (
                <div key={label}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <div className="relative">
                    <input
                      type={showPwds ? 'text' : 'password'}
                      value={value}
                      onChange={e => onChange(e.target.value)}
                      autoComplete={auto}
                      className="w-full px-3 py-2 pr-9 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPwds(v => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPwds ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
              {pwdStatus && pwdStatus !== 'saved' && (
                <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-1.5">{pwdStatus}</p>
              )}
              <button
                type="submit"
                disabled={pwdSaving || !currentPwd || !newPwd || !confirmPwd}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {pwdStatus === 'saved'
                  ? <><CheckCircle2 className="w-4 h-4" /> Updated</>
                  : pwdSaving ? 'Updating…' : <><Lock className="w-4 h-4" /> Update password</>
                }
              </button>
            </form>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Data Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center gap-2 mb-6">
            <Database className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-900">Data Statistics</h2>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Projects', count: stats.projects, color: 'blue' },
              { label: 'Threats', count: stats.threats, color: 'red' },
              { label: 'Controls', count: stats.controls, color: 'green' },
              { label: 'Assets', count: stats.assets, color: 'purple' },
              { label: 'Data Flows', count: stats.dataFlows, color: 'orange' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-gray-600">{item.label}</span>
                <span className={`text-lg font-bold text-${item.color}-600`}>{item.count}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Total records: {Object.values(stats).reduce((a, b) => a + b, 0)}
            </p>
          </div>
        </motion.div>

        {/* Export/Import */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center gap-2 mb-6">
            <FileJson className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-900">Data Management</h2>
          </div>

          <div className="space-y-4">
            {/* Export */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Download className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Export Data</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Download all your threat modeling data as a JSON file
                  </p>
                  <button onClick={handleExport} className="btn-primary mt-3">
                    <Download className="w-4 h-4 mr-2" />
                    Export JSON
                  </button>
                </div>
              </div>
            </div>

            {/* Import */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Upload className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Import Data</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Load threat modeling data from a JSON file
                  </p>
                  <label className="btn-success mt-3 cursor-pointer inline-flex">
                    <Upload className="w-4 h-4 mr-2" />
                    Import JSON
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {(exportStatus || importStatus) && (
            <div
              className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                (exportStatus || importStatus)?.type === 'success'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {(exportStatus || importStatus)?.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
              <span className="text-sm">{(exportStatus || importStatus)?.message}</span>
            </div>
          )}
        </motion.div>

        {/* Reset Options */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card lg:col-span-2"
        >
          <div className="flex items-center gap-2 mb-6">
            <RefreshCcw className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-gray-900">Reset Options</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-orange-200 bg-orange-50 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <RefreshCcw className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Reset to Sample Data</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Replace all current data with the sample data set
                  </p>
                  <button onClick={handleReset} className="btn-warning mt-3">
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Reset to Sample
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border border-red-200 bg-red-50 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Clear All Data</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Permanently delete all data. This cannot be undone.
                  </p>
                  <button onClick={handleClearAll} className="btn-danger mt-3">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Firebase & Firestore Configuration — admin only */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="card lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-amber-500" />
                <h2 className="font-semibold text-gray-900">Firebase & Firestore Configuration</h2>
                {isAdmin && (
                  <span className="badge text-xs" style={{ backgroundColor: '#fef3c7', color: '#a16207' }}>
                    <Lock className="w-3 h-3 mr-1" />
                    Admin
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowSecrets(!showSecrets)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showSecrets ? 'Hide Values' : 'Reveal Values'}
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Sensitive configuration — visible to administrators only
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    These values are loaded from environment variables and control the connection to
                    your Firebase project. Changes must be made in the <code className="bg-amber-100 px-1 rounded">.env</code> file
                    and require a server restart.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              {[
                { label: 'Project ID',          key: 'projectId',         icon: Globe, sensitive: false },
                { label: 'Auth Domain',          key: 'authDomain',       icon: Globe, sensitive: false },
                { label: 'API Key',              key: 'apiKey',           icon: Key,   sensitive: true },
                { label: 'App ID',               key: 'appId',           icon: Key,   sensitive: true },
                { label: 'Storage Bucket',       key: 'storageBucket',   icon: Database, sensitive: false },
                { label: 'Messaging Sender ID',  key: 'messagingSenderId', icon: Server, sensitive: true },
                { label: 'Measurement ID',       key: 'measurementId',   icon: Server, sensitive: false },
              ].map(({ label, key, icon: Icon, sensitive }) => (
                <div
                  key={key}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                    <p className={`text-sm font-mono mt-0.5 ${firebaseConfig[key] ? 'text-gray-900' : 'text-gray-400'}`}>
                      {sensitive ? maskValue(firebaseConfig[key]) : (firebaseConfig[key] || '—')}
                    </p>
                  </div>
                  {sensitive && (
                    <Lock className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                  {currentOrg && (
                    <span>
                      Org data: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
                        orgs/{currentOrg.id.slice(0, 8)}…/data/threatData
                      </code>
                    </span>
                  )}
                  {currentOrg && (
                    <span>
                      Compliance: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
                        orgs/{currentOrg.id.slice(0, 8)}…/data/complianceState
                      </code>
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1.5 text-xs text-green-600">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Connected
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Security Architecture — org admin / owner only */}
        {(canAdmin || isAdmin) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            className="card lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h2 className="font-semibold text-gray-900">Security Architecture</h2>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Admin only
                </span>
              </div>
              <span className="text-xs text-gray-400 italic">As-built security posture</span>
            </div>

            {/* ── Architecture flow diagram ── */}
            <div className="space-y-2 mb-8">

              {/* Layer 1 — Browser */}
              <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold shrink-0">1</span>
                  <span className="font-semibold text-blue-800 text-sm">Browser / Client</span>
                  <span className="ml-auto text-xs text-blue-500 font-mono">React SPA (Vite)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      icon: Shield,
                      title: 'Firebase Auth',
                      color: 'blue',
                      lines: ['ID Token (short-lived JWT)', 'Email verification gate', 'App-admin bypass flag'],
                    },
                    {
                      icon: Users,
                      title: 'Org RBAC (OrgContext)',
                      color: 'blue',
                      lines: ['owner / admin / member / viewer', 'Viewer → read-only banner', 'X-Org-Id on every /api/* call'],
                    },
                    {
                      icon: Database,
                      title: 'Firestore Client SDK',
                      color: 'blue',
                      lines: ['onSnapshot real-time sync', 'orgs/{orgId}/data/* path', 'Rules enforced backend-side'],
                    },
                  ].map(({ icon: Icon, title, lines }) => (
                    <div key={title} className="bg-white rounded-lg p-3 border border-blue-100">
                      <div className="font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5 text-xs">
                        <Icon className="w-3.5 h-3.5 text-blue-500" /> {title}
                      </div>
                      <ul className="space-y-0.5">
                        {lines.map(l => <li key={l} className="text-xs text-gray-500">· {l}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connector */}
              <div className="flex flex-col items-center gap-0.5 py-1 text-gray-400">
                <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                  Authorization: Bearer &lt;token&gt; · X-Org-Id: &lt;orgId&gt; · HTTPS
                </span>
                <ArrowDown className="w-5 h-5 mt-0.5" />
              </div>

              {/* Layer 2 — Express */}
              <div className="rounded-xl border-2 border-slate-300 bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-5 h-5 rounded-full bg-slate-700 text-white text-[10px] flex items-center justify-center font-bold shrink-0">2</span>
                  <span className="font-semibold text-slate-800 text-sm">API Gateway · Cloud Run / Express</span>
                  <span className="ml-auto text-xs text-slate-400 font-mono">australia-southeast1</span>
                </div>

                {/* Middleware chain */}
                <div className="flex items-start gap-2 mb-4 flex-wrap">
                  {[
                    { fn: 'verifyFirebaseToken', note: 'validates ID token via Admin SDK' },
                    { fn: 'requireOrgMember',    note: 'checks Firestore org membership' },
                    { fn: 'route handler',       note: 'analyze / advanced / compliance' },
                  ].map((step, i) => (
                    <div key={step.fn} className="flex items-center gap-2">
                      {i > 0 && <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                      <div className="flex items-start gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-px" />
                        <div>
                          <div className="text-xs font-semibold text-slate-800 font-mono leading-tight">{step.fn}</div>
                          <div className="text-[11px] text-slate-500 leading-tight">{step.note}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Route table */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { route: '/api/analyze',      access: '🔒 auth + org' },
                    { route: '/api/advanced/*',   access: '🔒 auth + org' },
                    { route: '/api/compliance/*', access: '🔒 auth + org' },
                    { route: '/api/health',       access: '🌐 public probe' },
                  ].map(({ route, access }) => (
                    <div key={route} className="bg-white rounded-lg px-2.5 py-2 border border-slate-200">
                      <div className="text-xs font-mono text-slate-700 truncate">{route}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{access}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connector */}
              <div className="flex flex-col items-center gap-0.5 py-1 text-gray-400">
                <ArrowDown className="w-5 h-5" />
              </div>

              {/* Layer 3 — Infrastructure */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-orange-600" />
                    <span className="font-semibold text-orange-800 text-sm">Cloud Firestore</span>
                  </div>
                  <div className="font-mono text-[11px] bg-orange-100 px-2 py-1 rounded mb-2 break-all text-orange-700">
                    orgs/{currentOrg?.id?.slice(0, 8) || '—'}…/data/*
                  </div>
                  <ul className="text-xs text-orange-700 space-y-0.5">
                    <li>· Deny-by-default catch-all</li>
                    <li>· isOrgWriter / isOrgAdmin helpers</li>
                    <li>· Invite email-scoped update only</li>
                    <li>· Legacy paths locked read-only</li>
                  </ul>
                </div>

                <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="w-4 h-4 text-green-700" />
                    <span className="font-semibold text-green-800 text-sm">Secret Manager</span>
                  </div>
                  <ul className="text-xs text-green-700 space-y-0.5">
                    <li>· ANTHROPIC_API_KEY → runtime inject</li>
                    <li>· VITE_FIREBASE_* → build-time fetch</li>
                    <li>· Firebase Admin uses ADC (no key stored)</li>
                    <li>· CI/CD via Workload Identity Federation</li>
                  </ul>
                </div>

                <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-purple-800 text-sm">Claude AI + RAG</span>
                  </div>
                  <ul className="text-xs text-purple-700 space-y-0.5">
                    <li>· claude-sonnet-4-6 (analyze)</li>
                    <li>· claude-opus-4-6 (advanced docs)</li>
                    <li>· Vertex AI embeddings (RAG retrieval)</li>
                    <li>· compliance_embeddings (shared read-only)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* ── RBAC matrix ── */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-500" /> Role-Based Access Control
              </h3>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2.5 text-left font-semibold text-gray-600 w-24">Role</th>
                      {['Read data', 'Write data', 'AI routes', 'Invite members', 'Edit org', 'Delete org'].map(h => (
                        <th key={h} className="px-2 py-2.5 text-center font-semibold text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { role: 'owner',  colorClass: 'text-purple-700', caps: [true,  true,  true,  true,  true,  true]  },
                      { role: 'admin',  colorClass: 'text-blue-700',   caps: [true,  true,  true,  true,  true,  false] },
                      { role: 'member', colorClass: 'text-green-700',  caps: [true,  true,  true,  false, false, false] },
                      { role: 'viewer', colorClass: 'text-gray-600',   caps: [true,  false, false, false, false, false] },
                    ].map(({ role, colorClass, caps }) => (
                      <tr key={role} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5">
                          <span className={`font-semibold capitalize ${colorClass}`}>{role}</span>
                          {role === orgRole && (
                            <span className="ml-2 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">you</span>
                          )}
                        </td>
                        {caps.map((allowed, i) => (
                          <td key={i} className="px-2 py-2.5 text-center">
                            {allowed
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                              : <XCircle className="w-4 h-4 text-gray-200 mx-auto" />
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[11px] text-gray-400 px-3 py-2 bg-gray-50 border-t border-gray-100">
                  ⚠ Viewer passes server-side requireOrgMember — add requireOrgWriter middleware to fully block AI routes for viewers.
                </p>
              </div>
            </div>

            {/* ── Security posture checklist ── */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-gray-500" /> Security Posture
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { ok: true,  text: 'Firebase ID token verified on every API route' },
                  { ok: true,  text: 'Org membership verified server-side (requireOrgMember)' },
                  { ok: true,  text: 'Firestore deny-by-default rules deployed to production' },
                  { ok: true,  text: 'ANTHROPIC_API_KEY stored in Secret Manager (not in code)' },
                  { ok: true,  text: 'CI/CD via Workload Identity Federation — no long-lived GCP key' },
                  { ok: true,  text: 'CORS defaults to same-origin deny in production (NODE_ENV=production)' },
                  { ok: true,  text: 'Email verification gate blocks unverified accounts' },
                  { ok: true,  text: 'Firebase Admin uses Application Default Credentials on Cloud Run' },
                  { ok: false, text: 'Rate limiting on AI routes — not yet implemented (recommended)' },
                  { ok: false, text: 'Viewer role blocked at route level — currently passes requireOrgMember' },
                ].map(({ ok, text }) => (
                  <div
                    key={text}
                    className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${
                      ok ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    {ok
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      : <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    }
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Confluence Integration */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold text-gray-900">Confluence Integration</h2>
              {confluenceConfig.baseUrl && confluenceConfig.apiToken && (
                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Configured
                </span>
              )}
            </div>
            <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Get API Token <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-sm text-gray-500 mb-5">
            Configure your Atlassian Confluence credentials to export threat model reports directly as Confluence pages.
            Credentials are stored only in your browser's local storage and never sent to our servers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Base URL */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Confluence Base URL
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-200">
                <Globe className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
                <input
                  type="url"
                  placeholder="https://yourorg.atlassian.net"
                  value={confluenceConfig.baseUrl || ''}
                  onChange={e => setConfluenceConfig(p => ({ ...p, baseUrl: e.target.value }))}
                  className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">e.g. https://acme.atlassian.net</p>
            </div>

            {/* Space Key */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Space Key
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-200">
                <Key className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="~MYSPACE"
                  value={confluenceConfig.spaceKey || ''}
                  onChange={e => setConfluenceConfig(p => ({ ...p, spaceKey: e.target.value }))}
                  className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent font-mono"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">The key shown in your Confluence space URL</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Atlassian Email
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-200">
                <Shield className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={confluenceConfig.email || ''}
                  onChange={e => setConfluenceConfig(p => ({ ...p, email: e.target.value }))}
                  className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent"
                />
              </div>
            </div>

            {/* API Token */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                API Token
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-200">
                <Lock className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
                <input
                  type={showConfluenceToken ? 'text' : 'password'}
                  placeholder="Your Atlassian API token"
                  value={confluenceConfig.apiToken || ''}
                  onChange={e => setConfluenceConfig(p => ({ ...p, apiToken: e.target.value }))}
                  className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent font-mono"
                />
                <button onClick={() => setShowConfluenceToken(v => !v)}
                  className="px-3 text-gray-400 hover:text-gray-600">
                  {showConfluenceToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={saveConfluenceConfig}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700 transition-colors"
            >
              {confluenceSaved
                ? <><CheckCircle2 className="w-4 h-4 text-green-400" /> Saved!</>
                : <><Save className="w-4 h-4" /> Save Configuration</>}
            </button>
            {confluenceConfig.apiToken && (
              <button onClick={clearConfluenceConfig}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" /> Clear
              </button>
            )}
            <p className="text-xs text-gray-400 ml-auto">
              Stored in browser localStorage only — never transmitted to Threat Modeler servers.
            </p>
          </div>
        </motion.div>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card lg:col-span-2"
        >
          <div className="flex items-center gap-2 mb-6">
            <Info className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-900">About ThreatModeler</h2>
          </div>

          <div className="prose prose-sm max-w-none text-gray-600">
            <p>
              ThreatModeler is a comprehensive threat modeling application designed to help security
              teams identify, analyze, and mitigate security threats in their systems and applications.
            </p>
            <h4 className="text-gray-900 mt-4">Key Features:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>STRIDE-based threat categorization</li>
              <li>Visual risk assessment matrix</li>
              <li>Control/mitigation tracking</li>
              <li>Data flow diagram visualization</li>
              <li>Project and asset management</li>
              <li>Export/import functionality</li>
            </ul>
            <h4 className="text-gray-900 mt-4">Methodology:</h4>
            <p>
              This tool implements the STRIDE threat modeling methodology, which categorizes threats
              into six categories: Spoofing, Tampering, Repudiation, Information Disclosure, Denial
              of Service, and Elevation of Privilege.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
