import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Network,
  Database,
  Server,
  User,
  Cloud,
  Globe,
  Lock,
  Unlock,
  Edit2,
  Trash2,
  X,
  ArrowRight,
  Shield,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { useThreatContext } from '../context/ThreatContext';

const DATA_CLASSIFICATIONS = {
  PUBLIC: { label: 'Public', color: '#22c55e', description: 'Open information' },
  INTERNAL: { label: 'Internal', color: '#3b82f6', description: 'Business use only' },
  CONFIDENTIAL: { label: 'Confidential', color: '#f59e0b', description: 'Sensitive data' },
  RESTRICTED: { label: 'Restricted', color: '#ef4444', description: 'Highly sensitive' },
};

const ASSET_TYPES = {
  DATA_STORE: { label: 'Data Store', icon: Database, color: '#8b5cf6' },
  SERVICE: { label: 'Service', icon: Server, color: '#3b82f6' },
  EXTERNAL_SERVICE: { label: 'External Service', icon: Cloud, color: '#f59e0b' },
  APPLICATION: { label: 'Application', icon: Globe, color: '#22c55e' },
  USER: { label: 'User/Actor', icon: User, color: '#ec4899' },
};

const PROTOCOLS = ['HTTPS', 'HTTP', 'gRPC', 'WebSocket', 'TCP/IP', 'UDP', 'MQTT', 'AMQP', 'PostgreSQL/TLS', 'MySQL/TLS', 'Redis/TLS', 'Custom'];

