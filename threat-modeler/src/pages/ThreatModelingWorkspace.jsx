import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, FileText, LayoutTemplate, Brain, BarChart2,
  Play, CheckCircle2, AlertTriangle, ChevronRight, Info,
  Save, Sparkles, Loader2, RefreshCw,
} from 'lucide-react';
import { useThreatContext, STRIDE_CATEGORIES, RISK_LEVELS } from '../context/ThreatContext';
import ThreatModelCanvas from '../components/ThreatModelCanvas';
import AIThreatTable from '../components/AIThreatTable';
import { analyzeWithContext } from '../services/aiAnalysis';

// ─── Constants ────────────────────────────────────────────────────────────────
const ARCHITECTURE_TYPES = [
  'Web Application', 'REST API', 'GraphQL API', 'Mobile App',
  'Cloud Native (AWS/Azure/GCP)', 'On-Premises', 'Microservices',
  'IoT / OT / ICS', 'Database / Data Warehouse', 'SaaS Platform',
];

const SENSITIVE_DATA_TYPES = [
  'Personally Identifiable Information (PII)', 'Financial / Payment Data',
  'Healthcare / Medical Records', 'Intellectual Property',
  'Authentication Credentials', 'OT / ICS Operational Data',
  'Government / Classified Data', 'Legal / Contractual Data',
];

const NETWORK_EXPOSURE = [
  { value: 'internet',  label: 'Internet-facing', desc: 'Accessible by the public internet' },
  { value: 'internal',  label: 'Internal Only',   desc: 'Corporate network / VPN only' },
  { value: 'air-gapped',label: 'Air-gapped',       desc: 'No network connectivity to outside' },
  { value: 'hybrid',    label: 'Hybrid',           desc: 'Mix of internet and internal zones' },
];

const TABS = [
  { id: 'form',     label: 'System Info',   icon: FileText },
  { id: 'diagram',  label: 'Diagram',       icon: LayoutTemplate },
  { id: 'analysis', label: 'AI Analysis',   icon: Brain },
  { id: 'matrix',   label: 'Risk Matrix',   icon: BarChart2 },
];

const RISK_COLORS = {
  CRITICAL: '#991b1b', HIGH: '#c2410c', MEDIUM: '#f59e0b', LOW: '#84cc16', MINIMAL: '#22c55e',
};
const RISK_BG = {
  CRITICAL: '#fee2e2', HIGH: '#ffedd5', MEDIUM: '#fef3c7', LOW: '#ecfccb', MINIMAL: '#dcfce7',
};

// ─── Risk matrix cell colours (matches RiskMatrix.jsx page exactly) ────────────
function cellColor(l, i) {
  const s = l * i;
  if (s >= 20) return { bg: '#991b1b', text: '#fee2e2', level: 'Critical' };
  if (s >= 15) return { bg: '#c2410c', text: '#ffedd5', level: 'High' };
  if (s >= 10) return { bg: '#f59e0b', text: '#fef3c7', level: 'Medium' };
  if (s >= 5)  return { bg: '#84cc16', text: '#ecfccb', level: 'Low' };
  return { bg: '#22c55e', text: '#dcfce7', level: 'Minimal' };
}

// ─── Form section wrapper ─────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">{title}</h3>
      {children}
    </div>
  );
}

