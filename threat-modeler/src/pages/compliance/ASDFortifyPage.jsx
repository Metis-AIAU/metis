import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronDown, ChevronUp, Save, Search, Info, Shield } from 'lucide-react';
import { useCompliance } from '../../context/ComplianceContext';
import { ASD_FORTIFY_STRATEGIES, ASD_MATURITY_LEVELS } from '../../data/asdFortify';
import { COMPLIANCE_STATUS } from '../../data/aescsf';
import ComplianceAI, { ControlGuidanceButton } from '../../components/ComplianceAI';

const MATURITY_ORDER = ['ML0', 'ML1', 'ML2', 'ML3'];

function StatusBadge({ status }) {
  const s = COMPLIANCE_STATUS[status] || COMPLIANCE_STATUS.NOT_ASSESSED;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: s.bgColor, color: s.color }}>
      {s.icon} {s.label}
    </span>
  );
}

function MaturityBadge({ level }) {
  const ml = ASD_MATURITY_LEVELS[level];
  if (!ml) return null;
  return (
    <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ backgroundColor: ml.bgColor, color: ml.color }}>
      {level}
    </span>
  );
}

function ControlRow({ control, assessment, onUpdate, isInScope }) {
  const [expanded, setExpanded] = useState(false);
  const [localNotes, setLocalNotes] = useState(assessment?.notes || '');
  const [localEvidence, setLocalEvidence] = useState(assessment?.evidence || '');
  const [localAssignee, setLocalAssignee] = useState(assessment?.assignee || '');
  const [localDate, setLocalDate] = useState(assessment?.targetDate || '');
  const currentStatus = assessment?.status || 'NOT_ASSESSED';

  function handleSave() {
    onUpdate(control.id, { notes: localNotes, evidence: localEvidence, assignee: localAssignee, targetDate: localDate });
    setExpanded(false);
  }

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${!isInScope ? 'opacity-40' : ''}`}>
      <div
        className={`flex items-start gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${expanded ? 'bg-gray-50' : 'bg-white'}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-shrink-0 mt-0.5">
          <MaturityBadge level={control.maturityLevel} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 leading-relaxed">{control.description}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusBadge status={currentStatus} />
            {control.otApplicable && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">OT Applicable</span>
            )}
            {control.otNote && (
              <span className="text-xs text-orange-600 flex items-center gap-1">
                <Info className="w-3 h-3" /> OT Note
              </span>
            )}
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{control.category}</span>
            {!isInScope && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">Above target ML</span>
            )}
          </div>
          {control.otNote && (
            <p className="text-xs text-orange-700 mt-1.5 bg-orange-50 px-2 py-1.5 rounded">{control.otNote}</p>
          )}
        </div>
        <div className="flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && isInScope && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100 bg-white"
          >
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Assessment Status</label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(COMPLIANCE_STATUS).map(s => (
                    <button
                      key={s.id}
                      onClick={() => onUpdate(control.id, { status: s.id })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
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
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Evidence</label>
                  <textarea
                    value={localEvidence}
                    onChange={e => setLocalEvidence(e.target.value)}
                    placeholder="Tool, configuration, policy reference..."
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Notes</label>
                  <textarea
                    value={localNotes}
                    onChange={e => setLocalNotes(e.target.value)}
                    placeholder="Implementation notes, exceptions, OT-specific considerations..."
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Assigned To</label>
                  <input
                    type="text"
                    value={localAssignee}
                    onChange={e => setLocalAssignee(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Target Date</label>
                  <input
                    type="date"
                    value={localDate}
                    onChange={e => setLocalDate(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
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

export default function ASDFortifyPage() {
  const { state, dispatch, getFrameworkScore, getAsdStrategyScore } = useCompliance();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showOnlyOT, setShowOnlyOT] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const score = getFrameworkScore('ASD_FORTIFY');
  const targetML = state.asdTargetMaturity;
  const targetIndex = MATURITY_ORDER.indexOf(targetML);

  function updateAssessment(controlId, updates) {
    dispatch({ type: 'UPDATE_ASSESSMENT', payload: { controlId, updates } });
  }

  function setTargetMaturity(ml) {
    dispatch({ type: 'SET_ASD_TARGET_MATURITY', payload: ml });
  }

  const categories = ['ALL', 'Essential Eight', 'OT/ICS Specific'];
  const displayStrategies = ASD_FORTIFY_STRATEGIES.filter(s => {
    if (activeCategory !== 'ALL' && s.category !== activeCategory) return false;
    return true;
  });

  function isInScope(control) {
    const ctrlIndex = MATURITY_ORDER.indexOf(control.maturityLevel);
    return ctrlIndex <= targetIndex;
  }

  function matchesFilter(control, assessment) {
    if (showOnlyOT && !control.otApplicable) return false;
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
          <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ASD Fortify Tracker</h1>
            <p className="text-sm text-gray-500">Essential Eight Maturity Model + OT/ICS Hardening Strategies</p>
          </div>
        </div>

        {/* Target maturity selector */}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-sm font-semibold text-gray-600">Target Maturity Level:</span>
          {MATURITY_ORDER.map(ml => {
            const info = ASD_MATURITY_LEVELS[ml];
            return (
              <button
                key={ml}
                onClick={() => setTargetMaturity(ml)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border-2 ${
                  targetML === ml ? 'border-current shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
                style={targetML === ml ? { backgroundColor: info.bgColor, color: info.color, borderColor: info.color } : {}}
                title={info.description}
              >
                {ml}
              </button>
            );
          })}
        </div>
        <p className="text-sm text-gray-500 mt-2">{ASD_MATURITY_LEVELS[targetML]?.description}</p>
      </motion.div>

      {/* AI Assistant */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <ComplianceAI
          framework="ASD_FORTIFY"
          organisationContext={{ organisationName: state.organisation?.name, sector: state.organisation?.sector }}
        />
      </motion.div>

      {/* Score */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Overall ASD Fortify Compliance (Target: {targetML})</h3>
          <span className="text-2xl font-bold text-green-600">{score.score}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score.score}%` }}
            transition={{ duration: 1 }}
            className="h-3 rounded-full bg-gradient-to-r from-green-400 to-green-600"
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

      {/* Category tabs + filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-2">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeCategory === c ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="text-sm outline-none w-40"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
          >
            <option value="ALL">All Statuses</option>
            {Object.values(COMPLIANCE_STATUS).map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={showOnlyOT} onChange={e => setShowOnlyOT(e.target.checked)} className="rounded" />
            OT only
          </label>
        </div>
      </div>

      {/* Strategies */}
      <div className="space-y-6">
        {displayStrategies.map(strategy => {
          const strategyScore = getAsdStrategyScore(strategy.id);
          const visibleControls = strategy.controls.filter(c => matchesFilter(c, state.assessments[c.id]));
          if (visibleControls.length === 0) return null;
          return (
            <motion.div key={strategy.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 mb-3 p-4 rounded-xl" style={{ backgroundColor: strategy.bgColor }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: strategy.color }}>
                  {strategy.id.startsWith('E8') ? strategy.id.replace('E8-', 'E8\n') : 'OT'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-gray-900">{strategy.name}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${strategy.category === 'Essential Eight' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
                      {strategy.category}
                    </span>
                    {(strategy.otRelevance === 'critical' || strategy.otRelevance === 'high') && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                        OT {strategy.otRelevance === 'critical' ? 'Critical' : 'High'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{strategy.description}</p>
                  {strategy.otNotes && (
                    <p className="text-xs text-teal-700 mt-1 line-clamp-1">🏭 {strategy.otNotes}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-bold" style={{ color: strategy.color }}>{strategyScore.score}%</p>
                  <p className="text-xs text-gray-500">{strategyScore.compliant}/{strategyScore.total} ✓</p>
                </div>
              </div>

              {/* Progress bar for this strategy */}
              <div className="px-2 mb-3">
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${strategyScore.score}%`, backgroundColor: strategy.color }}
                  />
                </div>
              </div>

              <div className="space-y-2 pl-2">
                {visibleControls.map(ctrl => (
                  <ControlRow
                    key={ctrl.id}
                    control={ctrl}
                    assessment={state.assessments[ctrl.id]}
                    onUpdate={updateAssessment}
                    isInScope={isInScope(ctrl)}
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
