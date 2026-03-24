import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, Search, Filter, Download,
  Shield, AlertTriangle, CheckCircle2, ArrowRight, Info,
} from 'lucide-react';
import { STRIDE_CATEGORIES } from '../context/ThreatContext';

const RISK_COLORS = {
  CRITICAL: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  HIGH:     { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' },
  MEDIUM:   { bg: '#fef3c7', text: '#a16207', border: '#fcd34d' },
  LOW:      { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  MINIMAL:  { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' },
};

function RiskBadge({ level }) {
  const c = RISK_COLORS[level] || RISK_COLORS.LOW;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {level}
    </span>
  );
}

function StrideBadge({ category }) {
  const cat = STRIDE_CATEGORIES[category];
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold flex-shrink-0"
      style={{ background: cat?.color || '#6b7280' }} title={cat?.name}>
      {category}
    </span>
  );
}

function ScoreBar({ score, max = 25, color }) {
  const pct = Math.min((score / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold tabular-nums" style={{ color }}>{score}</span>
    </div>
  );
}

function ControlItem({ ctrl, index }) {
  const effortColor = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22c55e' }[ctrl.effort] || '#6b7280';
  const effectColor = { HIGH: '#16a34a', MEDIUM: '#ca8a04', LOW: '#dc2626' }[ctrl.effectiveness] || '#6b7280';
  return (
    <div className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-800">{ctrl.name}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{ctrl.type}</span>
          <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: `${effectColor}15`, color: effectColor }}>
            {ctrl.effectiveness} effectiveness
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: `${effortColor}15`, color: effortColor }}>
            {ctrl.effort} effort
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{ctrl.description}</p>
      </div>
    </div>
  );
}