function Label({ text, required }) {
  return (
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {text}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

// ─── System Info form tab ─────────────────────────────────────────────────────
function SystemInfoForm({ formData, onChange, project }) {
  const set = (key, val) => onChange({ ...formData, [key]: val });
  const toggleArr = (key, val) => {
    const arr = formData[key] || [];
    set(key, arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-6">
      <Section title="System Overview">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label text="System Name" required />
            <input value={formData.systemName || ''} onChange={e => set('systemName', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Customer Portal v2" />
          </div>
          <div>
            <Label text="System Owner / Team" />
            <input value={formData.systemOwner || ''} onChange={e => set('systemOwner', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Platform Engineering" />
          </div>
        </div>
        <div className="mb-4">
          <Label text="System Description" required />
          <textarea value={formData.systemDescription || ''} onChange={e => set('systemDescription', e.target.value)}
            rows={3} placeholder="Describe what the system does, who uses it, and what data it processes…"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
        <div>
          <Label text="System Purpose & Business Context" />
          <textarea value={formData.systemPurpose || ''} onChange={e => set('systemPurpose', e.target.value)}
            rows={2} placeholder="Why does this system exist? What business process does it support?"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
      </Section>

      <Section title="Architecture & Technology">
        <div className="mb-4">
          <Label text="Architecture Types" />
          <div className="flex flex-wrap gap-2">
            {ARCHITECTURE_TYPES.map(t => {
              const active = (formData.architectureTypes || []).includes(t);
              return (
                <button key={t} type="button" onClick={() => toggleArr('architectureTypes', t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}>{t}</button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label text="Technology Stack" />
            <input value={formData.technologyStack || ''} onChange={e => set('technologyStack', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. React, Node.js, PostgreSQL, AWS ECS" />
          </div>
          <div>
            <Label text="Authentication Mechanism" />
            <input value={formData.authMechanism || ''} onChange={e => set('authMechanism', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. OAuth 2.0 + TOTP MFA, SAML SSO" />
          </div>
        </div>
      </Section>

      <Section title="Data & Exposure">
        <div className="mb-4">
          <Label text="Sensitive Data Types Processed" />
          <div className="flex flex-wrap gap-2">
            {SENSITIVE_DATA_TYPES.map(t => {
              const active = (formData.sensitiveData || []).includes(t);
              return (
                <button key={t} type="button" onClick={() => toggleArr('sensitiveData', t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    active ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'
                  }`}>{t}</button>
              );
            })}
          </div>
        </div>
        <div className="mb-4">
          <Label text="Network Exposure" />
          <div className="grid grid-cols-2 gap-3">
            {NETWORK_EXPOSURE.map(opt => (
              <label key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.networkExposure === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                <input type="radio" name="networkExposure" value={opt.value}
                  checked={formData.networkExposure === opt.value}
                  onChange={() => set('networkExposure', opt.value)} className="mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div>
          <Label text="External Dependencies / Third-Party Integrations" />
          <textarea value={formData.externalDependencies || ''} onChange={e => set('externalDependencies', e.target.value)}
            rows={2} placeholder="e.g. Stripe (payments), Okta (SSO), SendGrid (email), AWS S3 (storage)"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
      </Section>

      <Section title="Security Context">
        <div className="mb-4">
          <Label text="User Types / Actors" />
          <input value={formData.userTypes || ''} onChange={e => set('userTypes', e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Administrators, End Customers, Internal Staff, API Consumers" />
        </div>
        <div>
          <Label text="Key Security Concerns / Areas of Focus" />
          <textarea value={formData.additionalConcerns || ''} onChange={e => set('additionalConcerns', e.target.value)}
            rows={3} placeholder="What are you most worried about? Any known vulnerabilities, compliance requirements, or previous incidents?"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
      </Section>
    </div>
  );
}

// ─── Risk matrix heatmap — matches RiskMatrix.jsx page exactly ────────────────
function WorkspaceRiskMatrix({ threats, showResidual }) {
  const [selectedCell, setSelectedCell] = useState(null);
  const [hoveredCell, setHoveredCell]   = useState(null);

  const LIKELIHOOD_LABELS = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
  const IMPACT_LABELS     = ['Minimal', 'Low', 'Moderate', 'High', 'Critical'];

  const keyFn = (t) => showResidual && t.riskScore > 0
    ? `${Math.min(5, Math.max(1, Math.round(t.likelihood * Math.sqrt(t.residualRiskScore / t.riskScore))))}-${Math.min(5, Math.max(1, Math.round(t.impact * Math.sqrt(t.residualRiskScore / t.riskScore))))}`
    : `${t.likelihood}-${t.impact}`;

  const matrix = {};
  for (let l = 1; l <= 5; l++) for (let i = 1; i <= 5; i++) matrix[`${l}-${i}`] = [];
  threats.forEach(t => { const k = keyFn(t); if (matrix[k]) matrix[k].push(t); });

  const selectedThreats = selectedCell ? matrix[selectedCell] || [] : [];

  return (
    <div className="space-y-6">
      <div className="relative">
        {/* Y-axis label */}
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-medium text-gray-500 whitespace-nowrap">
          Impact
        </div>

        <div className="ml-16">
          {/* Column headers */}
          <div className="flex">
            <div className="w-20" />
            {LIKELIHOOD_LABELS.map((label, i) => (
              <div key={i} className="flex-1 text-center text-xs text-gray-500 pb-2">{label}</div>
            ))}
          </div>

          {/* Matrix rows */}
          {[5, 4, 3, 2, 1].map(impact => (
            <div key={impact} className="flex items-center">
              <div className="w-20 text-xs text-gray-500 pr-3 text-right">{IMPACT_LABELS[impact - 1]}</div>
              <div className="flex-1 flex gap-2">
                {[1, 2, 3, 4, 5].map(likelihood => {
                  const cellKey = `${likelihood}-${impact}`;
                  const cellThreats = matrix[cellKey] || [];
                  const c = cellColor(likelihood, impact);
                  const isSelected = selectedCell === cellKey;
                  const isHovered  = hoveredCell  === cellKey;

                  return (
                    <motion.div
                      key={cellKey}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedCell(isSelected ? null : cellKey)}
                      onMouseEnter={() => setHoveredCell(cellKey)}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`flex-1 aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all relative ${
                        isSelected ? 'ring-4 ring-blue-400 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: c.bg }}
                    >
                      <span className="text-2xl font-bold text-white">
                        {cellThreats.length || ''}
                      </span>
                      {cellThreats.length > 0 && (
                        <span className="text-xs text-white/80">
                          threat{cellThreats.length !== 1 ? 's' : ''}
                        </span>
                      )}

                      {/* Tooltip */}
                      <AnimatePresence>
                        {isHovered && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full mb-2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-10 shadow-lg pointer-events-none"
                          >
                            <div className="font-medium">{c.level} Risk</div>
                            <div className="text-gray-300">Score: {likelihood * impact} | L:{likelihood} × I:{impact}</div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
                              <div className="border-8 border-transparent border-t-gray-900" />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* X-axis label */}
          <div className="text-center text-sm font-medium text-gray-500 mt-4">Likelihood</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-100">
        {[
          { label: 'Critical', color: '#991b1b' },
          { label: 'High',     color: '#c2410c' },
          { label: 'Medium',   color: '#f59e0b' },
          { label: 'Low',      color: '#84cc16' },
          { label: 'Minimal',  color: '#22c55e' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
            <span className="text-sm text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Selected cell details */}
      {selectedCell && (() => {
        const [l, i] = selectedCell.split('-').map(Number);
        const c = cellColor(l, i);
        return (
          <div className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: c.bg }}>
                <span className="text-white font-bold text-sm">{l * i}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{c.level} Risk</p>
                <p className="text-xs text-gray-500">L:{l} ({LIKELIHOOD_LABELS[l-1]}) × I:{i} ({IMPACT_LABELS[i-1]})</p>
              </div>
            </div>
            {selectedThreats.length > 0 ? (
              <div className="space-y-2">
                {selectedThreats.map(t => (
                  <div key={t.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: STRIDE_CATEGORIES[t.strideCategory]?.color }}>
                        {t.strideCategory}
                      </span>
                      <span className="text-sm font-semibold text-gray-800">{t.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: RISK_BG[t.riskLevel], color: RISK_COLORS[t.riskLevel] }}>
                        {t.riskLevel}
                      </span>
                      <span className="text-xs text-gray-400">Score: {t.riskScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-3">No threats in this cell</p>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ─── Main workspace component ─────────────────────────────────────────────────
export default function ThreatModelingWorkspace() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { state, updateProject, importAIResults, addThreat } = useThreatContext();

  const project = state.projects.find(p => p.id === projectId);

  const [activeTab, setActiveTab]     = useState('form');
  const [formData, setFormData]       = useState({});
  const [diagramData, setDiagramData] = useState({ elements: [], connections: [] });
  const [analysisState, setAnalysisState] = useState({ status: 'idle', progress: null, error: null });
  const [threatRows, setThreatRows]   = useState([]);
  const [appliedIds, setAppliedIds]   = useState(new Set());
  const [showResidual, setShowResidual] = useState(false);
  const [saved, setSaved]             = useState(false);

  // Load saved workspace data from project
  useEffect(() => {
    if (project?.workspaceFormData) setFormData(project.workspaceFormData);
    if (project?.workspaceDiagramData) setDiagramData(project.workspaceDiagramData);
    if (project?.workspaceThreatRows) setThreatRows(project.workspaceThreatRows);
  }, [project?.id]); // eslint-disable-line

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Project not found.</p>
        <Link to="/projects" className="text-blue-600 text-sm mt-2 inline-block">← Back to Projects</Link>
      </div>
    );
  }

  // ── Persist to project ───────────────────────────────────────────────────
  const saveWorkspace = useCallback(() => {
    updateProject({ id: projectId, workspaceFormData: formData, workspaceDiagramData: diagramData, workspaceThreatRows: threatRows });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [projectId, formData, diagramData, threatRows, updateProject]);

  // ── Run AI analysis ──────────────────────────────────────────────────────
  const runAnalysis = async () => {
    setAnalysisState({ status: 'running', progress: null, error: null });
    setThreatRows([]);
    try {
      const result = await analyzeWithContext(
        { ...project, ...formData, name: formData.systemName || project.name, description: formData.systemDescription || project.description },
        formData,
        diagramData.elements || [],
        (prog) => setAnalysisState(prev => ({ ...prev, progress: prog }))
      );
      if (result.success) {
        setThreatRows(result.threatRows || []);
        updateProject({ id: projectId, workspaceThreatRows: result.threatRows });
        setAnalysisState({ status: 'complete', progress: null, error: null });
      } else {
        setAnalysisState({ status: 'error', progress: null, error: result.error });
      }
    } catch (err) {
      setAnalysisState({ status: 'error', progress: null, error: err.message });
    }
  };

  // ── Apply single threat to project ──────────────────────────────────────
  const handleApplyThreat = (threat) => {
    const { recommendations, rationale, residualRiskScore, residualRiskLevel, residualRationale, affectedComponents, ...threatData } = threat;
    addThreat({ ...threatData, projectId });
    setAppliedIds(prev => new Set([...prev, threat.id]));
  };

  // ── Apply all unapplied threats ──────────────────────────────────────────
  const handleApplyAll = (unapplied) => {
    unapplied.forEach(t => handleApplyThreat(t));
  };

  const isFormFilled = formData.systemName || formData.systemDescription;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
        <button onClick={() => navigate(`/projects/${projectId}`)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Link to="/projects" className="hover:text-gray-600">Projects</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to={`/projects/${projectId}`} className="hover:text-gray-600 truncate">{project.name}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-600 font-medium">Threat Modeling Workspace</span>
          </div>
          <h1 className="text-lg font-bold text-gray-900 mt-0.5 truncate">{formData.systemName || project.name}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={saveWorkspace}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              saved ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved' : 'Save'}
          </button>
          {activeTab === 'form' && (
            <button
              onClick={() => { setActiveTab('analysis'); if (isFormFilled) runAnalysis(); }}
              disabled={!isFormFilled}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-40 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Run AI Analysis
            </button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-white flex-shrink-0 px-2">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const badge = tab.id === 'analysis' && threatRows.length > 0 ? threatRows.length : null;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all relative ${
                isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {badge && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">{badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'form' && (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <SystemInfoForm formData={formData} onChange={setFormData} project={project} />
            </motion.div>
          )}

          {activeTab === 'diagram' && (
            <motion.div key="diagram" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col">
              <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-start gap-2 text-sm text-blue-700 flex-shrink-0">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Draw a Data Flow Diagram (DFD) of your system — or upload an existing diagram image. The AI Analysis will reference the components you define here.</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <ThreatModelCanvas
                  value={diagramData}
                  onChange={(data) => { setDiagramData(data); }}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'analysis' && (
            <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col">
              {analysisState.status === 'idle' && threatRows.length === 0 && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 p-8">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <Brain className="w-10 h-10 text-blue-600" />
                  </div>
                  <div className="text-center max-w-md">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">AI Threat Analysis</h2>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Fill in the System Info form and optionally draw a diagram, then run the AI analysis to get a detailed threat register with risk rationale, recommended controls, and residual risk estimates.
                    </p>
                  </div>
                  <button
                    onClick={runAnalysis}
                    disabled={!isFormFilled}
                    className="flex items-center gap-3 px-8 py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-40 transition-all shadow-lg shadow-blue-200"
                  >
                    <Sparkles className="w-5 h-5" />
                    {isFormFilled ? 'Run AI Analysis' : 'Fill System Info first'}
                  </button>
                </div>
              )}

              {analysisState.status === 'running' && (
                <div className="flex flex-col items-center justify-center flex-1 gap-6 p-8">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <Brain className="w-10 h-10 text-blue-600" />
                    </div>
                    <Loader2 className="absolute -bottom-1 -right-1 w-6 h-6 text-blue-600 animate-spin" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-lg font-bold text-gray-800 mb-1">Analysing threats…</h2>
                    <p className="text-sm text-gray-500">{analysisState.progress?.message || 'Processing system characteristics…'}</p>
                  </div>
                  {analysisState.progress && (
                    <div className="w-72">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                          animate={{ width: `${(analysisState.progress.step / analysisState.progress.total) * 100}%` }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 text-center mt-2">
                        Step {analysisState.progress.step} of {analysisState.progress.total}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {analysisState.status === 'error' && (
                <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8">
                  <AlertTriangle className="w-12 h-12 text-red-500" />
                  <p className="text-red-600 font-medium">Analysis failed: {analysisState.error}</p>
                  <button onClick={runAnalysis}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors text-sm font-medium">
                    <RefreshCw className="w-4 h-4" /> Retry
                  </button>
                </div>
              )}

              {(analysisState.status === 'complete' || threatRows.length > 0) && analysisState.status !== 'running' && (
                <div className="flex flex-col h-full">
                  {/* Summary bar */}
                  <div className="flex items-center gap-4 px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100 flex-shrink-0 flex-wrap">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-gray-700">
                        Analysis complete — {threatRows.length} threats identified
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      {['CRITICAL','HIGH','MEDIUM','LOW'].map(level => {
                        const cnt = threatRows.filter(t => t.riskLevel === level).length;
                        return cnt > 0 ? (
                          <span key={level} className="px-2 py-0.5 rounded-full font-bold"
                            style={{ background: RISK_BG[level], color: RISK_COLORS[level] }}>
                            {cnt} {level}
                          </span>
                        ) : null;
                      })}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <button onClick={() => { setAnalysisState({ status: 'idle', progress: null, error: null }); runAnalysis(); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all">
                        <RefreshCw className="w-3.5 h-3.5" /> Re-run
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <AIThreatTable
                      threats={threatRows}
                      appliedIds={appliedIds}
                      onApplyThreat={handleApplyThreat}
                      onApplyAll={handleApplyAll}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'matrix' && (
            <motion.div key="matrix" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Risk Matrix</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {threatRows.length > 0
                        ? `${threatRows.length} threats from AI analysis plotted by likelihood × impact`
                        : 'Run AI Analysis first to populate the risk matrix'}
                    </p>
                  </div>
                  {threatRows.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Show:</span>
                      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <button onClick={() => setShowResidual(false)}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${!showResidual ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>
                          Inherent Risk
                        </button>
                        <button onClick={() => setShowResidual(true)}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${showResidual ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>
                          Residual Risk
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {threatRows.length > 0 ? (
                  <>
                    <WorkspaceRiskMatrix threats={threatRows} showResidual={showResidual} />

                    {/* Legend */}
                    <div className="mt-8 flex items-center gap-4 flex-wrap">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Risk Level</span>
                      {[['CRITICAL','≥20'],['HIGH','15–19'],['MEDIUM','10–14'],['LOW','5–9'],['MINIMAL','<5']].map(([level, range]) => (
                        <div key={level} className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm" style={{ background: RISK_COLORS[level] }} />
                          <span className="text-xs text-gray-600">{level} ({range})</span>
                        </div>
                      ))}
                    </div>

                    {/* Summary table */}
                    <div className="mt-8 grid grid-cols-3 gap-4">
                      {['CRITICAL','HIGH','MEDIUM','LOW','MINIMAL'].map(level => {
                        const count = threatRows.filter(t =>
                          showResidual ? t.residualRiskLevel === level : t.riskLevel === level
                        ).length;
                        return count > 0 ? (
                          <div key={level} className="p-4 rounded-2xl border"
                            style={{ background: RISK_BG[level], borderColor: RISK_COLORS[level] + '40' }}>
                            <div className="text-2xl font-black mb-0.5" style={{ color: RISK_COLORS[level] }}>{count}</div>
                            <div className="text-xs font-bold" style={{ color: RISK_COLORS[level] }}>{level}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {showResidual ? 'after controls' : 'inherent risk'}
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <BarChart2 className="w-12 h-12 text-gray-200" />
                    <p className="text-gray-400 text-sm">No analysis results yet. Run the AI Analysis to populate the risk matrix.</p>
                    <button onClick={() => setActiveTab('analysis')}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors">
                      <Brain className="w-4 h-4" /> Go to AI Analysis
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
