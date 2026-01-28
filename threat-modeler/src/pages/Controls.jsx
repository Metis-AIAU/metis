import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Shield,
  CheckCircle2,
  Clock,
  AlertCircle,
  Pause,
  Edit2,
  Trash2,
  X,
  Link2,
  Unlink,
  Calendar,
  User,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { useThreatContext, CONTROL_STATUS, RISK_LEVELS } from '../context/ThreatContext';

const CONTROL_TYPES = {
  PREVENTIVE: { label: 'Preventive', color: '#3b82f6', description: 'Stops threats before they occur' },
  DETECTIVE: { label: 'Detective', color: '#f59e0b', description: 'Identifies threats when they occur' },
  CORRECTIVE: { label: 'Corrective', color: '#22c55e', description: 'Fixes issues after detection' },
  DETERRENT: { label: 'Deterrent', color: '#8b5cf6', description: 'Discourages threat actors' },
  COMPENSATING: { label: 'Compensating', color: '#ec4899', description: 'Alternative when primary fails' },
};

const PRIORITY_LEVELS = {
  CRITICAL: { label: 'Critical', color: '#991b1b', bgColor: '#fee2e2' },
  HIGH: { label: 'High', color: '#c2410c', bgColor: '#ffedd5' },
  MEDIUM: { label: 'Medium', color: '#a16207', bgColor: '#fef3c7' },
  LOW: { label: 'Low', color: '#15803d', bgColor: '#dcfce7' },
};

