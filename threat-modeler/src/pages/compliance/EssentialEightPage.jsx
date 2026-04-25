import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import {
  ChevronDown, ChevronUp, Save, Search, Info, CheckCircle2,
  AlertTriangle, Clock, TrendingUp,
} from 'lucide-react';
import { useCompliance } from '../../context/ComplianceContext';
import { E8_STRATEGIES, E8_MATURITY_LEVELS, computeAchievedMaturity } from '../../data/essentialEight';
import { COMPLIANCE_STATUS } from '../../data/aescsf';
import ComplianceAI, { ControlGuidanceButton } from '../../components/ComplianceAI';

const ML_ORDER = ['ML1', 'ML2', 'ML3'];

// ── Maturity badge ────────────────────────────────────────────────────────────
function MaturityBadge({ level, size = 'sm' }) {
  const ml = E8_MATURITY_LEVELS[level] || E8_MATURITY_LEVELS.ML0;
  return (
    <span
      className={`inline-flex items-center font-bold rounded px-2 py-0.5 ${size === 'lg' ? 'text-base' : 'text-xs'}`}
      style={{ backgroundColor: ml.bgColor, color: ml.color }}
    >
      {level}
    </span>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = COMPLIANCE_STATUS[status] || COMPLIANCE_STATUS.NOT_ASSESSED;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: s.bgColor, color: s.color }}>
      {s.icon} {s.label}
    </span>
  );
}

// ── Mini gauge showing achieved vs target ─────────────────────────────────────
function MaturityGauge({ achieved, target, color }) {
  const levels = ['ML0', 'ML1', 'ML2', 'ML3'];
  return (
    <div className="flex items-center gap-1">
      {['ML1', 'ML2', 'ML3'].map(ml => {
        const achievedIdx = levels.indexOf(achieved);
        const mlIdx = levels.indexOf(ml);
        const targetIdx = levels.indexOf(target);
        const filled = achievedIdx >= mlIdx;
        const inTarget = mlIdx <= targetIdx;
        return (
          <div
            key={ml}
            title={`${ml}: ${filled ? 'Achieved' : 'Not achieved'}${!inTarget ? ' (above target)' : ''}`}
            className={`h-2 w-8 rounded-full transition-all ${!inTarget ? 'opacity-30' : ''}`}
            style={{ backgroundColor: filled ? color : '#e5e7eb' }}
          />
        );
      })}
    </div>
  );
}

