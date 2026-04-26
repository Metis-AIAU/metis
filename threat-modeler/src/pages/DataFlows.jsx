import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Network, Database, Server, User, Cloud, Globe,
  Lock, Unlock, Edit2, Trash2, X, ArrowRight, Shield, AlertTriangle,
  BookOpen, CheckCircle, Zap,
} from 'lucide-react';
import { useThreatContext } from '../context/ThreatContext';
import { useOrg } from '../context/OrgContext';

// ── Constants ──────────────────────────────────────────────────────────────

const DATA_CLASSIFICATIONS = {
  PUBLIC:       { label: 'Public',       color: '#22c55e', description: 'Open information' },
  INTERNAL:     { label: 'Internal',     color: '#3b82f6', description: 'Business use only' },
  CONFIDENTIAL: { label: 'Confidential', color: '#f59e0b', description: 'Sensitive data' },
  RESTRICTED:   { label: 'Restricted',   color: '#ef4444', description: 'Highly sensitive' },
};

const ASSET_TYPES = {
  DATA_STORE:       { label: 'Data Store',      icon: Database, color: '#8b5cf6' },
  SERVICE:          { label: 'Service',          icon: Server,   color: '#3b82f6' },
  EXTERNAL_SERVICE: { label: 'External Service', icon: Cloud,    color: '#f59e0b' },
  APPLICATION:      { label: 'Application',      icon: Globe,    color: '#22c55e' },
  USER:             { label: 'User/Actor',        icon: User,     color: '#ec4899' },
};

const PROTOCOLS = [
  'HTTPS', 'HTTP', 'gRPC', 'WebSocket', 'TCP/IP', 'UDP',
  'MQTT', 'AMQP', 'OPC-UA', 'Modbus/TCP', 'DNP3',
  'PostgreSQL/TLS', 'MySQL/TLS', 'Redis/TLS', 'Custom',
];

const STRIDE_BADGE = {
  S: { label: 'Spoofing',    bg: '#ede9fe', text: '#7c3aed' },
  T: { label: 'Tampering',   bg: '#fef3c7', text: '#d97706' },
  R: { label: 'Repudiation', bg: '#e0e7ff', text: '#4338ca' },
  I: { label: 'Info Disc.',  bg: '#fee2e2', text: '#dc2626' },
  D: { label: 'DoS',         bg: '#fce7f3', text: '#db2777' },
  E: { label: 'EoP',         bg: '#ccfbf1', text: '#0d9488' },
};

