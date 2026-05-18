import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plug, CheckCircle2, Clock, X, Loader2, Eye, EyeOff, AlertTriangle, Webhook } from 'lucide-react';
import { useInsurance } from '../../context/InsuranceContext';

const INTEGRATIONS = [
  {
    key: 'entra', name: 'Microsoft Entra ID', vendor: 'Microsoft', category: 'Identity & IAM',
    iconBg: 'bg-blue-100', iconColor: 'text-blue-600', logo: '🔵',
    description: 'Sync MFA registration, Conditional Access policies, privileged roles, and risky user signals.',
    dataPulled: ['MFA registration rate', 'Conditional Access policies', 'Privileged role assignments', 'Risky sign-ins', 'Secure Score'],
    fields: [
      { key: 'tenantId',     label: 'Tenant ID',     type: 'text',     placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
      { key: 'clientId',     label: 'Client ID',     type: 'text',     placeholder: 'App registration client ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'App registration secret' },
    ],
  },
  {
    key: 'defender', name: 'Microsoft Defender for Endpoint', vendor: 'Microsoft', category: 'EDR',
    iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600', logo: '🛡',
    description: 'Pull EDR coverage, threat detections, vulnerability exposure, and device health metrics.',
    dataPulled: ['Device coverage %', 'Threat detections', 'Vulnerability exposure score', 'High-risk devices', 'Missing patches'],
    fields: [
      { key: 'tenantId',     label: 'Tenant ID',     type: 'text',     placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
      { key: 'clientId',     label: 'Client ID',     type: 'text',     placeholder: 'App registration client ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'App registration secret' },
    ],
  },
  {
    key: 'crowdstrike', name: 'CrowdStrike Falcon', vendor: 'CrowdStrike', category: 'EDR',
    iconBg: 'bg-red-100', iconColor: 'text-red-600', logo: '🦅',
    description: 'Retrieve sensor health, device posture, threat intelligence, and detection summaries.',
    dataPulled: ['Sensor integrity %', 'Device health score', 'Detections (30d)', 'Threat intelligence feeds', 'RTR sessions'],
    fields: [
      { key: 'clientId',    label: 'Client ID',     type: 'text',     placeholder: 'Falcon API client ID' },
      { key: 'clientSecret',label: 'Client Secret', type: 'password', placeholder: 'Falcon API client secret' },
      { key: 'cloudRegion', label: 'Cloud Region',  type: 'text',     placeholder: 'us-1, us-2, eu-1, ap-1' },
    ],
  },
  {
    key: 'tenable', name: 'Tenable Vulnerability Management', vendor: 'Tenable', category: 'Vulnerability Mgmt',
    iconBg: 'bg-green-100', iconColor: 'text-green-600', logo: '🔍',
    description: 'Import asset inventory, vulnerability counts, CVSS scores, and patch compliance data.',
    dataPulled: ['Assets scanned', 'Critical/High CVEs', 'Patch compliance %', 'Mean time to remediate', 'Exposure score'],
    fields: [
      { key: 'accessKey', label: 'Access Key', type: 'text',     placeholder: 'Tenable.io access key' },
      { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'Tenable.io secret key' },
    ],
  },
  {
    key: 'splunk', name: 'Splunk SIEM', vendor: 'Splunk', category: 'SIEM',
    iconBg: 'bg-purple-100', iconColor: 'text-purple-600', logo: '📊',
    description: 'Connect Splunk for log ingestion metrics, alert volumes, and detection coverage.',
    dataPulled: ['Events per day', 'Alert fidelity', 'Data sources connected', 'Mean time to detect'],
    fields: [
      { key: 'host',  label: 'Splunk Host', type: 'text',     placeholder: 'https://splunk.yourcompany.com:8089' },
      { key: 'token', label: 'API Token',   type: 'password', placeholder: 'Splunk REST API token' },
    ],
    comingSoon: true,
  },
  {
    key: 'okta', name: 'Okta Identity', vendor: 'Okta', category: 'Identity & IAM',
    iconBg: 'bg-orange-100', iconColor: 'text-orange-600', logo: '🔐',
    description: 'Pull MFA enrollment, SSO app coverage, and policy compliance from Okta.',
    dataPulled: ['MFA enrollment', 'SSO applications', 'Policy compliance', 'Suspicious logins'],
    fields: [
      { key: 'domain', label: 'Okta Domain', type: 'text',     placeholder: 'yourorg.okta.com' },
      { key: 'apiKey',  label: 'API Key',     type: 'password', placeholder: 'Okta SSWS token' },
    ],
    comingSoon: true,
  },
];

function IntegrationCard({ integration, connected, onConnect }) {
  const [expanded,    setExpanded]    = useState(false);
  const [creds,       setCreds]       = useState({});
  const [showSecrets, setShowSecrets] = useState({});
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  const handleConnect = async () => {
    setLoading(true); setError(null);
    await new Promise(r => setTimeout(r, 1500));
    if (!integration.fields.every(f => creds[f.key]?.trim())) {
      setError('All fields are required.'); setLoading(false); return;
    }
    onConnect(integration.key, true); setLoading(false); setExpanded(false);
  };

  return (
    <motion.div layout className="card overflow-hidden"
      style={{ borderColor: connected ? '#bbf7d0' : undefined }}>
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${integration.iconBg}`}>
          {integration.logo}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-900">{integration.name}</p>
            {integration.comingSoon && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">Coming Soon</span>
            )}
            {connected && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                <CheckCircle2 className="w-2.5 h-2.5" /> Connected
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{integration.vendor} · {integration.category}</p>
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">{integration.description}</p>
        </div>
        {!integration.comingSoon && (
          <button onClick={() => !connected && setExpanded(v => !v)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              connected
                ? 'bg-green-100 text-green-700'
                : `${integration.iconBg} ${integration.iconColor} hover:opacity-80`
            }`}>
            {connected ? 'Connected' : 'Connect'}
          </button>
        )}
        {integration.comingSoon && (
          <button disabled className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-400 cursor-not-allowed">
            <Clock className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Data tags */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {integration.dataPulled.map(d => (
          <span key={d} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-500">{d}</span>
        ))}
      </div>

      {/* Credential form */}
      <AnimatePresence>
        {expanded && !connected && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <p className="text-xs text-gray-400">🔒 Credentials stored in browser only.</p>
              {integration.fields.map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">{f.label}</label>
                  <div className="relative">
                    <input type={f.type === 'password' && !showSecrets[f.key] ? 'password' : 'text'}
                      placeholder={f.placeholder} value={creds[f.key] || ''}
                      onChange={e => setCreds(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full rounded-xl px-3 py-2.5 text-sm text-gray-700 border border-gray-200 bg-gray-50 focus:outline-none focus:border-amber-300 pr-10" />
                    {f.type === 'password' && (
                      <button onClick={() => setShowSecrets(p => ({ ...p, [f.key]: !p[f.key] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showSecrets[f.key] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {error && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-100">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-red-500" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={handleConnect} disabled={loading}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${integration.iconBg} ${integration.iconColor} hover:opacity-80`}>
                  {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting…</> : 'Connect'}
                </button>
                <button onClick={() => { setExpanded(false); setError(null); setCreds({}); }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Integrations() {
  const { state, setIntegration } = useInsurance();
  const connectedCount = Object.values(state.integrationStatus).filter(Boolean).length;

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-xs font-bold tracking-widest uppercase text-amber-600 mb-1">Cyber Insurance & Accountability</p>
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-500 mt-1">Connect your security tools for live data sync. Credentials stored in-browser only.</p>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Available',   value: INTEGRATIONS.filter(i => !i.comingSoon).length, className: 'text-blue-600' },
          { label: 'Connected',   value: connectedCount,                                  className: 'text-green-600' },
          { label: 'Coming Soon', value: INTEGRATIONS.filter(i => i.comingSoon).length,  className: 'text-gray-400' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <p className={`text-2xl font-bold ${s.className}`}>{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Integration cards */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} className="space-y-4">
        {INTEGRATIONS.map(integration => (
          <IntegrationCard key={integration.key} integration={integration}
            connected={state.integrationStatus[integration.key] || false}
            onConnect={setIntegration} />
        ))}

        {/* Make.com webhook */}
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-xl flex-shrink-0">
              <Webhook className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Make.com Automation</p>
              <p className="text-xs text-gray-400 mt-0.5">Webhook · Automation</p>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                Trigger Make.com scenarios when risk scores change or new policy requirements are identified.
                Use Bearer token authorization via <code className="text-orange-500 font-mono text-[10px] bg-orange-50 px-1 rounded">/api/insurance/webhook</code>.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <input readOnly value="https://your-domain.com/api/insurance/webhook"
                  className="flex-1 rounded-lg px-3 py-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 font-mono cursor-default" />
                <button onClick={() => navigator.clipboard.writeText('https://your-domain.com/api/insurance/webhook')}
                  className="px-3 py-2 rounded-lg text-xs font-bold bg-orange-100 text-orange-600 hover:bg-orange-200 transition-all">
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
