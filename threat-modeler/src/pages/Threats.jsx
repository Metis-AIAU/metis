import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  AlertTriangle,
  ChevronDown,
  Edit2,
  Trash2,
  X,
  Shield,
  Target,
  Zap,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useThreatContext, STRIDE_CATEGORIES, RISK_LEVELS } from '../context/ThreatContext';

export default function Threats() {
  const {
    state,
    addThreat,
    updateThreat,
    deleteThreat,
    getThreatControls,
    calculateRiskScore,
    isThreatMitigated,
  } = useThreatContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingThreat, setEditingThreat] = useState(null);
  const [expandedThreat, setExpandedThreat] = useState(null);
  const [filterMitigation, setFilterMitigation] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectId: '',
    strideCategory: 'S',
    likelihood: 3,
    impact: 3,
    attackVector: 'Network',
    prerequisites: '',
  });

  const filteredThreats = useMemo(() => {
    return state.threats.filter((threat) => {
      const matchesSearch =
        threat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        threat.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !filterCategory || threat.strideCategory === filterCategory;
      const matchesRisk = !filterRisk || threat.riskLevel === filterRisk;
      const matchesProject = !filterProject || threat.projectId === filterProject;
      const mitigated = isThreatMitigated(threat.id);
      const matchesMitigation =
        !filterMitigation ||
        (filterMitigation === 'mitigated' && mitigated) ||
        (filterMitigation === 'unmitigated' && !mitigated);
      return matchesSearch && matchesCategory && matchesRisk && matchesProject && matchesMitigation;
    });
  }, [state.threats, state.controls, searchQuery, filterCategory, filterRisk, filterProject, filterMitigation, isThreatMitigated]);

  const getRiskLevel = (likelihood, impact) => {
    const score = likelihood * impact;
    if (score >= 20) return 'CRITICAL';
    if (score >= 15) return 'HIGH';
    if (score >= 10) return 'MEDIUM';
    if (score >= 5) return 'LOW';
    return 'MINIMAL';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const riskLevel = getRiskLevel(formData.likelihood, formData.impact);
    const threatData = {
      ...formData,
      riskLevel,
    };

    if (editingThreat) {
      updateThreat({ ...threatData, id: editingThreat.id });
    } else {
      addThreat(threatData);
    }

    setShowModal(false);
    setEditingThreat(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      projectId: state.currentProject?.id || '',
      strideCategory: 'S',
      likelihood: 3,
      impact: 3,
      attackVector: 'Network',
      prerequisites: '',
    });
  };

  const handleEdit = (threat) => {
    setEditingThreat(threat);
    setFormData({
      name: threat.name,
      description: threat.description || '',
      projectId: threat.projectId,
      strideCategory: threat.strideCategory,
      likelihood: threat.likelihood,
      impact: threat.impact,
      attackVector: threat.attackVector || 'Network',
      prerequisites: threat.prerequisites || '',
    });
    setShowModal(true);
  };

  const handleDelete = (threatId) => {
    if (confirm('Are you sure you want to delete this threat?')) {
      deleteThreat(threatId);
    }
  };

  const getProjectName = (projectId) => {
    return state.projects.find((p) => p.id === projectId)?.name || 'Unknown';
  };

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Threat Catalog</h1>
          <p className="text-gray-500 mt-1">Identify and analyze security threats using STRIDE methodology</p>
        </div>
        <button
          onClick={() => {
            setEditingThreat(null);
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Threat
        </button>
      </motion.div>

      {/* STRIDE Legend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-gray-100 p-4 mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-blue-500" />
          <h3 className="font-medium text-gray-900">STRIDE Threat Categories</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(STRIDE_CATEGORIES).map(([key, category]) => (
            <div
              key={key}
              className="flex items-center gap-2 p-2 rounded-lg"
              style={{ backgroundColor: category.color + '15' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white"
                style={{ backgroundColor: category.color }}
              >
                {key}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{category.name}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-wrap items-center gap-4 mb-6"
      >
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search threats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>

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

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="input w-auto"
        >
          <option value="">All Categories</option>
          {Object.entries(STRIDE_CATEGORIES).map(([key, category]) => (
            <option key={key} value={key}>
              {key} - {category.name}
            </option>
          ))}
        </select>

        <select
          value={filterRisk}
          onChange={(e) => setFilterRisk(e.target.value)}
          className="input w-auto"
        >
          <option value="">All Risk Levels</option>
          {Object.entries(RISK_LEVELS).map(([key, level]) => (
            <option key={key} value={key}>
              {level.label}
            </option>
          ))}
        </select>

        <select
          value={filterMitigation}
          onChange={(e) => setFilterMitigation(e.target.value)}
          className="input w-auto"
        >
          <option value="">All Statuses</option>
          <option value="mitigated">Mitigated</option>
          <option value="unmitigated">Unmitigated</option>
        </select>
      </motion.div>

      {/* Threats List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {filteredThreats.map((threat, index) => {
          const controls = getThreatControls(threat.id);
          const isExpanded = expandedThreat === threat.id;
          const riskScore = calculateRiskScore(threat.likelihood, threat.impact);
          const mitigated = isThreatMitigated(threat.id);

          return (
            <motion.div
              key={threat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                mitigated
                  ? 'bg-gray-50 border-gray-200 opacity-60'
                  : 'bg-white border-gray-100'
              }`}
            >
              <div
                className="p-6 cursor-pointer"
                onClick={() => setExpandedThreat(isExpanded ? null : threat.id)}
              >
                <div className="flex items-start gap-4">
                  {/* STRIDE Badge */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-lg"
                    style={{ backgroundColor: mitigated ? '#9ca3af' : STRIDE_CATEGORIES[threat.strideCategory]?.color }}
                  >
                    {threat.strideCategory}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className={`font-semibold text-lg ${mitigated ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{threat.name}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{threat.description}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {mitigated && (
                          <span className="badge bg-green-100 text-green-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mitigated
                          </span>
                        )}
                        <span
                          className="badge"
                          style={{
                            backgroundColor: mitigated ? '#f3f4f6' : RISK_LEVELS[threat.riskLevel]?.bgColor,
                            color: mitigated ? '#9ca3af' : RISK_LEVELS[threat.riskLevel]?.color,
                          }}
                        >
                          {RISK_LEVELS[threat.riskLevel]?.label}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Risk Score: <span className="font-semibold">{riskScore}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {controls.length} Control{controls.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{threat.attackVector}</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        Project: {getProjectName(threat.projectId)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-100"
                  >
                    <div className="p-6 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Risk Assessment */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Risk Assessment</h4>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Likelihood</span>
                                <span className="font-medium">{threat.likelihood}/5</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 rounded-full h-2 transition-all"
                                  style={{ width: `${(threat.likelihood / 5) * 100}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Impact</span>
                                <span className="font-medium">{threat.impact}/5</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-red-500 rounded-full h-2 transition-all"
                                  style={{ width: `${(threat.impact / 5) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {threat.prerequisites && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-gray-700 mb-1">Prerequisites</h5>
                              <p className="text-sm text-gray-600">{threat.prerequisites}</p>
                            </div>
                          )}
                        </div>

                        {/* Linked Controls */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Mitigating Controls</h4>
                          {controls.length > 0 ? (
                            <div className="space-y-2">
                              {controls.map((control) => (
                                <div
                                  key={control.id}
                                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100"
                                >
                                  <Shield className="w-5 h-5 text-green-500" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-900 truncate">
                                      {control.name}
                                    </p>
                                    <p className="text-xs text-gray-500">{control.status}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 bg-white rounded-lg border border-gray-100">
                              <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">No controls linked</p>
                              <Link
                                to="/controls"
                                className="text-sm text-blue-600 hover:text-blue-700 mt-1 inline-block"
                              >
                                Add control
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(threat);
                          }}
                          className="btn-secondary"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(threat.id);
                          }}
                          className="btn-danger"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Empty State */}
        {filteredThreats.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <AlertTriangle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No threats found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || filterCategory || filterRisk || filterProject
                ? 'Try adjusting your filters'
                : 'Start by identifying potential security threats'}
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="btn-primary"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Threat
            </button>
          </div>
        )}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowModal(false)}
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
                    {editingThreat ? 'Edit Threat' : 'Add New Threat'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="label">Project</label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
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
                  <label className="label">Threat Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="e.g., SQL Injection on User Login"
                    required
                  />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input min-h-[80px]"
                    placeholder="Describe the threat scenario..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">STRIDE Category</label>
                    <select
                      value={formData.strideCategory}
                      onChange={(e) => setFormData({ ...formData, strideCategory: e.target.value })}
                      className="input"
                    >
                      {Object.entries(STRIDE_CATEGORIES).map(([key, category]) => (
                        <option key={key} value={key}>
                          {key} - {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Attack Vector</label>
                    <select
                      value={formData.attackVector}
                      onChange={(e) => setFormData({ ...formData, attackVector: e.target.value })}
                      className="input"
                    >
                      <option value="Network">Network</option>
                      <option value="Adjacent">Adjacent Network</option>
                      <option value="Local">Local</option>
                      <option value="Physical">Physical</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Likelihood (1-5)</label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={formData.likelihood}
                      onChange={(e) => setFormData({ ...formData, likelihood: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Very Low</span>
                      <span className="font-medium text-gray-900">{formData.likelihood}</span>
                      <span>Very High</span>
                    </div>
                  </div>

                  <div>
                    <label className="label">Impact (1-5)</label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={formData.impact}
                      onChange={(e) => setFormData({ ...formData, impact: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Minimal</span>
                      <span className="font-medium text-gray-900">{formData.impact}</span>
                      <span>Critical</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Calculated Risk Level:</span>
                    <span
                      className="badge font-semibold"
                      style={{
                        backgroundColor:
                          RISK_LEVELS[getRiskLevel(formData.likelihood, formData.impact)]?.bgColor,
                        color: RISK_LEVELS[getRiskLevel(formData.likelihood, formData.impact)]?.color,
                      }}
                    >
                      {RISK_LEVELS[getRiskLevel(formData.likelihood, formData.impact)]?.label} (Score:{' '}
                      {formData.likelihood * formData.impact})
                    </span>
                  </div>
                </div>

                <div>
                  <label className="label">Prerequisites</label>
                  <input
                    type="text"
                    value={formData.prerequisites}
                    onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                    className="input"
                    placeholder="e.g., Network access, Valid user account"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingThreat ? 'Save Changes' : 'Add Threat'}
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