export default function Controls() {
  const {
    state,
    addControl,
    updateControl,
    deleteControl,
    linkControlToThreat,
    unlinkControlFromThreat,
    getControlThreats,
  } = useThreatContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingControl, setEditingControl] = useState(null);
  const [linkingControl, setLinkingControl] = useState(null);
  const [expandedControl, setExpandedControl] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectId: '',
    type: 'PREVENTIVE',
    status: 'NOT_STARTED',
    priority: 'MEDIUM',
    owner: '',
    dueDate: '',
  });

  const filteredControls = useMemo(() => {
    return state.controls.filter((control) => {
      const matchesSearch =
        control.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        control.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !filterStatus || control.status === filterStatus;
      const matchesType = !filterType || control.type === filterType;
      const matchesProject = !filterProject || control.projectId === filterProject;
      return matchesSearch && matchesStatus && matchesType && matchesProject;
    });
  }, [state.controls, searchQuery, filterStatus, filterType, filterProject]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'NOT_STARTED':
        return <Pause className="w-4 h-4" />;
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4" />;
      case 'IMPLEMENTED':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'VERIFIED':
        return <Shield className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingControl) {
      updateControl({ ...formData, id: editingControl.id, linkedThreats: editingControl.linkedThreats });
    } else {
      addControl({ ...formData, linkedThreats: [] });
    }
    setShowModal(false);
    setEditingControl(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      projectId: state.currentProject?.id || '',
      type: 'PREVENTIVE',
      status: 'NOT_STARTED',
      priority: 'MEDIUM',
      owner: '',
      dueDate: '',
    });
  };

  const handleEdit = (control) => {
    setEditingControl(control);
    setFormData({
      name: control.name,
      description: control.description || '',
      projectId: control.projectId,
      type: control.type,
      status: control.status,
      priority: control.priority || 'MEDIUM',
      owner: control.owner || '',
      dueDate: control.dueDate || '',
    });
    setShowModal(true);
  };

  const handleDelete = (controlId) => {
    if (confirm('Are you sure you want to delete this control?')) {
      deleteControl(controlId);
    }
  };

  const handleStatusChange = (control, newStatus) => {
    updateControl({ ...control, status: newStatus });
  };

  const getProjectName = (projectId) => {
    return state.projects.find((p) => p.id === projectId)?.name || 'Unknown';
  };

  const getProjectThreats = (projectId) => {
    return state.threats.filter((t) => t.projectId === projectId);
  };

  const handleToggleThreatLink = (controlId, threatId, isLinked) => {
    if (isLinked) {
      unlinkControlFromThreat(controlId, threatId);
    } else {
      linkControlToThreat(controlId, threatId);
    }
  };

  const controlsByStatus = useMemo(() => {
    return {
      NOT_STARTED: filteredControls.filter((c) => c.status === 'NOT_STARTED'),
      IN_PROGRESS: filteredControls.filter((c) => c.status === 'IN_PROGRESS'),
      IMPLEMENTED: filteredControls.filter((c) => c.status === 'IMPLEMENTED'),
      VERIFIED: filteredControls.filter((c) => c.status === 'VERIFIED'),
    };
  }, [filteredControls]);

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Controls</h1>
          <p className="text-gray-500 mt-1">Manage mitigations and track implementation progress</p>
        </div>
        <button
          onClick={() => {
            setEditingControl(null);
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Control
        </button>
      </motion.div>

      {/* Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-4 gap-4 mb-6"
      >
        {Object.entries(CONTROL_STATUS).map(([key, status]) => (
          <div
            key={key}
            className={`card cursor-pointer transition-all ${
              filterStatus === key ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setFilterStatus(filterStatus === key ? '' : key)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: status.color + '20' }}
                >
                  <span style={{ color: status.color }}>{getStatusIcon(key)}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{status.label}</p>
                  <p className="text-2xl font-bold" style={{ color: status.color }}>
                    {controlsByStatus[key]?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
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
            placeholder="Search controls..."
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
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="input w-auto"
        >
          <option value="">All Types</option>
          {Object.entries(CONTROL_TYPES).map(([key, type]) => (
            <option key={key} value={key}>
              {type.label}
            </option>
          ))}
        </select>

        {filterStatus && (
          <button
            onClick={() => setFilterStatus('')}
            className="btn-ghost text-sm"
          >
            <X className="w-4 h-4 mr-1" />
            Clear status filter
          </button>
        )}
      </motion.div>

      {/* Controls List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {filteredControls.map((control, index) => {
          const linkedThreats = getControlThreats(control.id);
          const isExpanded = expandedControl === control.id;
          const isOverdue = control.dueDate && new Date(control.dueDate) < new Date() && control.status !== 'VERIFIED' && control.status !== 'IMPLEMENTED';

          return (
            <motion.div
              key={control.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`bg-white rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all ${
                isOverdue ? 'border-red-200' : 'border-gray-100'
              }`}
            >
              <div
                className="p-6 cursor-pointer"
                onClick={() => setExpandedControl(isExpanded ? null : control.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Type Badge */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: CONTROL_TYPES[control.type]?.color + '20' }}
                  >
                    <Shield
                      className="w-6 h-6"
                      style={{ color: CONTROL_TYPES[control.type]?.color }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 text-lg">{control.name}</h3>
                          {isOverdue && (
                            <span className="badge-critical text-xs">Overdue</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{control.description}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span
                          className="badge"
                          style={{
                            backgroundColor: PRIORITY_LEVELS[control.priority]?.bgColor,
                            color: PRIORITY_LEVELS[control.priority]?.color,
                          }}
                        >
                          {PRIORITY_LEVELS[control.priority]?.label}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="flex items-center gap-6 mt-4">
                      <div
                        className="flex items-center gap-2 px-3 py-1 rounded-full text-sm"
                        style={{
                          backgroundColor: CONTROL_STATUS[control.status]?.color + '20',
                          color: CONTROL_STATUS[control.status]?.color,
                        }}
                      >
                        {getStatusIcon(control.status)}
                        <span className="font-medium">{CONTROL_STATUS[control.status]?.label}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CONTROL_TYPES[control.type]?.color }}
                        />
                        {CONTROL_TYPES[control.type]?.label}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Link2 className="w-4 h-4" />
                        {linkedThreats.length} threat{linkedThreats.length !== 1 ? 's' : ''}
                      </div>
                      <div className="text-sm text-gray-400">
                        {getProjectName(control.projectId)}
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
                        {/* Details */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Control Details</h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Owner: {control.owner || 'Unassigned'}
                              </span>
                            </div>
                            {control.dueDate && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                  Due: {new Date(control.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Status Changer */}
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Update Status</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(CONTROL_STATUS).map(([key, status]) => (
                                <button
                                  key={key}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(control, key);
                                  }}
                                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                                    control.status === key
                                      ? 'ring-2 ring-offset-1'
                                      : 'hover:opacity-80'
                                  }`}
                                  style={{
                                    backgroundColor: status.color + '20',
                                    color: status.color,
                                    ringColor: status.color,
                                  }}
                                >
                                  {status.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Linked Threats */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">Linked Threats</h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setLinkingControl(control);
                                setShowLinkModal(true);
                              }}
                              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <Link2 className="w-4 h-4" />
                              Manage
                            </button>
                          </div>
                          {linkedThreats.length > 0 ? (
                            <div className="space-y-2">
                              {linkedThreats.map((threat) => (
                                <div
                                  key={threat.id}
                                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100"
                                >
                                  <AlertCircle className="w-5 h-5 text-orange-500" />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-900 truncate">
                                      {threat.name}
                                    </p>
                                    <span
                                      className="text-xs"
                                      style={{ color: RISK_LEVELS[threat.riskLevel]?.color }}
                                    >
                                      {RISK_LEVELS[threat.riskLevel]?.label}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 bg-white rounded-lg border border-gray-100">
                              <Link2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">No threats linked</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(control);
                          }}
                          className="btn-secondary"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(control.id);
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
        {filteredControls.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No controls found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || filterStatus || filterType || filterProject
                ? 'Try adjusting your filters'
                : 'Add security controls to mitigate identified threats'}
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="btn-primary"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Control
            </button>
          </div>
        )}
      </motion.div>

      {/* Create/Edit Modal */}
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
                    {editingControl ? 'Edit Control' : 'Add New Control'}
                  </h2>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
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
                  <label className="label">Control Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="e.g., Input Validation"
                    required
                  />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input min-h-[80px]"
                    placeholder="Describe the security control..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Control Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="input"
                    >
                      {Object.entries(CONTROL_TYPES).map(([key, type]) => (
                        <option key={key} value={key}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="input"
                    >
                      {Object.entries(PRIORITY_LEVELS).map(([key, level]) => (
                        <option key={key} value={key}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Owner</label>
                    <input
                      type="text"
                      value={formData.owner}
                      onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                      className="input"
                      placeholder="Team or person name"
                    />
                  </div>

                  <div>
                    <label className="label">Due Date</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Status</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(CONTROL_STATUS).map(([key, status]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, status: key })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          formData.status === key ? 'ring-2 ring-offset-1' : ''
                        }`}
                        style={{
                          backgroundColor: status.color + '20',
                          color: status.color,
                          ringColor: status.color,
                        }}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingControl ? 'Save Changes' : 'Add Control'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Link Threats Modal */}
      <AnimatePresence>
        {showLinkModal && linkingControl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowLinkModal(false)}
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
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Link Threats</h2>
                    <p className="text-sm text-gray-500 mt-1">Select threats that this control mitigates</p>
                  </div>
                  <button onClick={() => setShowLinkModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {getProjectThreats(linkingControl.projectId).length > 0 ? (
                  <div className="space-y-2">
                    {getProjectThreats(linkingControl.projectId).map((threat) => {
                      const isLinked = linkingControl.linkedThreats?.includes(threat.id);
                      return (
                        <div
                          key={threat.id}
                          onClick={() => handleToggleThreatLink(linkingControl.id, threat.id, isLinked)}
                          className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                            isLinked
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              isLinked
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {isLinked && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{threat.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className="badge text-xs"
                                style={{
                                  backgroundColor: RISK_LEVELS[threat.riskLevel]?.bgColor,
                                  color: RISK_LEVELS[threat.riskLevel]?.color,
                                }}
                              >
                                {RISK_LEVELS[threat.riskLevel]?.label}
                              </span>
                              <span className="text-xs text-gray-500">{threat.strideCategory}</span>
                            </div>
                          </div>
                          {isLinked ? (
                            <Unlink className="w-5 h-5 text-blue-500" />
                          ) : (
                            <Link2 className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No threats in this project</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100">
                <button onClick={() => setShowLinkModal(false)} className="btn-primary w-full">
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
