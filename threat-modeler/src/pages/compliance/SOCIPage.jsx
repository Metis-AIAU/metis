import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ChevronDown, ChevronUp, Save, Search, AlertTriangle, Info, Shield } from 'lucide-react';
import { useCompliance } from '../../context/ComplianceContext';
import { SOCI_OBLIGATIONS, SOCI_SECTORS } from '../../data/soci';
import { COMPLIANCE_STATUS } from '../../data/aescsf';

const PRIORITY_BADGE = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
};

function StatusBadge({ status }) {
  const s = COMPLIANCE_STATUS[status] || COMPLIANCE_STATUS.NOT_ASSESSED;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: s.bgColor, color: s.color }}>
      {s.icon} {s.label}
    </span>
  );
}

function ObligationRow({ control, assessment, onUpdate, isSoNS }) {
  const [expanded, setExpanded] = useState(false);
  const [localNotes, setLocalNotes] = useState(assessment?.notes || '');
  const [localEvidence, setLocalEvidence] = useState(assessment?.evidence || '');
  const [localAssignee, setLocalAssignee] = useState(assessment?.assignee || '');
  const [localDate, setLocalDate] = useState(assessment?.targetDate || '');

  const isSoNSOnly = control.obligation?.includes('SoNS only');
  const isApplicable = !isSoNSOnly || isSoNS;
  const currentStatus = assessment?.status || 'NOT_ASSESSED';

  function handleSave() {
    onUpdate(control.id, { notes: localNotes, evidence: localEvidence, assignee: localAssignee, targetDate: localDate });
    setExpanded(false);
  }

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${!isApplicable ? 'opacity-50' : ''}`}>
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
            {isSoNSOnly && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isSoNS ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                SoNS Only
              </span>
            )}
            {control.timeframe && (
              <span className="text-xs text-gray-400">⏱ {control.timeframe}</span>
            )}
          </div>
          {control.legislativeRef && (
            <p className="text-xs text-blue-600 mt-1">{control.legislativeRef}</p>
          )}
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
              {/* Context info */}
              <div className="bg-purple-50 rounded-lg p-3 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div><span className="font-semibold text-purple-700">Obligation Type:</span> <span className="text-gray-700">{control.obligation}</span></div>
                  <div><span className="font-semibold text-purple-700">Timeframe:</span> <span className="text-gray-700">{control.timeframe}</span></div>
                  <div className="md:col-span-2"><span className="font-semibold text-purple-700">Applicability:</span> <span className="text-gray-700">{control.applicability}</span></div>
                </div>
              </div>

              {!isApplicable && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  This obligation only applies to Systems of National Significance (SoNS). Enable SoNS mode in settings to assess this control.
                </div>
              )}

              {/* Status selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Compliance Status</label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(COMPLIANCE_STATUS).map(s => (
                    <button
                      key={s.id}
                      onClick={() => onUpdate(control.id, { status: s.id })}
                      disabled={!isApplicable}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all disabled:opacity-30 ${
                        currentStatus === s.id ? 'shadow-sm' : 'border-transparent opacity-60 hover:opacity-90'
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
                    placeholder="Policy reference, audit report, registration certificate..."
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Notes</label>
                  <textarea
                    value={localNotes}
                    onChange={e => setLocalNotes(e.target.value)}
                    placeholder="Assessment notes, exceptions, remediation steps..."
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Target Completion Date</label>
                  <input
                    type="date"
                    value={localDate}
                    onChange={e => setLocalDate(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {assessment?.lastUpdated && (
                <p className="text-xs text-gray-400">Last updated: {new Date(assessment.lastUpdated).toLocaleString()}</p>
              )}

              <div className="flex justify-end gap-2">
                <button onClick={() => setExpanded(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                <button
                  onClick={handleSave}
                  disabled={!isApplicable}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-30 transition-colors"
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

export default function SOCIPage() {
  const { state, dispatch, getFrameworkScore } = useCompliance();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const score = getFrameworkScore('SOCI');

  function updateAssessment(controlId, updates) {
    dispatch({ type: 'UPDATE_ASSESSMENT', payload: { controlId, updates } });
  }

  function toggleSoNS() {
    dispatch({ type: 'SET_SONS', payload: !state.isSoNS });
  }

  function matchesFilter(control, assessment) {
    if (filterStatus !== 'ALL' && assessment?.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return control.id.toLowerCase().includes(q) || control.description.toLowerCase().includes(q);
    }
    return true;
  }

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SOCI Act Compliance Tracker</h1>
            <p className="text-sm text-gray-500">Security of Critical Infrastructure Act 2018 (amended 2022)</p>
          </div>
        </div>

        {/* Organisation & SoNS config */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
          <div>
            <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">Sector</p>
            <select
              value={state.organisation.sector}
              onChange={e => dispatch({ type: 'UPDATE_ORGANISATION', payload: { sector: e.target.value } })}
              className="text-sm border border-purple-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select sector...</option>
              {SOCI_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">System of National Significance</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={toggleSoNS}
                  className={`w-11 h-6 rounded-full transition-colors relative ${state.isSoNS ? 'bg-red-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${state.isSoNS ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className={`text-sm font-medium ${state.isSoNS ? 'text-red-700' : 'text-gray-600'}`}>
                  {state.isSoNS ? 'SoNS (Enhanced Obligations Apply)' : 'Not SoNS'}
                </span>
              </label>
            </div>
            {state.isSoNS && (
              <div className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Enhanced cyber security obligations apply to this asset
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Score */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Overall SOCI Act Compliance</h3>
          <span className="text-2xl font-bold text-purple-600">{score.score}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score.score}%` }}
            transition={{ duration: 1 }}
            className="h-3 rounded-full bg-gradient-to-r from-purple-400 to-purple-600"
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search obligations..."
            className="text-sm outline-none w-full"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="ALL">All Statuses</option>
          {Object.values(COMPLIANCE_STATUS).map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Obligations */}
      <div className="space-y-6">
        {SOCI_OBLIGATIONS.map(obl => {
          const visibleControls = obl.controls.filter(c => matchesFilter(c, state.assessments[c.id]));
          const oblCompliant = obl.controls.filter(c => state.assessments[c.id]?.status === 'COMPLIANT').length;
          if (visibleControls.length === 0) return null;
          return (
            <motion.div key={obl.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 mb-3 p-4 rounded-xl" style={{ backgroundColor: obl.bgColor }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: obl.color }}>
                  {obl.part.replace('Part ', 'P')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-gray-900">{obl.name}</h2>
                    <span className="text-xs text-gray-500 bg-white/60 px-2 py-0.5 rounded-full">{obl.part}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{obl.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-700">{oblCompliant}/{obl.controls.length}</p>
                  <p className="text-xs text-gray-400">compliant</p>
                </div>
              </div>
              <div className="space-y-2 pl-2">
                {visibleControls.map(ctrl => (
                  <ObligationRow
                    key={ctrl.id}
                    control={ctrl}
                    assessment={state.assessments[ctrl.id]}
                    onUpdate={updateAssessment}
                    isSoNS={state.isSoNS}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