// ── Individual control row ─────────────────────────────────────────────────────
function ControlRow({ control, assessment, onUpdate, isInScope }) {
  const [expanded, setExpanded] = useState(false);
  const [localNotes, setLocalNotes] = useState(assessment?.notes || '');
  const [localEvidence, setLocalEvidence] = useState(assessment?.evidence || '');
  const [localAssignee, setLocalAssignee] = useState(assessment?.assignee || '');
  const [localDate, setLocalDate] = useState(assessment?.targetDate || '');
  const ml = E8_MATURITY_LEVELS[control.maturity];
  const currentStatus = assessment?.status || 'NOT_ASSESSED';

  function handleSave() {
    onUpdate(control.id, { notes: localNotes, evidence: localEvidence, assignee: localAssignee, targetDate: localDate });
    setExpanded(false);
  }

  return (
    <div className={`border rounded-xl overflow-hidden ${!isInScope ? 'opacity-40' : ''}`}>
      <div
        className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${expanded ? 'bg-gray-50' : 'bg-white'}`}
        onClick={() => setExpanded(!expanded)}
      >
        <MaturityBadge level={control.maturity} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 leading-relaxed">{control.description}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusBadge status={currentStatus} />
            {!isInScope && <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-500">Above target</span>}
          </div>
          {control.guidance && (
            <p className="text-xs text-blue-700 mt-1.5 bg-blue-50 px-2 py-1.5 rounded flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{control.guidance}</span>
            </p>
          )}
        </div>
        <div className="flex-shrink-0 flex items-center">
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
              {/* Test method */}
              {control.testMethod && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm">
                  <p className="font-semibold text-amber-800 mb-1">🧪 How to Test</p>
                  <p className="text-amber-900">{control.testMethod}</p>
                </div>
              )}

              {/* Status selector */}
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
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Evidence / Documentation</label>
                  <textarea
                    value={localEvidence}
                    onChange={e => setLocalEvidence(e.target.value)}
                    placeholder="Policy ref, tool name, screenshot path, audit finding..."
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Notes</label>
                  <textarea
                    value={localNotes}
                    onChange={e => setLocalNotes(e.target.value)}
                    placeholder="Exceptions, remediation steps, risk acceptance..."
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Assigned To</label>
                  <input type="text" value={localAssignee} onChange={e => setLocalAssignee(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Target Date</label>
                  <input type="date" value={localDate} onChange={e => setLocalDate(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>

              <ControlGuidanceButton controlId={control.id} />

              {assessment?.lastUpdated && (
                <p className="text-xs text-gray-400">Last updated: {new Date(assessment.lastUpdated).toLocaleString()}</p>
              )}

              <div className="flex justify-end gap-2">
                <button onClick={() => setExpanded(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                <button onClick={handleSave}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
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

// ── Per-strategy card ─────────────────────────────────────────────────────────
function StrategyCard({ strategy, assessments, onUpdate, targetML }) {
  const [open, setOpen] = useState(false);
  const [activeMl, setActiveMl] = useState('ALL');
  const targetIndex = ML_ORDER.indexOf(targetML);

  // Counts per maturity level within scope
  const mlStats = ML_ORDER.map(ml => {
    const ctrls = strategy.controls.filter(c => c.maturity === ml);
    const compliant = ctrls.filter(c => assessments[c.id]?.status === 'COMPLIANT').length;
    const partial = ctrls.filter(c => assessments[c.id]?.status === 'PARTIALLY_COMPLIANT').length;
    const notAssessed = ctrls.filter(c => assessments[c.id]?.status === 'NOT_ASSESSED').length;
    const nonCompliant = ctrls.filter(c => assessments[c.id]?.status === 'NON_COMPLIANT').length;
    return { ml, total: ctrls.length, compliant, partial, notAssessed, nonCompliant };
  });

  const achievedML = computeAchievedMaturity(strategy, assessments);
  const achievedIndex = ['ML0', ...ML_ORDER].indexOf(achievedML);
  const achievedInfo = E8_MATURITY_LEVELS[achievedML] || E8_MATURITY_LEVELS.ML0;

  const inScopeControls = strategy.controls.filter(c => ML_ORDER.indexOf(c.maturity) <= targetIndex);
  const compliantInScope = inScopeControls.filter(c => assessments[c.id]?.status === 'COMPLIANT').length;
  const partialInScope = inScopeControls.filter(c => assessments[c.id]?.status === 'PARTIALLY_COMPLIANT').length;
  const scoreNum = inScopeControls.length > 0 ? Math.round(((compliantInScope + partialInScope * 0.5) / inScopeControls.length) * 100) : 0;

  const visibleControls = strategy.controls.filter(c => {
    const inScope = ML_ORDER.indexOf(c.maturity) <= targetIndex;
    if (activeMl !== 'ALL' && c.maturity !== activeMl) return false;
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm"
    >
      {/* Strategy header */}
      <div
        className="flex items-start gap-4 p-5 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {/* Number badge */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl font-black text-white shadow"
          style={{ backgroundColor: strategy.color }}
        >
          {strategy.number}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900 text-base">{strategy.name}</h3>
            <span className="text-lg">{strategy.icon}</span>
          </div>
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{strategy.objective}</p>

          {/* Maturity progress bar */}
          <div className="flex items-center gap-3">
            <MaturityGauge achieved={achievedML} target={targetML} color={strategy.color} />
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Achieved:</span>
              <MaturityBadge level={achievedML} />
              <span className="text-xs text-gray-400">→ Target:</span>
              <MaturityBadge level={targetML} />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="text-2xl font-bold" style={{ color: strategy.color }}>{scoreNum}%</span>
          <span className="text-xs text-gray-400">{compliantInScope}/{inScopeControls.length} in scope</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Maturity level summary pills */}
      <div className="px-5 pb-3 flex flex-wrap gap-2">
        {mlStats.map(({ ml, total, compliant, notAssessed, nonCompliant }) => {
          const mlInfo = E8_MATURITY_LEVELS[ml];
          const inScope = ML_ORDER.indexOf(ml) <= targetIndex;
          return (
            <div
              key={ml}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border ${!inScope ? 'opacity-40' : ''}`}
              style={{ backgroundColor: mlInfo.bgColor, borderColor: mlInfo.color + '40' }}
            >
              <span className="font-bold" style={{ color: mlInfo.color }}>{ml}</span>
              <span className="text-gray-600">{compliant}/{total}</span>
              {nonCompliant > 0 && <span className="text-red-500">⚠ {nonCompliant}</span>}
              {notAssessed > 0 && <span className="text-gray-400">○ {notAssessed}</span>}
            </div>
          );
        })}
      </div>

      {/* Expanded controls */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-gray-100"
          >
            {/* Objective + filter */}
            <div className="p-4 bg-gray-50 space-y-3">
              <p className="text-sm text-gray-700"><span className="font-semibold">Why this matters:</span> {strategy.why}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveMl('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${activeMl === 'ALL' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                >
                  All ({strategy.controls.length})
                </button>
                {ML_ORDER.map(ml => {
                  const mlInfo = E8_MATURITY_LEVELS[ml];
                  const count = strategy.controls.filter(c => c.maturity === ml).length;
                  const inScope = ML_ORDER.indexOf(ml) <= targetIndex;
                  return (
                    <button
                      key={ml}
                      onClick={() => setActiveMl(activeMl === ml ? 'ALL' : ml)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border-2 ${!inScope ? 'opacity-40' : ''} ${activeMl === ml ? 'shadow-sm' : 'border-transparent'}`}
                      style={activeMl === ml ? { backgroundColor: mlInfo.bgColor, color: mlInfo.color, borderColor: mlInfo.color } : { backgroundColor: mlInfo.bgColor + '60', color: mlInfo.color }}
                    >
                      {ml} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 space-y-2">
              {visibleControls.map(ctrl => (
                <ControlRow
                  key={ctrl.id}
                  control={ctrl}
                  assessment={assessments[ctrl.id]}
                  onUpdate={onUpdate}
                  isInScope={ML_ORDER.indexOf(ctrl.maturity) <= targetIndex}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function EssentialEightPage() {
  const { state, dispatch, getFrameworkScore, getE8StrategyScore } = useCompliance();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const score = getFrameworkScore('ESSENTIAL_EIGHT');
  const targetML = state.e8TargetMaturity;

  function updateAssessment(controlId, updates) {
    dispatch({ type: 'UPDATE_ASSESSMENT', payload: { controlId, updates } });
  }

  function setTargetML(ml) {
    dispatch({ type: 'SET_E8_TARGET_MATURITY', payload: ml });
  }

  // Radar data (one point per strategy)
  const radarData = E8_STRATEGIES.map(s => {
    const ss = getE8StrategyScore(s.id);
    return { strategy: `E8.${s.number}`, name: s.shortName, score: ss.score };
  });

  // Bar chart data
  const barData = E8_STRATEGIES.map(s => {
    const ss = getE8StrategyScore(s.id);
    return { name: s.shortName, score: ss.score, fill: s.color, achieved: ss.achievedMaturity };
  });

  // Summary counts
  const totalCompliant = Object.values(state.assessments)
    .filter(a => a.framework === 'ESSENTIAL_EIGHT' && a.status === 'COMPLIANT').length;
  const totalNonCompliant = Object.values(state.assessments)
    .filter(a => a.framework === 'ESSENTIAL_EIGHT' && a.status === 'NON_COMPLIANT').length;
  const totalNotAssessed = Object.values(state.assessments)
    .filter(a => a.framework === 'ESSENTIAL_EIGHT' && a.status === 'NOT_ASSESSED').length;

  // How many strategies have achieved the target ML
  const strategiesAtTarget = E8_STRATEGIES.filter(s => {
    const achieved = computeAchievedMaturity(s, state.assessments);
    const achievedIdx = ['ML0', 'ML1', 'ML2', 'ML3'].indexOf(achieved);
    const targetIdx = ['ML0', 'ML1', 'ML2', 'ML3'].indexOf(targetML);
    return achievedIdx >= targetIdx;
  }).length;

  // Filter strategies
  const displayStrategies = E8_STRATEGIES.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.shortName.toLowerCase().includes(q) ||
      s.controls.some(c => c.description.toLowerCase().includes(q));
  });

  const getScoreColor = (sc) => sc >= 80 ? '#10b981' : sc >= 60 ? '#f59e0b' : sc >= 40 ? '#f97316' : '#ef4444';

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow">
            <span className="text-xl font-black text-white">E8</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Essential Eight</h1>
            <p className="text-sm text-gray-500">ASD Essential Eight Maturity Model — Australian Signals Directorate</p>
          </div>
        </div>

        {/* Target maturity selector */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-gray-600">Target Maturity Level:</span>
          {ML_ORDER.map(ml => {
            const info = E8_MATURITY_LEVELS[ml];
            return (
              <button
                key={ml}
                onClick={() => setTargetML(ml)}
                title={info.description}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border-2 ${
                  targetML === ml ? 'shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
                style={targetML === ml ? { backgroundColor: info.bgColor, color: info.color, borderColor: info.color } : {}}
              >
                {ml}
                <span className="ml-2 hidden md:inline font-normal text-xs opacity-80">
                  – {info.description.split('.')[0]}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-sm text-gray-500 mt-2 ml-1">{E8_MATURITY_LEVELS[targetML]?.description}</p>
      </motion.div>

      {/* AI Assistant */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <ComplianceAI
          framework="ESSENTIAL_EIGHT"
          organisationContext={{ organisationName: state.organisation?.name, sector: state.organisation?.sector }}
        />
      </motion.div>

      {/* Score card */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Overall Essential Eight Compliance (Target: {targetML})</h3>
          <span className="text-2xl font-bold" style={{ color: getScoreColor(score.score) }}>{score.score}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score.score}%` }}
            transition={{ duration: 1 }}
            className="h-3 rounded-full"
            style={{ background: `linear-gradient(to right, ${getScoreColor(score.score)}99, ${getScoreColor(score.score)})` }}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-sm">
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-lg font-bold text-green-600">{strategiesAtTarget}/8</p>
            <p className="text-xs text-gray-500">Strategies at {targetML}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-lg font-bold text-green-600">{score.compliant}</p>
            <p className="text-xs text-gray-500">Controls Compliant</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-lg font-bold text-red-500">{totalNonCompliant}</p>
            <p className="text-xs text-gray-500">Non-Compliant</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-lg font-bold text-gray-500">{totalNotAssessed}</p>
            <p className="text-xs text-gray-500">Not Assessed</p>
          </div>
        </div>
      </motion.div>

      {/* Charts */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Radar */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Strategy Coverage (Radar)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="strategy" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 9 }} />
                <Radar name="Score" dataKey="score" stroke="#f97316" fill="#f97316" fillOpacity={0.25} />
                <Tooltip formatter={(v, n, p) => [`${v}%`, p.payload.name]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Horizontal bar per strategy */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Score by Strategy</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fill: '#374151', fontSize: 10 }} />
                <Tooltip
                  formatter={(v, n, p) => [`${v}%`, p.payload.name]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Strategy overview grid */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {E8_STRATEGIES.map(s => {
          const ss = getE8StrategyScore(s.id);
          const achieved = ss.achievedMaturity;
          const achievedInfo = E8_MATURITY_LEVELS[achieved] || E8_MATURITY_LEVELS.ML0;
          const atTarget = ['ML0', ...ML_ORDER].indexOf(achieved) >= ['ML0', ...ML_ORDER].indexOf(targetML);
          return (
            <div
              key={s.id}
              className="rounded-xl border p-3 cursor-pointer hover:shadow-md transition-shadow"
              style={{ borderColor: s.color + '40', backgroundColor: s.bgColor }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black" style={{ color: s.color }}>{s.number}.</span>
                  <span className="text-xs font-bold text-gray-700">{s.shortName}</span>
                </div>
                <span className="text-lg">{s.icon}</span>
              </div>
              <div className="flex items-center justify-between">
                <MaturityGauge achieved={achieved} target={targetML} color={s.color} />
                <span className="text-sm font-bold" style={{ color: s.color }}>{ss.score}%</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1">
                {atTarget
                  ? <CheckCircle2 className="w-3 h-3 text-green-500" />
                  : <AlertTriangle className="w-3 h-3 text-orange-400" />}
                <span className="text-xs" style={{ color: achievedInfo.color }}>{achieved} achieved</span>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search strategies or controls..."
            className="text-sm outline-none w-full"
          />
        </div>
        <p className="text-sm text-gray-500">
          {displayStrategies.length} of 8 strategies shown
        </p>
      </div>

      {/* Strategy cards */}
      <div className="space-y-4">
        {displayStrategies.map(strategy => (
          <StrategyCard
            key={strategy.id}
            strategy={strategy}
            assessments={state.assessments}
            onUpdate={updateAssessment}
            targetML={targetML}
          />
        ))}
      </div>
    </div>
  );
}