function ThreatRow({ threat, index, projectId, onApply, applied }) {
  const [expanded, setExpanded] = useState(false);
  const riskC = RISK_COLORS[threat.riskLevel] || RISK_COLORS.LOW;
  const residualC = RISK_COLORS[threat.residualRiskLevel] || RISK_COLORS.LOW;

  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-4 py-3 text-center">
          <span className="text-sm font-medium text-gray-400">{index + 1}</span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <StrideBadge category={threat.strideCategory} />
            <div>
              <p className="text-sm font-semibold text-gray-800 leading-tight">{threat.name}</p>
              {threat.affectedComponents?.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                  {threat.affectedComponents.join(', ')}
                </p>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3 max-w-xs">
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{threat.description}</p>
        </td>
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-500 font-mono">
            <span title="Likelihood">{threat.likelihood}</span>
            <span className="text-gray-300">×</span>
            <span title="Impact">{threat.impact}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="space-y-1 min-w-[120px]">
            <RiskBadge level={threat.riskLevel} />
            <ScoreBar score={threat.riskScore} color={riskC.text} />
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
            <div className="space-y-1">
              <RiskBadge level={threat.residualRiskLevel} />
              <ScoreBar score={threat.residualRiskScore} color={residualC.text} />
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          <button
            onClick={(e) => { e.stopPropagation(); onApply(threat); }}
            disabled={applied}
            title={applied ? 'Already added to project' : 'Add to project threats'}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
              applied
                ? 'bg-green-100 text-green-700 cursor-not-allowed'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            {applied ? <CheckCircle2 className="w-3.5 h-3.5 inline" /> : '+ Add'}
          </button>
        </td>
        <td className="px-4 py-3 text-center">
          <div className="text-gray-400 hover:text-gray-600">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </td>
      </tr>

      {/* Expanded detail row */}
      <AnimatePresence>
        {expanded && (
          <tr key="expanded">
            <td colSpan={8} className="p-0">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 grid grid-cols-3 gap-6">
                  {/* Rationale */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Info className="w-3 h-3" /> Risk Rationale
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{threat.rationale}</p>
                  </div>

                  {/* Recommended controls */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Recommended Controls ({threat.recommendations?.length || 0})
                    </h4>
                    <div>
                      {threat.recommendations?.map((ctrl, i) => (
                        <ControlItem key={i} ctrl={ctrl} index={i} />
                      ))}
                    </div>
                  </div>

                  {/* Residual risk */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Residual Risk
                    </h4>
                    <div className="flex items-center gap-2 mb-2">
                      <RiskBadge level={threat.riskLevel} />
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <RiskBadge level={threat.residualRiskLevel} />
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{threat.residualRationale}</p>
                    <div className="mt-2 p-2 rounded-lg bg-gray-100 text-xs text-gray-500">
                      Risk reduction: <span className="font-bold text-green-600">
                        {Math.round((1 - threat.residualRiskScore / threat.riskScore) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

export default function AIThreatTable({ threats = [], appliedIds = new Set(), onApplyThreat, onApplyAll }) {
  const [search, setSearch]           = useState('');
  const [filterStride, setFilterStride] = useState('');
  const [filterRisk, setFilterRisk]   = useState('');
  const [sortKey, setSortKey]         = useState('riskScore');
  const [sortDir, setSortDir]         = useState('desc');

  const filtered = useMemo(() => {
    let rows = [...threats];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    if (filterStride) rows = rows.filter(t => t.strideCategory === filterStride);
    if (filterRisk)   rows = rows.filter(t => t.riskLevel === filterRisk);

    rows.sort((a, b) => {
      let av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0;
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return sortDir === 'asc' ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1);
    });
    return rows;
  }, [threats, search, filterStride, filterRisk, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const exportCSV = () => {
    const headers = ['#', 'Name', 'STRIDE', 'Description', 'Likelihood', 'Impact', 'Risk Score', 'Risk Level', 'Rationale', 'Residual Risk Score', 'Residual Risk Level', 'Residual Rationale'];
    const rows = threats.map((t, i) => [
      i + 1, t.name, t.strideCategory, t.description,
      t.likelihood, t.impact, t.riskScore, t.riskLevel, t.rationale,
      t.residualRiskScore, t.residualRiskLevel, t.residualRationale,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'threat-analysis.csv'; a.click();
  };

  const SortIcon = ({ k }) => sortKey === k
    ? <span className="text-blue-600">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
    : <span className="text-gray-300"> ↕</span>;

  const unapplied = filtered.filter(t => !appliedIds.has(t.id));

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 flex-wrap flex-shrink-0">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search threats..."
            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Filter className="w-3.5 h-3.5" />
          <select value={filterStride} onChange={e => setFilterStride(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All STRIDE</option>
            {Object.entries(STRIDE_CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>{k} — {v.name}</option>
            ))}
          </select>
          <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Risk Levels</option>
            {['CRITICAL','HIGH','MEDIUM','LOW','MINIMAL'].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400">{filtered.length} threat{filtered.length !== 1 ? 's' : ''}</span>
          {onApplyAll && unapplied.length > 0 && (
            <button onClick={() => onApplyAll(unapplied)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Apply All ({unapplied.length})
            </button>
          )}
          <button onClick={exportCSV}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
            <tr>
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 w-10">#</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-800 min-w-[200px]"
                onClick={() => toggleSort('name')}>Threat <SortIcon k="name" /></th>
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500">Description</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 text-center cursor-pointer hover:text-gray-800 w-20"
                onClick={() => toggleSort('riskScore')}>L × I <SortIcon k="riskScore" /></th>
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-800 min-w-[130px]"
                onClick={() => toggleSort('riskLevel')}>Inherent Risk <SortIcon k="riskLevel" /></th>
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-800 min-w-[130px]"
                onClick={() => toggleSort('residualRiskLevel')}>Residual Risk <SortIcon k="residualRiskLevel" /></th>
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 text-center w-20">Add</th>
              <th className="px-4 py-2.5 w-8" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">No threats match your filters</td></tr>
            ) : (
              filtered.map((threat, i) => (
                <ThreatRow
                  key={threat.id}
                  threat={threat}
                  index={i}
                  applied={appliedIds.has(threat.id)}
                  onApply={onApplyThreat}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