const BUILT_IN_PATTERNS = [
  {
    id: 'bi-scada-historian',
    name: 'SCADA → Historian',
    category: 'OT/ICS',
    description: 'OPC-UA data collection from SCADA to process historian',
    protocol: 'OPC-UA',
    dataClassification: 'CONFIDENTIAL',
    strideRisks: ['T', 'I', 'D'],
    requiredControls: 'OPC-UA certificate auth, Network segmentation, Data validation, Audit logging',
    securityNotes: 'High-value target for manipulation. Verify OPC-UA signed mode. Restrict historian write access.',
    isBuiltIn: true,
  },
  {
    id: 'bi-hmi-plc',
    name: 'HMI → PLC',
    category: 'OT/ICS',
    description: 'Operator HMI sending control commands to PLC via Modbus',
    protocol: 'Modbus/TCP',
    dataClassification: 'RESTRICTED',
    strideRisks: ['S', 'T', 'E'],
    requiredControls: 'Operator authentication, Command whitelist, Network firewall, Change management',
    securityNotes: 'Modbus has no native auth. Enforce at network layer. Log all write commands.',
    isBuiltIn: true,
  },
  {
    id: 'bi-corp-ot-dmz',
    name: 'Corporate → OT DMZ',
    category: 'OT/ICS',
    description: 'Business network access crossing into OT DMZ via bastion host',
    protocol: 'HTTPS',
    dataClassification: 'CONFIDENTIAL',
    strideRisks: ['S', 'T', 'E'],
    requiredControls: 'Dual-homed firewall, Jump server/bastion, MFA, Session recording',
    securityNotes: 'Must enforce strict ingress controls. No direct OT access from corporate.',
    isBuiltIn: true,
  },
  {
    id: 'bi-iot-gateway',
    name: 'IoT Sensor → Gateway',
    category: 'OT/ICS',
    description: 'Field device telemetry to edge gateway over MQTT',
    protocol: 'MQTT',
    dataClassification: 'INTERNAL',
    strideRisks: ['S', 'T', 'D'],
    requiredControls: 'MQTT TLS, Device certificate auth, Topic ACLs, Rate limiting',
    securityNotes: 'Validate device identity with X.509 certs. Use QoS 1+ for critical telemetry.',
    isBuiltIn: true,
  },
  {
    id: 'bi-ext-webapp',
    name: 'External User → Web App',
    category: 'Enterprise',
    description: 'Public internet user accessing web application',
    protocol: 'HTTPS',
    dataClassification: 'PUBLIC',
    strideRisks: ['S', 'T', 'D'],
    requiredControls: 'WAF, Rate limiting, CSRF protection, MFA for sensitive ops',
    securityNotes: 'Validate all input. Enforce HTTPS redirect. Set security headers.',
    isBuiltIn: true,
  },
  {
    id: 'bi-svc-svc-mtls',
    name: 'Service → Service (mTLS)',
    category: 'Enterprise',
    description: 'Internal microservice-to-microservice call with mutual TLS',
    protocol: 'gRPC',
    dataClassification: 'INTERNAL',
    strideRisks: ['S', 'T'],
    requiredControls: 'mTLS, Service mesh policy, Request signing, Circuit breaker',
    securityNotes: 'Rotate service certs automatically. Enforce zero-trust between services.',
    isBuiltIn: true,
  },
  {
    id: 'bi-app-db',
    name: 'Application → Database',
    category: 'Enterprise',
    description: 'App reading/writing to relational database over TLS',
    protocol: 'PostgreSQL/TLS',
    dataClassification: 'CONFIDENTIAL',
    strideRisks: ['T', 'I', 'E'],
    requiredControls: 'Parameterised queries, Least-privilege DB user, Encryption at rest, Connection pool limit',
    securityNotes: 'Use parameterised queries only. Avoid ORM raw queries. Audit sensitive table access.',
    isBuiltIn: true,
  },
  {
    id: 'bi-client-api-jwt',
    name: 'Client → API (JWT)',
    category: 'Enterprise',
    description: 'Authenticated API call with JWT Bearer token',
    protocol: 'HTTPS',
    dataClassification: 'INTERNAL',
    strideRisks: ['S', 'R'],
    requiredControls: 'JWT validation, Short token expiry, Refresh token rotation, Scope enforcement',
    securityNotes: 'Verify iss, aud, exp claims. Use asymmetric signing (RS256/ES256).',
    isBuiltIn: true,
  },
  {
    id: 'bi-api-queue',
    name: 'API → Message Queue',
    category: 'Enterprise',
    description: 'Async message passing from API to backend via AMQP',
    protocol: 'AMQP',
    dataClassification: 'INTERNAL',
    strideRisks: ['T', 'D', 'R'],
    requiredControls: 'Message signing, AMQP TLS, Dead-letter queue, Consumer auth',
    securityNotes: 'Sign message payloads. Monitor queue depth for DoS indicators.',
    isBuiltIn: true,
  },
];

const EMPTY_FLOW_FORM = {
  name: '', projectId: '', source: '', destination: '',
  protocol: 'HTTPS', dataClassification: 'INTERNAL', description: '',
  patternId: '', strideRisks: [], requiredControls: '', securityNotes: '',
};

const EMPTY_PATTERN_FORM = {
  name: '', description: '', category: 'Custom',
  protocol: 'HTTPS', dataClassification: 'INTERNAL',
  strideRisks: [], requiredControls: '', securityNotes: '',
};

const PATTERN_CATEGORIES = ['all', 'OT/ICS', 'Enterprise', 'Custom'];

// ── Component ──────────────────────────────────────────────────────────────