export default function DataFlows() {
  const { state, addDataFlow, updateDataFlow, deleteDataFlow, addAsset, updateAsset, deleteAsset } = useThreatContext();

  const [activeTab, setActiveTab] = useState('diagram');
  const [filterProject, setFilterProject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingFlow, setEditingFlow] = useState(null);
  const [editingAsset, setEditingAsset] = useState(null);
  const [selectedFlow, setSelectedFlow] = useState(null);

  const [flowForm, setFlowForm] = useState({
    name: '',
    projectId: '',
    source: '',
    destination: '',
    protocol: 'HTTPS',
    dataClassification: 'INTERNAL',
    description: '',
  });

  const [assetForm, setAssetForm] = useState({
    name: '',
    projectId: '',
    type: 'SERVICE',
    description: '',
    sensitivity: 'MEDIUM',
    owner: '',
  });

  const filteredFlows = useMemo(() => {
    return state.dataFlows.filter((flow) => {
      const matchesProject = !filterProject || flow.projectId === filterProject;
      const matchesSearch =
        flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flow.source?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flow.destination?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesProject && matchesSearch;
    });
  }, [state.dataFlows, filterProject, searchQuery]);

  const filteredAssets = useMemo(() => {
    return state.assets.filter((asset) => {
      const matchesProject = !filterProject || asset.projectId === filterProject;
      const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesProject && matchesSearch;
    });
  }, [state.assets, filterProject, searchQuery]);

  const handleFlowSubmit = (e) => {
    e.preventDefault();
    if (editingFlow) {
      updateDataFlow({ ...flowForm, id: editingFlow.id });
    } else {
      addDataFlow(flowForm);
    }
    setShowFlowModal(false);
    setEditingFlow(null);
    setFlowForm({
      name: '',
      projectId: '',
      source: '',
      destination: '',
      protocol: 'HTTPS',
      dataClassification: 'INTERNAL',
      description: '',
    });
  };

  const handleAssetSubmit = (e) => {
    e.preventDefault();
    if (editingAsset) {
      updateAsset({ ...assetForm, id: editingAsset.id });
    } else {
      addAsset(assetForm);
    }
    setShowAssetModal(false);
    setEditingAsset(null);
    setAssetForm({
      name: '',
      projectId: '',
      type: 'SERVICE',
      description: '',
      sensitivity: 'MEDIUM',
      owner: '',
    });
  };

  const handleEditFlow = (flow) => {
    setEditingFlow(flow);
    setFlowForm({
      name: flow.name,
      projectId: flow.projectId,
      source: flow.source,
      destination: flow.destination,
      protocol: flow.protocol,
      dataClassification: flow.dataClassification,
      description: flow.description || '',
    });
    setShowFlowModal(true);
  };

  const handleEditAsset = (asset) => {
    setEditingAsset(asset);
    setAssetForm({
      name: asset.name,
      projectId: asset.projectId,
      type: asset.type,
      description: asset.description || '',
      sensitivity: asset.sensitivity || 'MEDIUM',
      owner: asset.owner || '',
    });
    setShowAssetModal(true);
  };

  const getProjectName = (projectId) => {
    return state.projects.find((p) => p.id === projectId)?.name || 'Unknown';
  };

  // Generate unique nodes from flows
  const diagramNodes = useMemo(() => {
    const nodes = new Map();
    filteredFlows.forEach((flow) => {
      if (!nodes.has(flow.source)) {
        nodes.set(flow.source, { id: flow.source, name: flow.source, connections: [] });
      }
      if (!nodes.has(flow.destination)) {
        nodes.set(flow.destination, { id: flow.destination, name: flow.destination, connections: [] });
      }
      nodes.get(flow.source).connections.push({
        target: flow.destination,
        flow,
      });
    });
    return Array.from(nodes.values());
  }, [filteredFlows]);

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
          <p className="text-gray-500 mt-1">Visualize and manage data flows between components</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="input w-auto"
          >
            <option value="">All Projects</option>
            {state.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setEditingFlow(null);
              setFlowForm({
                name: '',
                projectId: filterProject || '',
                source: '',
                destination: '',
                protocol: 'HTTPS',
                dataClassification: 'INTERNAL',
                description: '',
              });
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
          { id: 'diagram', label: 'Diagram View', icon: Network },
          { id: 'flows', label: 'Data Flows', icon: ArrowRight },
          { id: 'assets', label: 'Assets', icon: Database },
        ].map((tab) => (
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
          </button>
        ))}
      </motion.div>

      {/* Diagram View */}
      {activeTab === 'diagram' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card min-h-[600px]"
        >
          {diagramNodes.length > 0 ? (
            <div className="relative">
              {/* Legend */}
              <div className="absolute top-0 right-0 bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
                <p className="text-sm font-medium text-gray-700 mb-2">Data Classification</p>
                <div className="space-y-1">
                  {Object.entries(DATA_CLASSIFICATIONS).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: value.color }}
                      />
                      <span className="text-xs text-gray-600">{value.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual Diagram */}
              <div className="pt-8">
                <svg
                  viewBox="0 0 800 500"
                  className="w-full h-auto"
                  style={{ minHeight: '500px' }}
                >
                  <defs>
                    {Object.entries(DATA_CLASSIFICATIONS).map(([key, value]) => (
                      <marker
                        key={key}
                        id={`arrow-${key}`}
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                      >
                        <polygon
                          points="0 0, 10 3.5, 0 7"
                          fill={value.color}
                        />
                      </marker>
                    ))}
                  </defs>

                  {/* Draw connections */}
                  {filteredFlows.map((flow, index) => {
                    const sourceIndex = diagramNodes.findIndex((n) => n.name === flow.source);
                    const destIndex = diagramNodes.findIndex((n) => n.name === flow.destination);
                    const cols = Math.ceil(Math.sqrt(diagramNodes.length));

                    const sx = 100 + (sourceIndex % cols) * 180;
                    const sy = 80 + Math.floor(sourceIndex / cols) * 120;
                    const dx = 100 + (destIndex % cols) * 180;
                    const dy = 80 + Math.floor(destIndex / cols) * 120;

                    const midX = (sx + dx) / 2;
                    const midY = (sy + dy) / 2;
                    const curvature = 30;

                    const isSelected = selectedFlow?.id === flow.id;
                    const classColor = DATA_CLASSIFICATIONS[flow.dataClassification]?.color || '#6b7280';

                    return (
                      <g key={flow.id}>
                        <path
                          d={`M ${sx + 60} ${sy + 25} Q ${midX} ${midY - curvature} ${dx + 60} ${dy + 25}`}
                          fill="none"
                          stroke={classColor}
                          strokeWidth={isSelected ? 3 : 2}
                          strokeOpacity={isSelected ? 1 : 0.6}
                          markerEnd={`url(#arrow-${flow.dataClassification})`}
                          className="cursor-pointer hover:stroke-opacity-100 transition-all"
                          onClick={() => setSelectedFlow(flow)}
                        />
                        <text
                          x={midX}
                          y={midY - curvature - 8}
                          textAnchor="middle"
                          className="text-xs fill-gray-500 pointer-events-none"
                        >
                          {flow.protocol}
                        </text>
                      </g>
                    );
                  })}

                  {/* Draw nodes */}
                  {diagramNodes.map((node, index) => {
                    const cols = Math.ceil(Math.sqrt(diagramNodes.length));
                    const x = 100 + (index % cols) * 180;
                    const y = 80 + Math.floor(index / cols) * 120;

                    return (
                      <g key={node.id}>
                        <rect
                          x={x}
                          y={y}
                          width="120"
                          height="50"
                          rx="8"
                          fill="white"
                          stroke="#e5e7eb"
                          strokeWidth="2"
                          className="filter drop-shadow-sm"
                        />
                        <text
                          x={x + 60}
                          y={y + 30}
                          textAnchor="middle"
                          className="text-sm fill-gray-700 font-medium"
                        >
                          {node.name.length > 14 ? node.name.substring(0, 14) + '...' : node.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Selected Flow Details */}
              <AnimatePresence>
                {selectedFlow && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-4 left-4 right-4 bg-white rounded-xl border border-gray-200 shadow-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-gray-900">{selectedFlow.name}</h4>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: DATA_CLASSIFICATIONS[selectedFlow.dataClassification]?.color + '20',
                              color: DATA_CLASSIFICATIONS[selectedFlow.dataClassification]?.color,
                            }}
                          >
                            {DATA_CLASSIFICATIONS[selectedFlow.dataClassification]?.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                          <span className="font-medium">{selectedFlow.source}</span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{selectedFlow.destination}</span>
                          <span className="text-gray-400">via</span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">
                            {selectedFlow.protocol}
                          </span>
                        </div>
                        {selectedFlow.description && (
                          <p className="text-sm text-gray-500 mt-2">{selectedFlow.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedFlow(null)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
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
              <button
                onClick={() => setShowFlowModal(true)}
                className="btn-primary"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Data Flow
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Data Flows List */}
      {activeTab === 'flows' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search data flows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>

          {filteredFlows.length > 0 ? (
            filteredFlows.map((flow, index) => (
              <motion.div
                key={flow.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="card-hover"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: DATA_CLASSIFICATIONS[flow.dataClassification]?.color + '20',
                      }}
                    >
                      {flow.dataClassification === 'RESTRICTED' || flow.dataClassification === 'CONFIDENTIAL' ? (
                        <Lock
                          className="w-6 h-6"
                          style={{ color: DATA_CLASSIFICATIONS[flow.dataClassification]?.color }}
                        />
                      ) : (
                        <Unlock
                          className="w-6 h-6"
                          style={{ color: DATA_CLASSIFICATIONS[flow.dataClassification]?.color }}
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{flow.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <span>{flow.source}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span>{flow.destination}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span
                        className="badge"
                        style={{
                          backgroundColor: DATA_CLASSIFICATIONS[flow.dataClassification]?.color + '20',
                          color: DATA_CLASSIFICATIONS[flow.dataClassification]?.color,
                        }}
                      >
                        {DATA_CLASSIFICATIONS[flow.dataClassification]?.label}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">{flow.protocol}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditFlow(flow)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this data flow?')) deleteDataFlow(flow.id);
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                {flow.description && (
                  <p className="text-sm text-gray-500 mt-3 ml-16">{flow.description}</p>
                )}
              </motion.div>
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <ArrowRight className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No data flows found</h3>
              <p className="text-gray-500 mb-4">Document how data moves through your system</p>
              <button onClick={() => setShowFlowModal(true)} className="btn-primary">
                <Plus className="w-5 h-5 mr-2" />
                Add Data Flow
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Assets List */}
      {activeTab === 'assets' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
            <button
              onClick={() => {
                setEditingAsset(null);
                setAssetForm({
                  name: '',
                  projectId: filterProject || '',
                  type: 'SERVICE',
                  description: '',
                  sensitivity: 'MEDIUM',
                  owner: '',
                });
                setShowAssetModal(true);
              }}
              className="btn-primary"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Asset
            </button>
          </div>

          {/* Asset Grid */}
          {filteredAssets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssets.map((asset, index) => {
                const AssetIcon = ASSET_TYPES[asset.type]?.icon || Database;
                return (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="card-hover"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: ASSET_TYPES[asset.type]?.color + '20' }}
                      >
                        <AssetIcon
                          className="w-6 h-6"
                          style={{ color: ASSET_TYPES[asset.type]?.color }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">{asset.name}</h3>
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => handleEditAsset(asset)}
                              className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Delete this asset?')) deleteAsset(asset.id);
                              }}
                              className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{asset.description}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <span
                            className="badge text-xs"
                            style={{
                              backgroundColor: ASSET_TYPES[asset.type]?.color + '20',
                              color: ASSET_TYPES[asset.type]?.color,
                            }}
                          >
                            {ASSET_TYPES[asset.type]?.label}
                          </span>
                          <span
                            className={`badge text-xs ${
                              asset.sensitivity === 'CRITICAL'
                                ? 'badge-critical'
                                : asset.sensitivity === 'HIGH'
                                ? 'badge-high'
                                : asset.sensitivity === 'MEDIUM'
                                ? 'badge-medium'
                                : 'badge-low'
                            }`}
                          >
                            {asset.sensitivity}
                          </span>
                        </div>
                        {asset.owner && (
                          <p className="text-xs text-gray-400 mt-2">Owner: {asset.owner}</p>
                        )}
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
                <Plus className="w-5 h-5 mr-2" />
                Add Asset
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Data Flow Modal */}
      <AnimatePresence>
        {showFlowModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowFlowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingFlow ? 'Edit Data Flow' : 'Add Data Flow'}
                  </h2>
                  <button onClick={() => setShowFlowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleFlowSubmit} className="p-6 space-y-6">
                <div>
                  <label className="label">Project</label>
                  <select
                    value={flowForm.projectId}
                    onChange={(e) => setFlowForm({ ...flowForm, projectId: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select a project</option>
                    {state.projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Flow Name</label>
                  <input
                    type="text"
                    value={flowForm.name}
                    onChange={(e) => setFlowForm({ ...flowForm, name: e.target.value })}
                    className="input"
                    placeholder="e.g., User to API Gateway"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Source</label>
                    <input
                      type="text"
                      value={flowForm.source}
                      onChange={(e) => setFlowForm({ ...flowForm, source: e.target.value })}
                      className="input"
                      placeholder="e.g., User Browser"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Destination</label>
                    <input
                      type="text"
                      value={flowForm.destination}
                      onChange={(e) => setFlowForm({ ...flowForm, destination: e.target.value })}
                      className="input"
                      placeholder="e.g., Web Server"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Protocol</label>
                    <select
                      value={flowForm.protocol}
                      onChange={(e) => setFlowForm({ ...flowForm, protocol: e.target.value })}
                      className="input"
                    >
                      {PROTOCOLS.map((protocol) => (
                        <option key={protocol} value={protocol}>
                          {protocol}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Data Classification</label>
                    <select
                      value={flowForm.dataClassification}
                      onChange={(e) => setFlowForm({ ...flowForm, dataClassification: e.target.value })}
                      className="input"
                    >
                      {Object.entries(DATA_CLASSIFICATIONS).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={flowForm.description}
                    onChange={(e) => setFlowForm({ ...flowForm, description: e.target.value })}
                    className="input min-h-[80px]"
                    placeholder="Describe the data flow..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowFlowModal(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingFlow ? 'Save Changes' : 'Add Flow'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Asset Modal */}
      <AnimatePresence>
        {showAssetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowAssetModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingAsset ? 'Edit Asset' : 'Add Asset'}
                  </h2>
                  <button onClick={() => setShowAssetModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleAssetSubmit} className="p-6 space-y-6">
                <div>
                  <label className="label">Project</label>
                  <select
                    value={assetForm.projectId}
                    onChange={(e) => setAssetForm({ ...assetForm, projectId: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select a project</option>
                    {state.projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Asset Name</label>
                  <input
                    type="text"
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                    className="input"
                    placeholder="e.g., Customer Database"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Asset Type</label>
                    <select
                      value={assetForm.type}
                      onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value })}
                      className="input"
                    >
                      {Object.entries(ASSET_TYPES).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Sensitivity</label>
                    <select
                      value={assetForm.sensitivity}
                      onChange={(e) => setAssetForm({ ...assetForm, sensitivity: e.target.value })}
                      className="input"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Owner</label>
                  <input
                    type="text"
                    value={assetForm.owner}
                    onChange={(e) => setAssetForm({ ...assetForm, owner: e.target.value })}
                    className="input"
                    placeholder="Team or person responsible"
                  />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={assetForm.description}
                    onChange={(e) => setAssetForm({ ...assetForm, description: e.target.value })}
                    className="input min-h-[80px]"
                    placeholder="Describe the asset..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowAssetModal(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingAsset ? 'Save Changes' : 'Add Asset'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
