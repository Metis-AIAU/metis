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
} from 'lucide-react';
import { useThreatContext } from '../context/ThreatContext';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';

export default function Settings() {
  const { state, resetToSampleData } = useThreatContext();
  const { user, isAuthenticated } = useAuth();
  const { isTeamOwner, isTeamAdmin, team } = useTeam();
  const [exportStatus, setExportStatus] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [showSecrets, setShowSecrets] = useState(false);

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

  const isAdmin = isTeamOwner || isTeamAdmin || !team;

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

        {/* Firebase & Firestore Configuration */}
        {isAuthenticated && (
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
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>
                    Firestore Path: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
                      users/{user?.id ? user.id.slice(0, 8) + '...' : '—'}/data/threatData
                    </code>
                  </span>
                  {team && (
                    <span>
                      Team Doc: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
                        teams/{team.id.slice(0, 8)}...
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
            <h2 className="font-semibold text-gray-900">About Metis</h2>
          </div>

          <div className="prose prose-sm max-w-none text-gray-600">
            <p>
              Metis is a comprehensive threat modeling application designed to help security
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
