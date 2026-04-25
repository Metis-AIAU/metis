import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  AlertCircle, Filter, ChevronRight, AlertTriangle, Shield, FileText, Zap,
  TrendingUp, Clock, CheckCircle2, Search,
} from 'lucide-react';
import { useCompliance } from '../../context/ComplianceContext';
import { COMPLIANCE_STATUS } from '../../data/aescsf';
import ComplianceAI, { ControlGuidanceButton } from '../../components/ComplianceAI';

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const PRIORITY_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#9ca3af' };
const PRIORITY_BG = { critical: '#fef2f2', high: '#fff7ed', medium: '#fffbeb', low: '#f9fafb' };

const FRAMEWORK_LABELS = { AESCSF: 'AESCSF', SOCI: 'SOCI Act', ASD_FORTIFY: 'ASD Fortify', ESSENTIAL_EIGHT: 'Essential Eight' };
const FRAMEWORK_COLORS = { AESCSF: '#3b82f6', SOCI: '#8b5cf6', ASD_FORTIFY: '#10b981', ESSENTIAL_EIGHT: '#f97316' };
const FRAMEWORK_ICONS = { AESCSF: Shield, SOCI: FileText, ASD_FORTIFY: Zap, ESSENTIAL_EIGHT: AlertTriangle };