export default function DataFlows() {
  const {
    state, addDataFlow, updateDataFlow, deleteDataFlow,
    addAsset, updateAsset, deleteAsset,
    addFlowPattern, updateFlowPattern, deleteFlowPattern,
  } = useThreatContext();
  const { canWrite } = useOrg();

  const [activeTab, setActiveTab]           = useState('diagram');
  const [filterProject, setFilterProject]   = useState('');
  const [searchQuery, setSearchQuery]       = useState('');
  const [patternCategory, setPatternCategory] = useState('all');

  const [showFlowModal, setShowFlowModal]       = useState(false);
  const [showAssetModal, setShowAssetModal]     = useState(false);
  const [showPatternModal, setShowPatternModal] = useState(false);

  const [editingFlow, setEditingFlow]       = useState(null);
  const [editingAsset, setEditingAsset]     = useState(null);
  const [editingPattern, setEditingPattern] = useState(null);
  const [selectedFlow, setSelectedFlow]     = useState(null);

  const [flowForm, setFlowForm]       = useState(EMPTY_FLOW_FORM);
  const [assetForm, setAssetForm]     = useState({ name: '', projectId: '', type: 'SERVICE', description: '', sensitivity: 'MEDIUM', owner: '' });
  const [patternForm, setPatternForm] = useState(EMPTY_PATTERN_FORM);

  // ── Derived data ──────────────────────────────────────────────────────

  const allPatterns = useMemo(() => [
    ...BUILT_IN_PATTERNS,
    ...(state.flowPatterns || []),
  ], [state.flowPatterns]);

  const filteredPatterns = useMemo(() => {
    if (patternCategory === 'all') return allPatterns;
    if (patternCategory === 'Custom') return allPatterns.filter(p => !p.isBuiltIn);
    return allPatterns.filter(p => p.category === patternCategory);
  }, [allPatterns, patternCategory]);

  const filteredFlows = useMemo(() => state.dataFlows.filter(flow => {
    const matchesProject = !filterProject || flow.projectId === filterProject;
    const matchesSearch =
      flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flow.source?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flow.destination?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProject && matchesSearch;
  }), [state.dataFlows, filterProject, searchQuery]);

  const filteredAssets = useMemo(() => state.assets.filter(asset => {
    const matchesProject = !filterProject || asset.projectId === filterProject;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProject && matchesSearch;
  }), [state.assets, filterProject, searchQuery]);

  const diagramNodes = useMemo(() => {
    const nodes = new Map();
    filteredFlows.forEach(flow => {
      if (!nodes.has(flow.source)) nodes.set(flow.source, { id: flow.source, name: flow.source, connections: [] });
      if (!nodes.has(flow.destination)) nodes.set(flow.destination, { id: flow.destination, name: flow.destination, connections: [] });
      nodes.get(flow.source).connections.push({ target: flow.destination, flow });
    });
    return Array.from(nodes.values());
  }, [filteredFlows]);

  // ── Handlers ──────────────────────────────────────────────────────────

  function applyPattern(pattern) {
    setFlowForm(prev => ({
      ...prev,
      protocol: pattern.protocol,
      dataClassification: pattern.dataClassification,
      patternId: pattern.id,
      strideRisks: pattern.strideRisks || [],
      requiredControls: pattern.requiredControls || '',
      securityNotes: pattern.securityNotes || '',
    }));
  }

  function toggleStrideRisk(letter, target) {
    const setter = target === 'flow' ? setFlowForm : setPatternForm;
    setter(prev => ({
      ...prev,
      strideRisks: prev.strideRisks.includes(letter)
        ? prev.strideRisks.filter(r => r !== letter)
        : [...prev.strideRisks, letter],
    }));
  }

  function handleFlowSubmit(e) {
    e.preventDefault();
    if (editingFlow) {
      updateDataFlow({ ...flowForm, id: editingFlow.id });
    } else {
      addDataFlow(flowForm);
    }
    setShowFlowModal(false);
    setEditingFlow(null);
    setFlowForm(EMPTY_FLOW_FORM);
  }

  function handleAssetSubmit(e) {
    e.preventDefault();
    if (editingAsset) {
      updateAsset({ ...assetForm, id: editingAsset.id });
    } else {
      addAsset(assetForm);
    }
    setShowAssetModal(false);
    setEditingAsset(null);
    setAssetForm({ name: '', projectId: '', type: 'SERVICE', description: '', sensitivity: 'MEDIUM', owner: '' });
  }

  function handlePatternSubmit(e) {
    e.preventDefault();
    if (editingPattern) {
      updateFlowPattern({ ...patternForm, id: editingPattern.id });
    } else {
      addFlowPattern(patternForm);
    }
    setShowPatternModal(false);
    setEditingPattern(null);
    setPatternForm(EMPTY_PATTERN_FORM);
  }

  function handleEditFlow(flow) {
    setEditingFlow(flow);
    setFlowForm({
      name: flow.name, projectId: flow.projectId,
      source: flow.source, destination: flow.destination,
      protocol: flow.protocol, dataClassification: flow.dataClassification,
      description: flow.description || '',
      patternId: flow.patternId || '',
      strideRisks: flow.strideRisks || [],
      requiredControls: flow.requiredControls || '',
      securityNotes: flow.securityNotes || '',
    });
    setShowFlowModal(true);
  }

  function handleEditAsset(asset) {
    setEditingAsset(asset);
    setAssetForm({
      name: asset.name, projectId: asset.projectId, type: asset.type,
      description: asset.description || '', sensitivity: asset.sensitivity || 'MEDIUM', owner: asset.owner || '',
    });
    setShowAssetModal(true);
  }

  function handleEditPattern(pattern) {
    setEditingPattern(pattern);
    setPatternForm({
      name: pattern.name, description: pattern.description || '',
      category: pattern.category || 'Custom',
      protocol: pattern.protocol, dataClassification: pattern.dataClassification,
      strideRisks: pattern.strideRisks || [],
      requiredControls: pattern.requiredControls || '',
      securityNotes: pattern.securityNotes || '',
    });
    setShowPatternModal(true);
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Flow Diagram</h1>
          <p className="text-gray-500 mt-1">Visualize data flows and security patterns between components</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
            className="input w-auto"
          >
            <option value="">All Projects</option>
            {state.projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setEditingFlow(null);
              setFlowForm({ ...EMPTY_FLOW_FORM, projectId: filterProject || '' });
              setShowFlowModal(true);
            }}
            className="btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Data Flow
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 mb-6"
      >
        {[
          { id: 'diagram',  label: 'Diagram View',  icon: Network   },
          { id: 'flows',    label: 'Data Flows',     icon: ArrowRight },
          { id: 'assets',   label: 'Assets',         icon: Database  },
          { id: 'patterns', label: 'Flow Patterns',  icon: BookOpen  },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.id === 'patterns' && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'patterns' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {allPatterns.length}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* ── Diagram View ─────────────────────────────────────────────────── */}
      {activeTab === 'diagram' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card min-h-[600px]">
          {diagramNodes.length > 0 ? (
            <div className="relative">
              <div className="absolute top-0 right-0 bg-white rounded-lg border border-gray-100 p-4 shadow-sm z-10">
                <p className="text-sm font-medium text-gray-700 mb-2">Data Classification</p>
                <div className="space-y-1">
                  {Object.entries(DATA_CLASSIFICATIONS).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: value.color }} />
                      <span className="text-xs text-gray-600">{value.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <svg viewBox="0 0 800 500" className="w-full h-auto" style={{ minHeight: '500px' }}>
                  <defs>
                    {Object.entries(DATA_CLASSIFICATIONS).map(([key, value]) => (
                      <marker key={key} id={`arrow-${key}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill={value.color} />
                      </marker>
                    ))}
                  </defs>

                  {filteredFlows.map(flow => {
                    const sourceIndex = diagramNodes.findIndex(n => n.name === flow.source);
                    const destIndex   = diagramNodes.findIndex(n => n.name === flow.destination);
                    const cols = Math.ceil(Math.sqrt(diagramNodes.length));
                    const sx = 100 + (sourceIndex % cols) * 180;
                    const sy = 80  + Math.floor(sourceIndex / cols) * 120;
                    const dx = 100 + (destIndex   % cols) * 180;
                    const dy = 80  + Math.floor(destIndex   / cols) * 120;
                    const midX = (sx + dx) / 2;
                    const midY = (sy + dy) / 2;
                    const classColor = DATA_CLASSIFICATIONS[flow.dataClassification]?.color || '#6b7280';
                    const isSelected = selectedFlow?.id === flow.id;
                    return (
                      <g key={flow.id}>
                        <path
                          d={`M ${sx + 60} ${sy + 25} Q ${midX} ${midY - 30} ${dx + 60} ${dy + 25}`}
                          fill="none"
                          stroke={classColor}
                          strokeWidth={isSelected ? 3 : 2}
                          strokeOpacity={isSelected ? 1 : 0.6}
                          markerEnd={`url(#arrow-${flow.dataClassification})`}
                          className="cursor-pointer transition-all"
                          onClick={() => setSelectedFlow(flow)}
                        />
                        <text x={midX} y={midY - 38} textAnchor="middle" className="text-xs fill-gray-500 pointer-events-none">
                          {flow.protocol}
                        </text>
                      </g>
                    );
                  })}

                  {diagramNodes.map((node, index) => {
                    const cols = Math.ceil(Math.sqrt(diagramNodes.length));
                    const x = 100 + (index % cols) * 180;
                    const y = 80  + Math.floor(index / cols) * 120;
                    return (
                      <g key={node.id}>
                        <rect x={x} y={y} width="120" height="50" rx="8" fill="white" stroke="#e5e7eb" strokeWidth="2" />
                        <text x={x + 60} y={y + 30} textAnchor="middle" className="text-sm fill-gray-700 font-medium">
                          {node.name.length > 14 ? node.name.substring(0, 14) + '…' : node.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <AnimatePresence>
                {selectedFlow && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-4 left-4 right-4 bg-white rounded-xl border border-gray-200 shadow-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h4 className="font-semibold text-gray-900">{selectedFlow.name}</h4>
                          <span className="badge" style={{ backgroundColor: DATA_CLASSIFICATIONS[selectedFlow.dataClassification]?.color + '20', color: DATA_CLASSIFICATIONS[selectedFlow.dataClassification]?.color }}>
                            {DATA_CLASSIFICATIONS[selectedFlow.dataClassification]?.label}
                          </span>
                          {selectedFlow.strideRisks?.map(r => (
                            <span key={r} className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: STRIDE_BADGE[r]?.bg, color: STRIDE_BADGE[r]?.text }}>
                              {r}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium">{selectedFlow.source}</span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{selectedFlow.destination}</span>
                          <span className="text-gray-400">via</span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">{selectedFlow.protocol}</span>
                        </div>
                        {selectedFlow.securityNotes && (
                          <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-2">{selectedFlow.securityNotes}</p>
                        )}
                        {selectedFlow.requiredControls && (
                          <p className="text-xs text-gray-500 mt-1">Controls: {selectedFlow.requiredControls}</p>
                        )}
                      </div>
                      <button onClick={() => setSelectedFlow(null)} className="p-1 hover:bg-gray-100 rounded ml-2">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[500px]">
              <Network className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No data flows yet</h3>
              <p className="text-gray-500 mb-4">Create data flows to visualize your system architecture</p>
              <button onClick={() => setShowFlowModal(true)} className="btn-primary">
                <Plus className="w-5 h-5 mr-2" /> Add Data Flow
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Data Flows List ────────────────────────────────────────────── */}
      {activeTab === 'flows' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search data flows…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input pl-10" />
          </div>

          {filteredFlows.length > 0 ? filteredFlows.map((flow, index) => (
            <motion.div key={flow.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="card-hover">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: DATA_CLASSIFICATIONS[flow.dataClassification]?.color + '20' }}>
                    {flow.dataClassification === 'RESTRICTED' || flow.dataClassification === 'CONFIDENTIAL'
                      ? <Lock  className="w-6 h-6" style={{ color: DATA_CLASSIFICATIONS[flow.dataClassification]?.color }} />
                      : <Unlock className="w-6 h-6" style={{ color: DATA_CLASSIFICATIONS[flow.dataClassification]?.color }} />
                    }
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{flow.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <span>{flow.source}</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span>{flow.destination}</span>
                    </div>
                    {flow.strideRisks?.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <Shield className="w-3 h-3 text-gray-400 mr-0.5" />
                        {flow.strideRisks.map(r => (
                          <span key={r} className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: STRIDE_BADGE[r]?.bg, color: STRIDE_BADGE[r]?.text }}>
                            {STRIDE_BADGE[r]?.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="badge" style={{ backgroundColor: DATA_CLASSIFICATIONS[flow.dataClassification]?.color + '20', color: DATA_CLASSIFICATIONS[flow.dataClassification]?.color }}>
                      {DATA_CLASSIFICATIONS[flow.dataClassification]?.label}
                    </span>
                    <p className="text-xs text-gray-400 mt-1 font-mono">{flow.protocol}</p>
                    {flow.requiredControls && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {flow.requiredControls.split(',').length} control{flow.requiredControls.split(',').length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEditFlow(flow)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => { if (confirm('Delete this data flow?')) deleteDataFlow(flow.id); }} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              {flow.description && <p className="text-sm text-gray-500 mt-3 ml-16">{flow.description}</p>}
              {flow.securityNotes && (
                <div className="ml-16 mt-2 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">{flow.securityNotes}</p>
                </div>
              )}
            </motion.div>
          )) : (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <ArrowRight className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No data flows found</h3>
              <p className="text-gray-500 mb-4">Document how data moves through your system</p>
              <button onClick={() => setShowFlowModal(true)} className="btn-primary">
                <Plus className="w-5 h-5 mr-2" /> Add Data Flow
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Assets List ───────────────────────────────────────────────── */}
      {activeTab === 'assets' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search assets…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input pl-10" />
            </div>
            <button
              onClick={() => {
                setEditingAsset(null);
                setAssetForm({ name: '', projectId: filterProject || '', type: 'SERVICE', description: '', sensitivity: 'MEDIUM', owner: '' });
                setShowAssetModal(true);
              }}
              className="btn-primary"
            >
              <Plus className="w-5 h-5 mr-2" /> Add Asset
            </button>
          </div>

          {filteredAssets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssets.map((asset, index) => {
                const AssetIcon = ASSET_TYPES[asset.type]?.icon || Database;
                return (
                  <motion.div key={asset.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="card-hover">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: ASSET_TYPES[asset.type]?.color + '20' }}>
                        <AssetIcon className="w-6 h-6" style={{ color: ASSET_TYPES[asset.type]?.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">{asset.name}</h3>
                          <div className="flex items-center gap-1 ml-2">
                            <button onClick={() => handleEditAsset(asset)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => { if (confirm('Delete this asset?')) deleteAsset(asset.id); }} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{asset.description}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="badge text-xs" style={{ backgroundColor: ASSET_TYPES[asset.type]?.color + '20', color: ASSET_TYPES[asset.type]?.color }}>
                            {ASSET_TYPES[asset.type]?.label}
                          </span>
                          <span className={`badge text-xs ${
                            asset.sensitivity === 'CRITICAL' ? 'badge-critical' :
                            asset.sensitivity === 'HIGH'     ? 'badge-high'     :
                            asset.sensitivity === 'MEDIUM'   ? 'badge-medium'   : 'badge-low'
                          }`}>
                            {asset.sensitivity}
                          </span>
                        </div>
                        {asset.owner && <p className="text-xs text-gray-400 mt-2">Owner: {asset.owner}</p>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <Database className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
              <p className="text-gray-500 mb-4">Document your system components and data stores</p>
              <button onClick={() => setShowAssetModal(true)} className="btn-primary">
                <Plus className="w-5 h-5 mr-2" /> Add Asset
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Flow Patterns ─────────────────────────────────────────────── */}
      {activeTab === 'patterns' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {PATTERN_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setPatternCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                    patternCategory === cat ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {cat === 'all' ? 'All patterns' : cat}
                </button>
              ))}
            </div>
            {canWrite && (
              <button
                onClick={() => { setEditingPattern(null); setPatternForm(EMPTY_PATTERN_FORM); setShowPatternModal(true); }}
                className="btn-primary"
              >
                <Plus className="w-5 h-5 mr-2" /> Add Pattern
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPatterns.map((pattern, index) => (
              <motion.div
                key={pattern.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="card flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        pattern.category === 'OT/ICS'     ? 'bg-orange-100 text-orange-700' :
                        pattern.category === 'Enterprise' ? 'bg-blue-100 text-blue-700'     :
                                                             'bg-purple-100 text-purple-700'
                      }`}>
                        {pattern.category || 'Custom'}
                      </span>
                      {pattern.isBuiltIn && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Built-in</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900">{pattern.name}</h3>
                  </div>
                  {!pattern.isBuiltIn && canWrite && (
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      <button onClick={() => handleEditPattern(pattern)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm('Delete this pattern?')) deleteFlowPattern(pattern.id); }} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-500 mb-3">{pattern.description}</p>

                <div className="flex items-center gap-2 mb-3 text-xs flex-wrap">
                  <span className="font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{pattern.protocol}</span>
                  <span className="px-2 py-0.5 rounded" style={{ backgroundColor: DATA_CLASSIFICATIONS[pattern.dataClassification]?.color + '20', color: DATA_CLASSIFICATIONS[pattern.dataClassification]?.color }}>
                    {DATA_CLASSIFICATIONS[pattern.dataClassification]?.label}
                  </span>
                </div>

                {pattern.strideRisks?.length > 0 && (
                  <div className="flex items-center gap-1 mb-3 flex-wrap">
                    <Shield className="w-3 h-3 text-gray-400 mr-0.5" />
                    {pattern.strideRisks.map(r => (
                      <span key={r} className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: STRIDE_BADGE[r]?.bg, color: STRIDE_BADGE[r]?.text }}>
                        {r}
                      </span>
                    ))}
                  </div>
                )}

                {pattern.requiredControls && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Required controls</p>
                    <div className="flex flex-wrap gap-1">
                      {pattern.requiredControls.split(',').map((c, i) => (
                        <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-2.5 h-2.5 flex-shrink-0" />{c.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {pattern.securityNotes && (
                  <div className="flex items-start gap-1.5 mb-3">
                    <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">{pattern.securityNotes}</p>
                  </div>
                )}

                <div className="mt-auto pt-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      applyPattern(pattern);
                      setEditingFlow(null);
                      setShowFlowModal(true);
                      setActiveTab('flows');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                  >
                    <Zap className="w-4 h-4" /> Apply to new flow
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Data Flow Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFlowModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowFlowModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal-content max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">{editingFlow ? 'Edit Data Flow' : 'Add Data Flow'}</h2>
                  <button onClick={() => setShowFlowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
              </div>

              <form onSubmit={handleFlowSubmit} className="p-6 space-y-5">
                {/* Pattern picker */}
                {!editingFlow && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" /> Start from a pattern (optional)
                    </p>
                    <select
                      onChange={e => { const p = allPatterns.find(x => x.id === e.target.value); if (p) applyPattern(p); }}
                      value={flowForm.patternId}
                      className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">— Choose a pattern —</option>
                      {['OT/ICS', 'Enterprise', 'Custom'].map(cat => {
                        const catPatterns = allPatterns.filter(p => (p.category || 'Custom') === cat);
                        if (catPatterns.length === 0) return null;
                        return (
                          <optgroup key={cat} label={cat}>
                            {catPatterns.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </optgroup>
                        );
                      })}
                    </select>
                  </div>
                )}

                <div>
                  <label className="label">Project</label>
                  <select value={flowForm.projectId} onChange={e => setFlowForm({ ...flowForm, projectId: e.target.value })} className="input" required>
                    <option value="">Select a project</option>
                    {state.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="label">Flow Name</label>
                  <input type="text" value={flowForm.name} onChange={e => setFlowForm({ ...flowForm, name: e.target.value })} className="input" placeholder="e.g., User to API Gateway" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Source</label>
                    <input type="text" value={flowForm.source} onChange={e => setFlowForm({ ...flowForm, source: e.target.value })} className="input" placeholder="e.g., User Browser" required />
                  </div>
                  <div>
                    <label className="label">Destination</label>
                    <input type="text" value={flowForm.destination} onChange={e => setFlowForm({ ...flowForm, destination: e.target.value })} className="input" placeholder="e.g., Web Server" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Protocol</label>
                    <select value={flowForm.protocol} onChange={e => setFlowForm({ ...flowForm, protocol: e.target.value })} className="input">
                      {PROTOCOLS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Data Classification</label>
                    <select value={flowForm.dataClassification} onChange={e => setFlowForm({ ...flowForm, dataClassification: e.target.value })} className="input">
                      {Object.entries(DATA_CLASSIFICATIONS).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">STRIDE Risks</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(STRIDE_BADGE).map(([letter, meta]) => (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => toggleStrideRisk(letter, 'flow')}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                        style={flowForm.strideRisks.includes(letter)
                          ? { backgroundColor: meta.bg, color: meta.text, borderColor: meta.text + '40' }
                          : { borderColor: '#e5e7eb', backgroundColor: 'white', color: '#6b7280' }
                        }
                      >
                        {letter} — {meta.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Required Controls <span className="text-gray-400 font-normal text-xs">(comma-separated)</span></label>
                  <input type="text" value={flowForm.requiredControls} onChange={e => setFlowForm({ ...flowForm, requiredControls: e.target.value })} className="input" placeholder="e.g., TLS 1.2+, JWT validation, Rate limiting" />
                </div>

                <div>
                  <label className="label">Security Notes</label>
                  <textarea value={flowForm.securityNotes} onChange={e => setFlowForm({ ...flowForm, securityNotes: e.target.value })} className="input min-h-[60px]" placeholder="Key security considerations for this flow…" rows={2} />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea value={flowForm.description} onChange={e => setFlowForm({ ...flowForm, description: e.target.value })} className="input min-h-[60px]" placeholder="Describe the data flow…" rows={2} />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowFlowModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">{editingFlow ? 'Save Changes' : 'Add Flow'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Asset Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAssetModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowAssetModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal-content"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">{editingAsset ? 'Edit Asset' : 'Add Asset'}</h2>
                  <button onClick={() => setShowAssetModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <form onSubmit={handleAssetSubmit} className="p-6 space-y-6">
                <div>
                  <label className="label">Project</label>
                  <select value={assetForm.projectId} onChange={e => setAssetForm({ ...assetForm, projectId: e.target.value })} className="input" required>
                    <option value="">Select a project</option>
                    {state.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Asset Name</label>
                  <input type="text" value={assetForm.name} onChange={e => setAssetForm({ ...assetForm, name: e.target.value })} className="input" placeholder="e.g., Customer Database" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Asset Type</label>
                    <select value={assetForm.type} onChange={e => setAssetForm({ ...assetForm, type: e.target.value })} className="input">
                      {Object.entries(ASSET_TYPES).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Sensitivity</label>
                    <select value={assetForm.sensitivity} onChange={e => setAssetForm({ ...assetForm, sensitivity: e.target.value })} className="input">
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Owner</label>
                  <input type="text" value={assetForm.owner} onChange={e => setAssetForm({ ...assetForm, owner: e.target.value })} className="input" placeholder="Team or person responsible" />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea value={assetForm.description} onChange={e => setAssetForm({ ...assetForm, description: e.target.value })} className="input min-h-[80px]" placeholder="Describe the asset…" rows={3} />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowAssetModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">{editingAsset ? 'Save Changes' : 'Add Asset'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pattern Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPatternModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowPatternModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal-content"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">{editingPattern ? 'Edit Pattern' : 'New Flow Pattern'}</h2>
                  <button onClick={() => setShowPatternModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <form onSubmit={handlePatternSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Pattern Name</label>
                    <input type="text" value={patternForm.name} onChange={e => setPatternForm({ ...patternForm, name: e.target.value })} className="input" placeholder="e.g., Internal API (mTLS)" required />
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <select value={patternForm.category} onChange={e => setPatternForm({ ...patternForm, category: e.target.value })} className="input">
                      <option value="OT/ICS">OT/ICS</option>
                      <option value="Enterprise">Enterprise</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Description</label>
                  <input type="text" value={patternForm.description} onChange={e => setPatternForm({ ...patternForm, description: e.target.value })} className="input" placeholder="Brief description of this flow pattern" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Protocol</label>
                    <select value={patternForm.protocol} onChange={e => setPatternForm({ ...patternForm, protocol: e.target.value })} className="input">
                      {PROTOCOLS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Data Classification</label>
                    <select value={patternForm.dataClassification} onChange={e => setPatternForm({ ...patternForm, dataClassification: e.target.value })} className="input">
                      {Object.entries(DATA_CLASSIFICATIONS).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">STRIDE Risks</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(STRIDE_BADGE).map(([letter, meta]) => (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => toggleStrideRisk(letter, 'pattern')}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                        style={patternForm.strideRisks.includes(letter)
                          ? { backgroundColor: meta.bg, color: meta.text, borderColor: meta.text + '40' }
                          : { borderColor: '#e5e7eb', backgroundColor: 'white', color: '#6b7280' }
                        }
                      >
                        {letter} — {meta.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Required Controls <span className="text-gray-400 font-normal text-xs">(comma-separated)</span></label>
                  <input type="text" value={patternForm.requiredControls} onChange={e => setPatternForm({ ...patternForm, requiredControls: e.target.value })} className="input" placeholder="e.g., TLS 1.2+, JWT validation, Rate limiting" />
                </div>
                <div>
                  <label className="label">Security Notes</label>
                  <textarea value={patternForm.securityNotes} onChange={e => setPatternForm({ ...patternForm, securityNotes: e.target.value })} className="input min-h-[60px]" placeholder="Key security considerations…" rows={2} />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowPatternModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">{editingPattern ? 'Save Changes' : 'Create Pattern'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
