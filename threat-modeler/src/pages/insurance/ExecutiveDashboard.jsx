import { motion } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, PieChart, Pie,
} from 'recharts';
import {
  TrendingDown, DollarSign, ShieldCheck, AlertTriangle,
  Download, Sparkles, CheckCircle2, Clock, Zap, ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInsurance, NIST_CONTROLS, INSURANCE_ROADMAP } from '../../context/InsuranceContext';

const NIST_FUNCTIONS = ['GOVERN', 'IDENTIFY', 'PROTECT', 'DETECT', 'RESPOND', 'RECOVER'];
const NIST_COLORS = {
  GOVERN:   '#a78bfa',
  IDENTIFY: '#60a5fa',
  PROTECT:  '#22d3ee',
  DETECT:   '#34d399',
  RESPOND:  '#f59e0b',
  RECOVER:  '#fb923c',
};

const PRIORITY_BG = {
  critical: 'bg-red-50 border-red-200',
  high:     'bg-amber-50 border-amber-200',
  medium:   'bg-blue-50 border-blue-100',
};
const PRIORITY_BADGE = {
  critical: 'bg-red-100 text-red-700',
  high:     'bg-amber-100 text-amber-700',
  medium:   'bg-blue-100 text-blue-700',
};
const PRIORITY_COLOR = {
  critical: '#ef4444',
  high:     '#f59e0b',
  medium:   '#3b82f6',
};
const EFFORT_COLORS = {
  'Quick Win': '#10b981',
  'Medium':    '#f59e0b',
  'Major':     '#ef4444',
};
const STATUS_BADGE = {
  implemented: 'bg-green-100 text-green-700',
  partial:     'bg-amber-100 text-amber-700',
  missing:     'bg-red-100 text-red-600',
};