function GapCard({ gap, onUpdateStatus }) {
  const [expanded, setExpanded] = useState(false);
  const FIcon = FRAMEWORK_ICONS[gap.framework] || Shield;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-xl overflow-hidden bg-white"
    >
      <div className="flex items-start gap-4 p-4">
        {/* Priority indicator */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[gap.priority] }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{gap.id}</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: FRAMEWORK_COLORS[gap.framework] + '20', color: FRAMEWORK_COLORS[gap.framework] }}
            >
              {FRAMEWORK_LABELS[gap.framework]}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
              style={{ backgroundColor: PRIORITY_BG[gap.priority], color: PRIORITY_COLORS[gap.priority] }}
            >
              {gap.priority}
            </span>
            {gap.otSpecific && <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">OT</span>}
          </div>
          <p className="text-sm text-gray-800 leading-relaxed">{gap.description}</p>
          {gap.categoryName && <p className="text-xs text-gray-500 mt-1">Category: {gap.categoryName}</p>}
          {gap.assessment?.assignee && (
            <p className="text-xs text-gray-500 mt-1">Assigned: {gap.assessment.assignee}</p>
          )}
          {gap.assessment?.targetDate && (
            <p className="text-xs text-gray-500">Target: {new Date(gap.assessment.targetDate).toLocaleDateString()}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span
            className="text-xs px-2 py-1 rounded-full font-semibold"
            style={{
              backgroundColor: COMPLIANCE_STATUS[gap.assessment?.status || 'NOT_ASSESSED']?.bgColor,
              color: COMPLIANCE_STATUS[gap.assessment?.status || 'NOT_ASSESSED']?.color,
            }}
          >
            {COMPLIANCE_STATUS[gap.assessment?.status || 'NOT_ASSESSED']?.label}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            {expanded ? 'Less' : 'Actions'} <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Quick Action – Update Status</p>
            <div className="flex flex-wrap gap-2">
              {[COMPLIANCE_STATUS.PARTIALLY_COMPLIANT, COMPLIANCE_STATUS.COMPLIANT, COMPLIANCE_STATUS.NOT_APPLICABLE].map(s => (
                <button
                  key={s.id}
                  onClick={() => { onUpdateStatus(gap.id, s.id); setExpanded(false); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all hover:shadow-sm"
                  style={{ backgroundColor: s.bgColor, color: s.color, borderColor: s.color }}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>
          <ControlGuidanceButton controlId={gap.id} />
        </div>
      )}
    </motion.div>
  );
}

export default function GapAnalysis() {
  const { state, dispatch, getGaps, getFrameworkScore } = useCompliance();
  const [activeFramework, setActiveFramework] = useState('ALL');
  const [activePriority, setActivePriority] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const aescsfGaps = getGaps('AESCSF');
  const sociGaps = getGaps('SOCI');
  const asdGaps = getGaps('ASD_FORTIFY');
  const e8Gaps = getGaps('ESSENTIAL_EIGHT');

  const allGaps = useMemo(() => {
    let gaps = [...aescsfGaps, ...sociGaps, ...asdGaps, ...e8Gaps];
    if (activeFramework !== 'ALL') gaps = gaps.filter(g => g.framework === activeFramework);
    if (activePriority !== 'ALL') gaps = gaps.filter(g => g.priority === activePriority);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      gaps = gaps.filter(g => g.id.toLowerCase().includes(q) || g.description.toLowerCase().includes(q));
    }
    return gaps.sort((a, b) => (PRIORITY_ORDER[a.priority] || 3) - (PRIORITY_ORDER[b.priority] || 3));
  }, [aescsfGaps, sociGaps, asdGaps, activeFramework, activePriority, searchQuery]);

  function updateStatus(controlId, status) {
    dispatch({ type: 'UPDATE_ASSESSMENT', payload: { controlId, updates: { status } } });
  }

  // Summary stats
  const allGapsFlat = [...aescsfGaps, ...sociGaps, ...asdGaps, ...e8Gaps];
  const totalGaps = allGapsFlat.length;
  const criticalGaps = allGapsFlat.filter(g => g.priority === 'critical').length;
  const highGaps = allGapsFlat.filter(g => g.priority === 'high').length;

  // Priority distribution chart
  const priorityData = [
    { name: 'Critical', value: allGapsFlat.filter(g => g.priority === 'critical').length, fill: '#ef4444' },
    { name: 'High', value: allGapsFlat.filter(g => g.priority === 'high').length, fill: '#f97316' },
    { name: 'Medium', value: allGapsFlat.filter(g => g.priority === 'medium').length, fill: '#f59e0b' },
    { name: 'Low', value: allGapsFlat.filter(g => g.priority === 'low').length, fill: '#9ca3af' },
  ];

  // Framework gap chart
  const frameworkGapData = [
    { name: 'AESCSF', gaps: aescsfGaps.length, score: getFrameworkScore('AESCSF').score, fill: '#3b82f6' },
    { name: 'SOCI Act', gaps: sociGaps.length, score: getFrameworkScore('SOCI').score, fill: '#8b5cf6' },
    { name: 'ASD Fortify', gaps: asdGaps.length, score: getFrameworkScore('ASD_FORTIFY').score, fill: '#10b981' },
    { name: 'Essential Eight', gaps: e8Gaps.length, score: getFrameworkScore('ESSENTIAL_EIGHT').score, fill: '#f97316' },
  ];

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compliance Gap Analysis</h1>
            <p className="text-sm text-gray-500">Identify, prioritise, and remediate compliance gaps across all frameworks</p>
          </div>
        </div>
      </motion.div>

      {/* AI Assistant */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <ComplianceAI
          organisationContext={{
            organisationName: state.organisation?.name,
            sector: state.organisation?.sector,
          }}
        />
      </motion.div>

      {/* Summary stats */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="stat-icon bg-orange-100"><AlertCircle className="w-6 h-6 text-orange-600" /></div>
          <div><p className="text-sm text-gray-500">Total Gaps</p><p className="text-2xl font-bold text-gray-900">{totalGaps}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-red-100"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
          <div><p className="text-sm text-gray-500">Critical Priority</p><p className="text-2xl font-bold text-red-600">{criticalGaps}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-orange-100"><TrendingUp className="w-6 h-6 text-orange-600" /></div>
          <div><p className="text-sm text-gray-500">High Priority</p><p className="text-2xl font-bold text-orange-600">{highGaps}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-yellow-100"><Clock className="w-6 h-6 text-yellow-600" /></div>
          <div><p className="text-sm text-gray-500">Not Assessed</p>
            <p className="text-2xl font-bold text-yellow-600">
              {allGapsFlat.filter(g => g.assessment?.status === 'NOT_ASSESSED').length}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Charts */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Gaps by Priority</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Gaps by Framework</h3>
          <div className="space-y-4 mt-2">
            {frameworkGapData.map(f => (
              <div key={f.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{f.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{f.gaps} gaps</span>
                    <span className="text-sm font-semibold" style={{ color: f.fill }}>{f.score}% compliant</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className="h-2.5 rounded-full transition-all" style={{ width: `${f.score}%`, backgroundColor: f.fill }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm font-semibold text-blue-800 mb-2">Remediation Priority Order</p>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Address all Critical priority non-compliant controls first</li>
              <li>Assess all Not Assessed critical controls</li>
              <li>Address High priority non-compliant controls</li>
              <li>Complete full assessment of remaining controls</li>
            </ol>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {['ALL', 'AESCSF', 'SOCI', 'ASD_FORTIFY', 'ESSENTIAL_EIGHT'].map(f => (
            <button
              key={f}
              onClick={() => setActiveFramework(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeFramework === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'ALL' ? 'All Frameworks' : f === 'ASD_FORTIFY' ? 'ASD Fortify' : f === 'ESSENTIAL_EIGHT' ? 'Essential Eight' : f}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-2">
          {['ALL', 'critical', 'high', 'medium', 'low'].map(p => (
            <button
              key={p}
              onClick={() => setActivePriority(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                activePriority === p ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={activePriority === p && p !== 'ALL' ? { backgroundColor: PRIORITY_COLORS[p] } : activePriority === p ? { backgroundColor: '#111827' } : {}}
            >
              {p === 'ALL' ? 'All Priorities' : p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs ml-auto">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search gaps..."
            className="text-sm outline-none w-full"
          />
        </div>
      </div>

      {/* Gap list */}
      <div className="space-y-3">
        {allGaps.length > 0 ? allGaps.map(gap => (
          <GapCard key={gap.id} gap={gap} onUpdateStatus={updateStatus} />
        )) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <CheckCircle2 className="w-16 h-16 mb-3 text-green-400" />
            <p className="text-xl font-semibold text-gray-700">No gaps found</p>
            <p className="text-sm mt-1">
              {searchQuery || activePriority !== 'ALL' || activeFramework !== 'ALL'
                ? 'Try adjusting your filters'
                : 'All assessed controls are compliant or not applicable'}
            </p>
          </div>
        )}
      </div>

      {allGaps.length > 0 && (
        <p className="text-center text-sm text-gray-400 mt-4">
          Showing {allGaps.length} gap{allGaps.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
