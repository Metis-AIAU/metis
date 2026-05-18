import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, TrendingDown, DollarSign, AlertTriangle,
  Activity, CheckCircle2, ChevronRight, Wrench,
  FileText, BarChart3, Users, ArrowRight, Landmark,
} from 'lucide-react';
import { useInsurance, NIST_CONTROLS, INSURANCE_ROADMAP } from '../../context/InsuranceContext';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const AMBER = '#f59e0b';

function RiskGauge({ score }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.75;
  const offset = arc - (score / 100) * arc;
  const color = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#10b981';
  const label = score >= 70 ? 'HIGH RISK' : score >= 40 ? 'MEDIUM RISK' : 'LOW RISK';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-32">
        <svg className="w-full h-full" viewBox="0 0 120 100">
          <path d="M 10 90 A 52 52 0 1 1 110 90" fill="none" stroke="#f1f5f9" strokeWidth="10" strokeLinecap="round" />
          <path d="M 10 90 A 52 52 0 1 1 110 90" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${arc} ${circ}`} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className="text-4xl font-bold text-gray-900">{score}</span>
          <span className="text-[10px] font-bold tracking-widest mt-0.5" style={{ color }}>
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, iconBg, iconColor, href }) {
  const inner = (
    <div className="card h-full hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {href && <ChevronRight className="w-4 h-4 text-gray-300 mt-1" />}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs font-semibold mt-1" style={{ color: AMBER }}>{sub}</p>}
    </div>
  );
  return href ? <Link to={href} className="block">{inner}</Link> : inner;
}

function StatusBadge({ status }) {
  const map = {
    implemented: { label: 'Implemented', className: 'bg-green-100 text-green-700' },
    partial:     { label: 'Partial',      className: 'bg-amber-100 text-amber-700' },
    missing:     { label: 'Missing',      className: 'bg-red-100 text-red-600' },
  };
  const s = map[status] || map.partial;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${s.className}`}>
      {s.label}
    </span>
  );
}

const QUICK_LINKS = [
  { label: 'Policy Interpreter',  desc: 'Upload & analyse insurance policy',    href: '/insurance/policy',        icon: FileText,  iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  { label: 'Security Tools',      desc: 'View your security stack coverage',    href: '/insurance/tools',         icon: Wrench,    iconBg: 'bg-cyan-100',   iconColor: 'text-cyan-600' },
  { label: 'Manual Assessment',   desc: '7-step security posture evaluation',   href: '/insurance/assessment',    icon: Users,     iconBg: 'bg-amber-100',  iconColor: 'text-amber-600' },
  { label: 'Executive Dashboard', desc: 'NIST heatmap & premium roadmap',       href: '/insurance/executive',     icon: BarChart3, iconBg: 'bg-green-100',  iconColor: 'text-green-600' },
];

export default function InsuranceOverview() {
  const { state, roadmap } = useInsurance();
  const { assessment } = state;

  const criticalGapControls = NIST_CONTROLS.filter(c => c.status !== 'implemented' && c.premiumImpact >= 10);

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-xs font-bold tracking-widest uppercase text-amber-600 mb-1">
          Cyber Insurance & Accountability
        </p>
        <h1 className="text-3xl font-bold text-gray-900">Security Posture Overview</h1>
        <p className="text-gray-500 mt-1">
          Last assessment: <span className="font-medium text-gray-700">{assessment.lastAssessmentDate}</span>
        </p>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">

        {/* Risk Gauge + KPIs */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Gauge */}
          <div className="card flex flex-col items-center justify-center">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Organisation Risk Score
            </p>
            <RiskGauge score={assessment.riskScore} />
            <p className="text-xs text-gray-400 mt-3">
              Sum insured: <span className="text-gray-600 font-semibold">
                ${(assessment.sumInsured / 1_000_000).toFixed(0)}M AUD
              </span>
            </p>
          </div>

          {/* KPIs */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4">
            <KpiCard icon={DollarSign}    label="Current Annual Premium"  value={`$${(assessment.currentPremium / 1000).toFixed(0)}K`}   iconBg="bg-gray-100"    iconColor="text-gray-500" />
            <KpiCard icon={TrendingDown}  label="Potential Savings"        value={`$${(assessment.potentialSavings / 1000).toFixed(0)}K`}  iconBg="bg-green-100"   iconColor="text-green-600"  sub={`${Math.round(assessment.potentialSavings / assessment.currentPremium * 100)}% reduction achievable`} href="/insurance/executive" />
            <KpiCard icon={ShieldCheck}   label="Controls Covered"         value={`${assessment.controlsCovered}/${assessment.totalControls}`} iconBg="bg-blue-100" iconColor="text-blue-600"   href="/insurance/executive" />
            <KpiCard icon={AlertTriangle} label="Critical Gaps"            value={assessment.criticalGaps}                                  iconBg="bg-red-100"     iconColor="text-red-600"    href="/insurance/executive" />
            <KpiCard icon={Activity}      label="Policy Compliance"        value={`${assessment.policyCompliance}%`}                        iconBg="bg-amber-100"   iconColor="text-amber-600"  href="/insurance/policy" />
            <KpiCard icon={CheckCircle2}  label="Active Tools"             value="9/10"                                                     iconBg="bg-purple-100"  iconColor="text-purple-600" href="/insurance/tools" />
          </div>
        </motion.div>

        {/* Controls status strip */}
        <motion.div variants={item} className="grid grid-cols-3 gap-4">
          {[
            { label: 'Implemented', count: assessment.controlsImplemented, className: 'bg-green-50 border border-green-100', numColor: 'text-green-600' },
            { label: 'Partial',     count: assessment.controlsPartial,     className: 'bg-amber-50 border border-amber-100',  numColor: 'text-amber-600' },
            { label: 'Missing',     count: assessment.controlsMissing,     className: 'bg-red-50 border border-red-100',       numColor: 'text-red-600' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl px-6 py-4 flex items-center gap-4 ${s.className}`}>
              <span className={`text-3xl font-bold ${s.numColor}`}>{s.count}</span>
              <div>
                <p className="text-sm font-semibold text-gray-700">{s.label}</p>
                <p className="text-xs text-gray-400">controls</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Quick links */}
        <motion.div variants={item}>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Quick Access</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_LINKS.map(l => (
              <Link key={l.href} to={l.href} className="card card-hover group block">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${l.iconBg}`}>
                  <l.icon className={`w-4.5 h-4.5 ${l.iconColor}`} />
                </div>
                <p className="text-sm font-bold text-gray-900 mb-0.5">{l.label}</p>
                <p className="text-xs text-gray-500 leading-snug">{l.desc}</p>
                <div className="flex items-center gap-1 mt-3 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-semibold">Open</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Critical gaps + top savings */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Critical gaps */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Critical Compliance Gaps</h2>
              <Link to="/insurance/executive" className="text-xs font-semibold text-amber-500 flex items-center gap-1 hover:text-amber-600">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {criticalGapControls.slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{c.gap}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-bold text-red-500">−{c.premiumImpact}%</span>
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top savings */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Top Saving Opportunities</h2>
              <Link to="/insurance/executive" className="text-xs font-semibold text-green-600 flex items-center gap-1 hover:text-green-700">
                View roadmap <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {INSURANCE_ROADMAP.slice(0, 5).map((r, i) => (
                <div key={r.id} className="flex items-center gap-3 py-3">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{r.action}</p>
                    <p className="text-xs text-gray-400">{r.timeline}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">${(r.savings / 1000).toFixed(0)}K</p>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                      {r.effort}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
