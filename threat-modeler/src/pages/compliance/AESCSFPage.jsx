import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle,
  Clock, Info, Tag, Filter, Search, Save, ChevronRight,
} from 'lucide-react';
import { useCompliance } from '../../context/ComplianceContext';
import { AESCSF_FUNCTIONS, AESCSF_PROFILES, COMPLIANCE_STATUS } from '../../data/aescsf';

const PRIORITY_BADGE = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
};

function StatusBadge({ status }) {
  const s = COMPLIANCE_STATUS[status] || COMPLIANCE_STATUS.NOT_ASSESSED;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: s.bgColor, color: s.color }}
    >
      <span>{s.icon}</span>
      {s.label}
    </span>
  );
}

function ControlRow({ control, assessment, onUpdate, profileKey, inProfile }) {
  const [expanded, setExpanded] = useState(false);
  const [localNotes, setLocalNotes] = useState(assessment?.notes || '');
  const [localEvidence, setLocalEvidence] = useState(assessment?.evidence || '');
  const [localAssignee, setLocalAssignee] = useState(assessment?.assignee || '');
  const [localDate, setLocalDate] = useState(assessment?.targetDate || '');

  function handleSave() {
    onUpdate(control.id, {
      notes: localNotes,
      evidence: localEvidence,
      assignee: localAssignee,
      targetDate: localDate,
    });
    setExpanded(false);
  }

  const currentStatus = assessment?.status || 'NOT_ASSESSED';

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${inProfile ? '' : 'opacity-50'}`}>
      <div
        className={`flex items-start gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${expanded ? 'bg-gray-50' : 'bg-white'}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-shrink-0 mt-0.5">
          <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{control.id}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 leading-relaxed">{control.description}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusBadge status={currentStatus} />
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[control.priority] || PRIORITY_BADGE.low}`}>
              {control.priority}
            </span>
            {control.otSpecific && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">OT Specific</span>
            )}
            {!inProfile && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">Not required for {profileKey}</span>
            )}
            {['SP1','SP2','SP3'].map(sp => control[sp.toLowerCase()] ? (
              <span key={sp} className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-mono">{sp}</span>
            ) : null)}
          </div>
        </div>
        <div className="flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100 bg-white"
          >
            <div className="p-4 space-y-4">
              {/* Status selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Assessment Status</label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(COMPLIANCE_STATUS).map(s => (
                    <button
                      key={s.id}
                      onClick={() => onUpdate(control.id, { status: s.id })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                        currentStatus === s.id ? 'border-current shadow-sm' : 'border-transparent opacity-60 hover:opacity-90'
                      }`}
                      style={{ backgroundColor: s.bgColor, color: s.color, borderColor: currentStatus === s.id ? s.color : 'transparent' }}
                    >
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Evidence / Documentation</label>
                  <textarea
                    value={localEvidence}
                    onChange={e => setLocalEvidence(e.target.value)}
                    placeholder="Document reference, link, or description of evidence..."
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Notes / Comments</label>
                  <textarea
                    value={localNotes}
                    onChange={e => setLocalNotes(e.target.value)}
                    placeholder="Assessment notes, observations, remediation steps..."
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Assigned To</label>
                  <input
                    type="text"
                    value={localAssignee}
                    onChange={e => setLocalAssignee(e.target.value)}
                    placeholder="Person or team responsible"
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Target Completion Date</label>
                  <input
                    type="date"
                    value={localDate}
                    onChange={e => setLocalDate(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {assessment?.lastUpdated && (
                <p className="text-xs text-gray-400">Last updated: {new Date(assessment.lastUpdated).toLocaleString()}</p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setExpanded(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AESCSFPage() {
  const { state, dispatch, getFrameworkScore, getAescsfFunctionScore } = useCompliance();
  const [activeFunction, setActiveFunction] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showOnlyProfile, setShowOnlyProfile] = useState(true);

  const profileKey = state.aescsfProfile;
  const score = getFrameworkScore('AESCSF');

  function updateAssessment(controlId, updates) {
    dispatch({ type: 'UPDATE_ASSESSMENT', payload: { controlId, updates } });
  }

  function setProfile(p) {
    dispatch({ type: 'SET_AESCSF_PROFILE', payload: p });
  }

  function matchesFilter(control, assessment) {
    const inProfile = control[profileKey.toLowerCase()];
    if (showOnlyProfile && !inProfile) return false;
    if (filterStatus !== 'ALL' && assessment?.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return control.id.toLowerCase().includes(q) || control.description.toLowerCase().includes(q);
    }
    return true;
  }

  const displayedFunctions = activeFunction
    ? AESCSF_FUNCTIONS.filter(f => f.id === activeFunction)
    : AESCSF_FUNCTIONS;

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AESCSF Compliance Tracker</h1>
            <p className="text-sm text-gray-500">Australian Energy Sector Cyber Security Framework</p>
          </div>
        </div>

        {/* Profile selector */}
        <div className="flex items-center gap-3 mt-4">
          <span className="text-sm font-semibold text-gray-600">Security Profile:</span>
          {Object.values(AESCSF_PROFILES).map(profile => (
            <button
              key={profile.id}
              onClick={() => setProfile(profile.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border-2 ${
                profileKey === profile.id
                  ? 'border-blue-500 text-blue-700 bg-blue-50'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {profile.id}
              <span className="hidden md:inline ml-1 font-normal text-xs opacity-70">– {profile.description.split('–')[0].trim()}</span>
            </button>
          ))}
        </div>
        {profileKey && (
          <p className="text-sm text-gray-500 mt-2 ml-1">{AESCSF_PROFILES[profileKey]?.description}</p>
        )}
      </motion.div>

      {/* Score bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Overall AESCSF Compliance</h3>
          <span className="text-2xl font-bold text-blue-600">{score.score}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score.score}%` }}
            transition={{ duration: 1 }}
            className="h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center text-sm">
          {[
            { label: 'Compliant', value: score.compliant, color: '#10b981' },
            { label: 'Partial', value: score.partial, color: '#f59e0b' },
            { label: 'Non-Compliant', value: score.nonCompliant, color: '#ef4444' },
            { label: 'Not Assessed', value: score.notAssessed, color: '#9ca3af' },
            { label: 'N/A', value: score.na, color: '#6b7280' },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-lg p-2">
              <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Function tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setActiveFunction(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${!activeFunction ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          All Functions
        </button>
        {AESCSF_FUNCTIONS.map(fn => {
          const fnScore = getAescsfFunctionScore(fn.id);
          return (
            <button
              key={fn.id}
              onClick={() => setActiveFunction(activeFunction === fn.id ? null : fn.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeFunction === fn.id ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={activeFunction === fn.id ? { backgroundColor: fn.color } : {}}
            >
              {fn.id}
              <span className={`text-xs px-1.5 py-0.5 rounded ${activeFunction === fn.id ? 'bg-white/20' : 'bg-white'}`} style={{ color: activeFunction === fn.id ? 'white' : fn.color }}>
                {fnScore.score}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search controls..."
            className="text-sm outline-none w-full"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Statuses</option>
          {Object.values(COMPLIANCE_STATUS).map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyProfile}
            onChange={e => setShowOnlyProfile(e.target.checked)}
            className="rounded"
          />
          Show only {profileKey} controls
        </label>
      </div>

      {/* Controls by function */}
      <div className="space-y-6">
        {displayedFunctions.map(fn => {
          const fnScore = getAescsfFunctionScore(fn.id);
          return (
            <motion.div key={fn.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 mb-3 p-4 rounded-xl" style={{ backgroundColor: fn.bgColor }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: fn.color }}>
                  {fn.id}
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-gray-900">{fn.name}</h2>
                  <p className="text-xs text-gray-500 line-clamp-1">{fn.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold" style={{ color: fn.color }}>{fnScore.score}%</p>
                  <p className="text-xs text-gray-500">{fnScore.compliant}/{fnScore.applicable} compliant</p>
                </div>
              </div>

              {fn.categories.map(cat => {
                const visibleControls = cat.controls.filter(c => matchesFilter(c, state.assessments[c.id]));
                if (visibleControls.length === 0) return null;
                return (
                  <div key={cat.id} className="mb-4">
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className="font-mono text-xs text-gray-500 font-bold">{cat.id}</span>
                      <span className="text-sm font-semibold text-gray-700">{cat.name}</span>
                    </div>
                    <div className="space-y-2 pl-2">
                      {visibleControls.map(ctrl => (
                        <ControlRow
                          key={ctrl.id}
                          control={ctrl}
                          assessment={state.assessments[ctrl.id]}
                          onUpdate={updateAssessment}
                          profileKey={profileKey}
                          inProfile={ctrl[profileKey.toLowerCase()]}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