// ── Risk Gauge (arc SVG) ──────────────────────────────────────────────────────
function RiskGauge({ score, large = false }) {
  const r = large ? 64 : 52;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.75;
  const offset = arc - (score / 100) * arc;
  const color = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#10b981';
  const label = score >= 70 ? 'HIGH RISK' : score >= 40 ? 'MEDIUM RISK' : 'LOW RISK';
  const vbW = large ? 148 : 120;
  const vbH = large ? 116 : 100;
  const sx  = large ? 10  : 10;
  const ex  = large ? 138 : 110;
  const cy  = large ? 108 : 90;
  const sw  = large ? 13  : 10;

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${large ? 'w-64 h-52' : 'w-44 h-36'}`}>
        <svg className="w-full h-full" viewBox={`0 0 ${vbW} ${vbH}`}>
          <path d={`M ${sx} ${cy} A ${r} ${r} 0 1 1 ${ex} ${cy}`}
            fill="none" stroke="#f1f5f9" strokeWidth={sw} strokeLinecap="round" />
          <path d={`M ${sx} ${cy} A ${r} ${r} 0 1 1 ${ex} ${cy}`}
            fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
            strokeDasharray={`${arc} ${circ}`} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end" style={{ paddingBottom: large ? '14px' : '8px' }}>
          <span className={`font-bold text-gray-900 ${large ? 'text-6xl' : 'text-4xl'}`}>{score}</span>
          <span className={`font-bold tracking-widest mt-1 ${large ? 'text-xs' : 'text-[10px]'}`} style={{ color }}>
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Tooltip (light) ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2.5 shadow-lg bg-white border border-gray-200">
      <p className="text-xs font-bold text-gray-900 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-[11px] text-gray-600">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const labels = { implemented: 'Implemented', partial: 'Partial', missing: 'Missing' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[status] || 'bg-gray-100 text-gray-500'}`}>
      {labels[status] || status}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ExecutiveDashboard() {
  const navigate = useNavigate();
  const { state, getNistFunctionScore, roadmap } = useInsurance();
  const { assessment } = state;
  const mad = state.manualAssessmentData; // AI assessment result (may be null)

  // Prefer AI data when available
  const riskScore       = mad?.riskScore        ?? assessment.riskScore;
  const riskLevel       = mad?.riskLevel        ?? (riskScore >= 70 ? 'High' : riskScore >= 40 ? 'Medium' : 'Low');
  const savings         = mad?.savings           ?? assessment.potentialSavings;
  const controlsCovered = mad?.controlsCovered   ?? assessment.controlsCovered;
  const totalControls   = mad?.totalControls     ?? assessment.totalControls;
  const currentPremium  = assessment.currentPremium;
  const aiRecs          = mad?.recommendations   ?? [];

  // Radar data — NIST CSF functions
  const radarData = NIST_FUNCTIONS.map(fn => ({
    function: fn,
    score: getNistFunctionScore(fn),
    fullMark: 100,
  }));

  // Bar chart — use AI recs if available, else static roadmap
  const barData = aiRecs.length
    ? aiRecs.map(r => ({
        name: r.action.length > 24 ? r.action.slice(0, 24) + '…' : r.action,
        savings: Math.round(r.savings / 1000),
        colorKey: r.priority,
      }))
    : roadmap.map(r => ({
        name: r.action.length > 24 ? r.action.slice(0, 24) + '…' : r.action,
        savings: Math.round(r.savings / 1000),
        colorKey: r.effort,
      }));

  const barColor = (entry) =>
    aiRecs.length
      ? (PRIORITY_COLOR[entry.colorKey] ?? '#f59e0b')
      : (EFFORT_COLORS[entry.colorKey]  ?? '#f59e0b');

  // Donut data — controls breakdown
  const controlsMissing  = totalControls - controlsCovered;
  const donutData = [
    { name: 'Covered',  value: controlsCovered, fill: '#10b981' },
    { name: 'Missing',  value: controlsMissing,  fill: '#f1f5f9' },
  ];

  // NIST heatmap groups
  const nistGroups = NIST_FUNCTIONS.map(fn => ({
    fn, color: NIST_COLORS[fn],
    controls: NIST_CONTROLS.filter(c => c.nistFunction === fn),
  }));

  const totalRoadmapSavings = roadmap.reduce((s, r) => s + r.savings, 0);

  return (
    <div className="p-8">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-amber-600 mb-1">
            Cyber Insurance & Accountability
          </p>
          <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Last assessment: <span className="font-medium text-gray-700">{assessment.lastAssessmentDate}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {mad && (
            <button onClick={() => navigate('/insurance/assessment')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Assessment
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-all">
            <Download className="w-3.5 h-3.5" /> Export Report
          </button>
        </div>
      </motion.div>

      {/* ── AI Results Banner (only when assessment was run) ───────────────── */}
      {mad && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}
          className="mb-6 rounded-2xl px-6 py-4 bg-gradient-to-r from-amber-50 to-green-50 border border-amber-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">AI Assessment Complete</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Results below are generated from your manual assessment. Static NIST heatmap and roadmap show baseline controls.
            </p>
          </div>
          <div className="flex items-center gap-6 flex-shrink-0">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{riskScore}</p>
              <p className="text-[10px] text-gray-400 font-semibold">Risk Score</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-green-600">${(savings / 1000).toFixed(0)}K</p>
              <p className="text-[10px] text-gray-400 font-semibold">Potential Savings</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-blue-600">{controlsCovered}/{totalControls}</p>
              <p className="text-[10px] text-gray-400 font-semibold">Controls</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Risk Gauge + KPIs ──────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">

        {/* Big Gauge */}
        <div className="lg:col-span-2 card flex flex-col items-center justify-center py-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Organisation Risk Score
          </p>
          <RiskGauge score={riskScore} large />
          <p className="text-xs text-gray-400 mt-4">
            Sum insured: <span className="text-gray-600 font-semibold">${(assessment.sumInsured / 1_000_000).toFixed(0)}M AUD</span>
          </p>
          {mad && (
            <span className={`mt-3 px-3 py-1 rounded-full text-xs font-bold ${
              riskScore >= 70 ? 'bg-red-100 text-red-700' :
              riskScore >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
            }`}>
              {riskLevel} Risk Profile
            </span>
          )}
        </div>

        {/* KPI stack */}
        <div className="lg:col-span-3 grid grid-cols-2 gap-4">
          {[
            {
              icon: DollarSign,
              label: 'Current Premium',
              value: `$${(currentPremium / 1000).toFixed(0)}K`,
              sub: 'AUD / year',
              iconBg: 'bg-gray-100', iconColor: 'text-gray-500', numColor: 'text-gray-900',
            },
            {
              icon: TrendingDown,
              label: 'Potential Savings',
              value: `$${(savings / 1000).toFixed(0)}K`,
              sub: `${Math.round(savings / currentPremium * 100)}% reduction achievable`,
              iconBg: 'bg-green-100', iconColor: 'text-green-600', numColor: 'text-green-600',
            },
            {
              icon: ShieldCheck,
              label: 'Controls Covered',
              value: `${controlsCovered}/${totalControls}`,
              sub: `${totalControls - controlsCovered} gap${totalControls - controlsCovered !== 1 ? 's' : ''} to close`,
              iconBg: 'bg-blue-100', iconColor: 'text-blue-600', numColor: 'text-blue-600',
            },
            {
              icon: AlertTriangle,
              label: 'Policy Compliance',
              value: `${assessment.policyCompliance}%`,
              sub: `${assessment.criticalGaps} critical gap${assessment.criticalGaps !== 1 ? 's' : ''}`,
              iconBg: 'bg-amber-100', iconColor: 'text-amber-600', numColor: 'text-amber-600',
            },
          ].map(k => (
            <div key={k.label} className="stat-card">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${k.iconBg}`}>
                <k.icon className={`w-5 h-5 ${k.iconColor}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{k.label}</p>
                <p className={`text-2xl font-bold ${k.numColor}`}>{k.value}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{k.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── AI Recommendations (only when assessment ran) ──────────────────── */}
      {aiRecs.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}
          className="card mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">AI-Generated Recommendations</h2>
              <p className="text-xs text-gray-400">Personalised to your organisation — ordered by savings impact</p>
            </div>
            <span className="ml-auto text-xs font-semibold text-gray-400">{aiRecs.length} actions identified</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiRecs.map((r, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                className={`rounded-xl p-4 border ${PRIORITY_BG[r.priority] || 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-sm">
                    {i + 1}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${PRIORITY_BADGE[r.priority] || 'bg-gray-100 text-gray-500'}`}>
                    {r.priority || 'medium'} priority
                  </span>
                  <span className="ml-auto text-base font-bold text-green-600">
                    ${(r.savings / 1000).toFixed(0)}K
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1.5 leading-snug">{r.action}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{r.rationale}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Charts Row ────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* NIST Radar */}
        <div className="lg:col-span-2 card">
          <h2 className="text-sm font-bold text-gray-900 mb-0.5">NIST CSF 2.0 Coverage</h2>
          <p className="text-xs text-gray-500 mb-4">Control coverage across 6 NIST functions</p>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData} cx="50%" cy="50%">
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis
                dataKey="function"
                tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 600 }}
              />
              <Radar name="Coverage" dataKey="score" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {radarData.map(d => (
              <div key={d.function} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: NIST_COLORS[d.function] }} />
                <span className="text-[10px] text-gray-500">{d.function}</span>
                <span className="text-[10px] font-bold ml-auto text-gray-700">{d.score}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Controls Donut + Savings */}
        <div className="flex flex-col gap-4">
          {/* Donut */}
          <div className="card flex-1 flex flex-col items-center justify-center">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Controls Status</p>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={42} outerRadius={60}
                  dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                  {donutData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-6 mt-1">
              <div className="text-center">
                <p className="text-xl font-bold text-green-600">{controlsCovered}</p>
                <p className="text-[10px] text-gray-400">Covered</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-300">{controlsMissing}</p>
                <p className="text-[10px] text-gray-400">Missing</p>
              </div>
            </div>
          </div>
          {/* Savings mini-stat */}
          <div className="card bg-green-50 border border-green-100 text-center py-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Savings Available</p>
            <p className="text-3xl font-bold text-green-600">${(savings / 1000).toFixed(0)}K</p>
            <p className="text-xs text-gray-500 mt-1">AUD annual premium reduction</p>
          </div>
        </div>
      </motion.div>

      {/* ── Savings Bar Chart ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}
        className="card mb-6">
        <h2 className="text-sm font-bold text-gray-900 mb-0.5">
          {aiRecs.length ? 'AI Recommendation — Savings Breakdown' : 'Insurance Reduction Roadmap'}
        </h2>
        <p className="text-xs text-gray-500 mb-4">Premium savings by action ($K AUD)</p>
        <ResponsiveContainer width="100%" height={Math.max(180, barData.length * 38)}>
          <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 32, top: 0, bottom: 0 }}>
            <CartesianGrid horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickFormatter={v => `$${v}K`} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={160}
              tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="savings" radius={[0, 6, 6, 0]} label={{ position: 'right', formatter: v => `$${v}K`, fill: '#9ca3af', fontSize: 10 }}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={barColor(entry)} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {!aiRecs.length && (
          <div className="flex items-center gap-4 mt-3 justify-end">
            {Object.entries(EFFORT_COLORS).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: v }} />
                <span className="text-[10px] text-gray-500">{k}</span>
              </div>
            ))}
          </div>
        )}
        {aiRecs.length > 0 && (
          <div className="flex items-center gap-4 mt-3 justify-end">
            {['critical','high','medium'].map(p => (
              <div key={p} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: PRIORITY_COLOR[p] }} />
                <span className="text-[10px] text-gray-500 capitalize">{p}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── NIST CSF Heatmap ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="card mb-6">
        <h2 className="text-sm font-bold text-gray-900 mb-0.5">NIST CSF Control Heatmap</h2>
        <p className="text-xs text-gray-500 mb-5">All 15 controls grouped by NIST function</p>
        <div className="space-y-5">
          {nistGroups.map(group => (
            <div key={group.fn}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: group.color }} />
                <span className="text-[11px] font-bold tracking-[0.1em] text-gray-700">{group.fn}</span>
                <div className="flex-1 h-px bg-gray-100 ml-1" />
                <span className="text-[10px] text-gray-400 font-semibold">
                  {Math.round(group.controls.reduce((s, c) => s + c.coverage, 0) / group.controls.length)}% avg
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {group.controls.map(ctrl => (
                  <div key={ctrl.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{ctrl.name}</p>
                      {ctrl.gap && <p className="text-[10px] text-gray-400 truncate mt-0.5">{ctrl.gap}</p>}
                      {ctrl.tool && <p className="text-[10px] text-gray-500 truncate mt-0.5">{ctrl.tool}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <StatusBadge status={ctrl.status} />
                      <span className={`text-[10px] font-bold ${
                        ctrl.status === 'implemented' ? 'text-green-600' :
                        ctrl.status === 'partial'     ? 'text-amber-600' : 'text-red-500'
                      }`}>{ctrl.coverage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Full Roadmap Table ────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Full Reduction Roadmap</h2>
          <p className="text-xs text-gray-500 mt-0.5">Prioritised by ROI — implement in order for maximum premium reduction</p>
        </div>
        <div className="divide-y divide-gray-50">
          <div className="grid grid-cols-12 gap-4 px-6 py-2.5 bg-gray-50">
            {['#', 'Action', 'Effort', 'Timeline', 'Savings', '% of Total'].map((h, i) => (
              <span key={h} className={`text-[10px] font-bold text-gray-400 uppercase tracking-wide ${i === 1 ? 'col-span-4' : 'col-span-1'}`}>{h}</span>
            ))}
          </div>
          {roadmap.map((r, i) => (
            <div key={r.id}
              className="grid grid-cols-12 gap-4 px-6 py-3.5 items-center hover:bg-gray-50 transition-colors">
              <span className="col-span-1 text-sm font-bold text-amber-500">{i + 1}</span>
              <div className="col-span-4">
                <p className="text-sm font-semibold text-gray-800">{r.action}</p>
              </div>
              <div className="col-span-2">
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                  r.effort === 'Quick Win' ? 'bg-green-100 text-green-700' :
                  r.effort === 'Medium'   ? 'bg-amber-100 text-amber-700' :
                                            'bg-red-100 text-red-600'
                }`}>{r.effort}</span>
              </div>
              <span className="col-span-2 text-xs text-gray-500">{r.timeline}</span>
              <span className="col-span-2 text-sm font-bold text-green-600">${(r.savings / 1000).toFixed(0)}K</span>
              <div className="col-span-1">
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-green-400" style={{ width: `${r.savingsPct}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-green-600">{r.savingsPct}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100 bg-green-50">
          <p className="text-xs text-gray-500">Total achievable reduction</p>
          <p className="text-lg font-bold text-green-600">
            ${(totalRoadmapSavings / 1000).toFixed(0)}K AUD
            <span className="text-sm ml-2 font-semibold text-gray-400">
              ({Math.round(totalRoadmapSavings / 485000 * 100)}% premium reduction)
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
