import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from 'recharts';
import {
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  AlertOctagon,
  ChevronRight,
  Building2,
  BarChart3,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
} from 'lucide-react';
import { useThreatContext, STRIDE_CATEGORIES, RISK_LEVELS } from '../context/ThreatContext';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Weighted risk score: CRITICAL=10, HIGH=6, MEDIUM=3, LOW=1, MINIMAL=0.5 */
const RISK_WEIGHTS = { CRITICAL: 10, HIGH: 6, MEDIUM: 3, LOW: 1, MINIMAL: 0.5 };

function riskGrade(score) {
  if (score >= 7)  return { label: 'Critical', color: '#991b1b', bg: '#fee2e2' };
  if (score >= 5)  return { label: 'High',     color: '#c2410c', bg: '#ffedd5' };
  if (score >= 3)  return { label: 'Medium',   color: '#a16207', bg: '#fef3c7' };
  if (score >= 1)  return { label: 'Low',      color: '#15803d', bg: '#dcfce7' };
  return                   { label: 'Minimal',  color: '#0369a1', bg: '#e0f2fe' };
}

const anim = {
  container: { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } },
  item:      { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } },
};

// ── Component ────────────────────────────────────────────────────────────────

export default function ExecutiveView() {
  const {
    state,
    getRiskStats,
    getControlStats,
    getMitigationProgress,
    isThreatMitigated,
  } = useThreatContext();

  // ── Organisation-wide metrics ────────────────────────────────────────────
  const orgMetrics = useMemo(() => {
    const threats  = state.threats;
    const controls = state.controls;
    const projects = state.projects;

    // Aggregate risk counts
    const riskCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, MINIMAL: 0 };
    threats.forEach(t => { if (riskCounts[t.riskLevel] !== undefined) riskCounts[t.riskLevel]++; });

    // Inherent risk = weighted average across all threats
    const totalThreats = threats.length;
    const inherentScore = totalThreats > 0
      ? threats.reduce((sum, t) => sum + (RISK_WEIGHTS[t.riskLevel] || 0), 0) / totalThreats
      : 0;

    // Unmitigated threats (only custom controls count)
    const unmitigated = threats.filter(t => !isThreatMitigated(t.id));
    const residualScore = unmitigated.length > 0
      ? unmitigated.reduce((sum, t) => sum + (RISK_WEIGHTS[t.riskLevel] || 0), 0) / totalThreats
      : 0;

    const mitigatedCount = totalThreats - unmitigated.length;
    const mitigationPct  = totalThreats > 0 ? Math.round((mitigatedCount / totalThreats) * 100) : 0;
    const riskReduction  = inherentScore > 0 ? Math.round(((inherentScore - residualScore) / inherentScore) * 100) : 0;

    // Control stats
    const implemented = controls.filter(c => c.status === 'IMPLEMENTED' || c.status === 'VERIFIED').length;
    const customControls = controls.filter(c => !c.aiGenerated).length;

    return {
      totalProjects: projects.length,
      totalThreats,
      totalControls: controls.length,
      customControls,
      implementedControls: implemented,
      riskCounts,
      inherentScore,
      residualScore,
      inherentGrade: riskGrade(inherentScore),
      residualGrade: riskGrade(residualScore),
      mitigatedCount,
      unmitigatedCount: unmitigated.length,
      mitigationPct,
      riskReduction,
      criticalUnmitigated: unmitigated.filter(t => t.riskLevel === 'CRITICAL').length,
      highUnmitigated:     unmitigated.filter(t => t.riskLevel === 'HIGH').length,
    };
  }, [state.threats, state.controls, state.projects, isThreatMitigated]);

  // ── Per-project breakdown ────────────────────────────────────────────────
  const projectBreakdown = useMemo(() => {
    return state.projects.map(project => {
      const pThreats  = state.threats.filter(t => t.projectId === project.id);
      const pControls = state.controls.filter(c => c.projectId === project.id);
      const total     = pThreats.length;

      const inherent = total > 0
        ? pThreats.reduce((s, t) => s + (RISK_WEIGHTS[t.riskLevel] || 0), 0) / total
        : 0;

      const unmitigated = pThreats.filter(t => !isThreatMitigated(t.id));
      const residual    = unmitigated.length > 0
        ? unmitigated.reduce((s, t) => s + (RISK_WEIGHTS[t.riskLevel] || 0), 0) / total
        : 0;

      const riskStats    = getRiskStats(project.id);
      const controlStats = getControlStats(project.id);
      const progress     = getMitigationProgress(project.id);

      return {
        id:           project.id,
        name:         project.name,
        status:       project.status,
        threats:      total,
        critical:     riskStats.critical,
        high:         riskStats.high,
        controls:     pControls.length,
        implemented:  controlStats.implemented + controlStats.verified,
        inherent:     Math.round(inherent * 10) / 10,
        residual:     Math.round(residual * 10) / 10,
        inherentGrade: riskGrade(inherent),
        residualGrade: riskGrade(residual),
        progress,
        reduction:    inherent > 0 ? Math.round(((inherent - residual) / inherent) * 100) : 0,
      };
    }).sort((a, b) => b.residual - a.residual); // highest risk first
  }, [state.projects, state.threats, state.controls, getRiskStats, getControlStats, getMitigationProgress, isThreatMitigated]);

  // ── Chart data ───────────────────────────────────────────────────────────
  const riskPieData = [
    { name: 'Critical', value: orgMetrics.riskCounts.CRITICAL, color: RISK_LEVELS.CRITICAL.color },
    { name: 'High',     value: orgMetrics.riskCounts.HIGH,     color: RISK_LEVELS.HIGH.color },
    { name: 'Medium',   value: orgMetrics.riskCounts.MEDIUM,   color: RISK_LEVELS.MEDIUM.color },
    { name: 'Low',      value: orgMetrics.riskCounts.LOW,      color: RISK_LEVELS.LOW.color },
    { name: 'Minimal',  value: orgMetrics.riskCounts.MINIMAL,  color: RISK_LEVELS.MINIMAL.color },
  ].filter(d => d.value > 0);

  const projectBarData = projectBreakdown.map(p => ({
    name:     p.name.length > 18 ? p.name.substring(0, 18) + '...' : p.name,
    inherent: p.inherent,
    residual: p.residual,
  }));

  const strideRadarData = Object.entries(STRIDE_CATEGORIES).map(([key, cat]) => {
    const total      = state.threats.filter(t => t.strideCategory === key).length;
    const mitigated  = state.threats.filter(t => t.strideCategory === key && isThreatMitigated(t.id)).length;
    return { category: key, fullName: cat.name, total, mitigated };
  });

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Executive View</h1>
            <p className="text-gray-500">Organisation risk posture &amp; impact assessment</p>
          </div>
        </div>
      </motion.div>

      {/* ── Risk Score Cards ──────────────────────────────────────────────── */}
      <motion.div variants={anim.container} initial="hidden" animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {/* Inherent Risk */}
        <motion.div variants={anim.item} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-gray-600">Inherent Risk</span>
            </div>
            <span className="badge text-xs" style={{ backgroundColor: orgMetrics.inherentGrade.bg, color: orgMetrics.inherentGrade.color }}>
              {orgMetrics.inherentGrade.label}
            </span>
          </div>
          <p className="text-4xl font-bold" style={{ color: orgMetrics.inherentGrade.color }}>
            {Math.round(orgMetrics.inherentScore * 10) / 10}
          </p>
          <p className="text-xs text-gray-400 mt-1">Weighted score before controls</p>
        </motion.div>

        {/* Residual Risk */}
        <motion.div variants={anim.item} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-600">Residual Risk</span>
            </div>
            <span className="badge text-xs" style={{ backgroundColor: orgMetrics.residualGrade.bg, color: orgMetrics.residualGrade.color }}>
              {orgMetrics.residualGrade.label}
            </span>
          </div>
          <p className="text-4xl font-bold" style={{ color: orgMetrics.residualGrade.color }}>
            {Math.round(orgMetrics.residualScore * 10) / 10}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {orgMetrics.riskReduction > 0 ? (
              <>
                <ArrowDownRight className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-green-600">{orgMetrics.riskReduction}% reduction from controls</span>
              </>
            ) : (
              <span className="text-xs text-gray-400">After implemented controls</span>
            )}
          </div>
        </motion.div>

        {/* Mitigation Coverage */}
        <motion.div variants={anim.item} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-600">Mitigation Coverage</span>
          </div>
          <p className="text-4xl font-bold text-blue-600">{orgMetrics.mitigationPct}%</p>
          <p className="text-xs text-gray-400 mt-1">
            {orgMetrics.mitigatedCount} of {orgMetrics.totalThreats} threats mitigated
          </p>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${orgMetrics.mitigationPct}%` }}
              transition={{ duration: 1 }}
              className={`h-full rounded-full ${
                orgMetrics.mitigationPct >= 70 ? 'bg-green-500' :
                orgMetrics.mitigationPct >= 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
            />
          </div>
        </motion.div>

        {/* Attention Required */}
        <motion.div variants={anim.item} className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertOctagon className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-red-700">Requires Attention</span>
          </div>
          <p className="text-4xl font-bold text-red-700">{orgMetrics.criticalUnmitigated + orgMetrics.highUnmitigated}</p>
          <p className="text-xs text-red-500 mt-1">
            {orgMetrics.criticalUnmitigated} critical, {orgMetrics.highUnmitigated} high — unmitigated
          </p>
        </motion.div>
      </motion.div>

      {/* ── Charts Row ────────────────────────────────────────────────────── */}
      <motion.div variants={anim.container} initial="hidden" animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
      >
        {/* Risk Distribution */}
        <motion.div variants={anim.item} className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Threat Risk Distribution</h3>
          {riskPieData.length > 0 ? (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={riskPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {riskPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {riskPieData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-xs text-gray-600">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-400">No threats recorded</div>
          )}
        </motion.div>

        {/* Inherent vs Residual by Project */}
        <motion.div variants={anim.item} className="card">
          <h3 className="font-semibold text-gray-900 mb-1">Inherent vs Residual Risk</h3>
          <p className="text-xs text-gray-400 mb-4">Per project — lower residual is better</p>
          {projectBarData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectBarData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} domain={[0, 10]} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="inherent" name="Inherent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="residual" name="Residual" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-400">No projects</div>
          )}
        </motion.div>

        {/* STRIDE Radar: total vs mitigated */}
        <motion.div variants={anim.item} className="card">
          <h3 className="font-semibold text-gray-900 mb-1">STRIDE Coverage</h3>
          <p className="text-xs text-gray-400 mb-4">Total threats vs mitigated per category</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={strideRadarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="category" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <PolarRadiusAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Radar name="Total" dataKey="total" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
                <Radar name="Mitigated" dataKey="mitigated" stroke="#22c55e" fill="#22c55e" fillOpacity={0.25} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Project Risk Table ────────────────────────────────────────────── */}
      <motion.div variants={anim.container} initial="hidden" animate="show" className="card mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-900">Project Risk Impact Assessment</h3>
            <p className="text-xs text-gray-400 mt-0.5">Sorted by residual risk — highest risk projects first</p>
          </div>
          <Link to="/projects" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            All Projects <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {projectBreakdown.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Project</th>
                  <th className="text-center py-3 px-3 font-semibold text-gray-600">Threats</th>
                  <th className="text-center py-3 px-3 font-semibold text-gray-600">Critical / High</th>
                  <th className="text-center py-3 px-3 font-semibold text-gray-600">Controls</th>
                  <th className="text-center py-3 px-3 font-semibold text-gray-600">Inherent Risk</th>
                  <th className="text-center py-3 px-3 font-semibold text-gray-600">Residual Risk</th>
                  <th className="text-center py-3 px-3 font-semibold text-gray-600">Reduction</th>
                  <th className="text-center py-3 px-3 font-semibold text-gray-600">Mitigation</th>
                </tr>
              </thead>
              <tbody>
                {projectBreakdown.map((p, i) => (
                  <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="py-3 px-4">
                      <Link to={`/projects/${p.id}`} className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                        {p.name}
                      </Link>
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-gray-700">{p.threats}</td>
                    <td className="py-3 px-3 text-center">
                      {p.critical > 0 && <span className="inline-block px-1.5 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 mr-1">{p.critical}C</span>}
                      {p.high > 0 && <span className="inline-block px-1.5 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700">{p.high}H</span>}
                      {p.critical === 0 && p.high === 0 && <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-gray-700">{p.implemented}</span>
                      <span className="text-gray-400">/{p.controls}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-bold" style={{ backgroundColor: p.inherentGrade.bg, color: p.inherentGrade.color }}>
                        {p.inherent}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-bold" style={{ backgroundColor: p.residualGrade.bg, color: p.residualGrade.color }}>
                        {p.residual}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {p.reduction > 0 ? (
                        <span className="flex items-center justify-center gap-0.5 text-green-600 text-xs font-semibold">
                          <ArrowDownRight className="w-3.5 h-3.5" />{p.reduction}%
                        </span>
                      ) : p.threats > 0 ? (
                        <span className="flex items-center justify-center gap-0.5 text-gray-400 text-xs">
                          <Minus className="w-3.5 h-3.5" />0%
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              p.progress >= 70 ? 'bg-green-500' : p.progress >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600 w-8 text-right">{p.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No projects to assess</p>
          </div>
        )}
      </motion.div>

      {/* ── Key Risk Indicators ───────────────────────────────────────────── */}
      <motion.div variants={anim.container} initial="hidden" animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={anim.item} className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Attack Surface</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{orgMetrics.totalThreats}</p>
          <p className="text-xs text-gray-400 mt-0.5">identified threats across {orgMetrics.totalProjects} projects</p>
        </motion.div>

        <motion.div variants={anim.item} className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Control Effectiveness</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {orgMetrics.totalControls > 0
              ? Math.round((orgMetrics.implementedControls / orgMetrics.totalControls) * 100)
              : 0}%
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {orgMetrics.implementedControls} of {orgMetrics.totalControls} controls implemented or verified
          </p>
        </motion.div>

        <motion.div variants={anim.item} className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Custom Controls</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{orgMetrics.customControls}</p>
          <p className="text-xs text-gray-400 mt-0.5">user-defined mitigations (excl. AI-generated)</p>
        </motion.div>

        <motion.div variants={anim.item} className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Risk Reduction</span>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-gray-900">{orgMetrics.riskReduction}%</p>
            {orgMetrics.riskReduction > 0 ? (
              <TrendingDown className="w-5 h-5 text-green-500" />
            ) : (
              <TrendingUp className="w-5 h-5 text-red-400" />
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">inherent to residual risk reduction</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
