import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wrench, CheckCircle2, AlertTriangle, XCircle, Wifi, WifiOff, Plus, Filter } from 'lucide-react';
import { SECURITY_TOOLS } from '../../context/InsuranceContext';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const CATEGORY_COLORS = {
  'EDR':                  { bg: 'bg-cyan-100',   text: 'text-cyan-700' },
  'SIEM':                 { bg: 'bg-purple-100',  text: 'text-purple-700' },
  'Identity & IAM':       { bg: 'bg-blue-100',    text: 'text-blue-700' },
  'Privileged Access':    { bg: 'bg-amber-100',   text: 'text-amber-700' },
  'Vulnerability Mgmt':   { bg: 'bg-green-100',   text: 'text-green-700' },
  'Email Security':       { bg: 'bg-orange-100',  text: 'text-orange-700' },
  'Zero Trust / ZTNA':    { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700' },
  'Backup & Recovery':    { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'Security Awareness':   { bg: 'bg-yellow-100',  text: 'text-yellow-700' },
};

const STATUS_CONFIG = {
  active:   { className: 'bg-green-100 text-green-700', label: 'Active',   icon: CheckCircle2 },
  degraded: { className: 'bg-amber-100 text-amber-700', label: 'Degraded', icon: AlertTriangle },
  inactive: { className: 'bg-red-100 text-red-600',     label: 'Inactive', icon: XCircle },
};

function CoverageBar({ value, colorClass }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${colorClass}`} />
      </div>
      <span className="text-xs font-bold text-gray-600 w-8 text-right">{value}%</span>
    </div>
  );
}

function ToolCard({ tool }) {
  const cat    = CATEGORY_COLORS[tool.category] || { bg: 'bg-gray-100', text: 'text-gray-600' };
  const status = STATUS_CONFIG[tool.status];
  const StatusIcon = status.icon;
  const perfColor = tool.status === 'degraded' ? 'bg-amber-400' : 'bg-green-400';

  return (
    <motion.div variants={item} className="card card-hover flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-sm font-bold text-gray-900 leading-tight">{tool.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{tool.vendor}</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${status.className}`}>
          <StatusIcon className="w-2.5 h-2.5" /> {status.label}
        </span>
      </div>

      {/* Category */}
      <span className={`inline-flex w-fit items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${cat.bg} ${cat.text}`}>
        {tool.category}
      </span>

      {/* Bars */}
      <div className="space-y-2">
        <div>
          <p className="text-[10px] text-gray-400 font-semibold mb-1">Coverage</p>
          <CoverageBar value={tool.coverage} colorClass="bg-blue-400" />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-semibold mb-1">Performance</p>
          <CoverageBar value={tool.performance} colorClass={perfColor} />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(tool.metrics).map(([k, v]) => (
          <div key={k} className="rounded-lg p-2 bg-gray-50 border border-gray-100">
            <p className="text-[10px] text-gray-400 capitalize leading-tight">
              {k.replace(/([A-Z])/g, ' $1').trim()}
            </p>
            <p className="text-xs font-bold text-gray-700 mt-0.5">{String(v)}</p>
          </div>
        ))}
      </div>

      {/* API status */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100">
        {tool.apiConnected
          ? <><Wifi className="w-3 h-3 text-green-500" /><span className="text-[10px] font-semibold text-green-600">API Connected</span></>
          : <><WifiOff className="w-3 h-3 text-gray-300" /><span className="text-[10px] font-semibold text-gray-400">Manual Entry</span></>
        }
      </div>
    </motion.div>
  );
}

const CATEGORIES = ['All', ...new Set(SECURITY_TOOLS.map(t => t.category))];
const STATUSES   = ['All', 'active', 'degraded', 'inactive'];

export default function SecurityTools() {
  const [catFilter,    setCatFilter]    = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const active  = SECURITY_TOOLS.filter(t => t.status === 'active').length;
  const degraded = SECURITY_TOOLS.filter(t => t.status === 'degraded').length;
  const apiConn = SECURITY_TOOLS.filter(t => t.apiConnected).length;
  const avgCov  = Math.round(SECURITY_TOOLS.reduce((s, t) => s + t.coverage, 0) / SECURITY_TOOLS.length);

  const filtered = SECURITY_TOOLS.filter(t => {
    const catOk    = catFilter    === 'All' || t.category === catFilter;
    const statusOk = statusFilter === 'All' || t.status   === statusFilter;
    return catOk && statusOk;
  });

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-xs font-bold tracking-widest uppercase text-amber-600 mb-1">Cyber Insurance & Accountability</p>
        <h1 className="text-3xl font-bold text-gray-900">Security Tools</h1>
        <p className="text-gray-500 mt-1">Your security stack inventory — coverage, performance, and control mapping.</p>
      </motion.div>

      {/* Stats strip */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Tools',   value: SECURITY_TOOLS.length, icon: '🛠', color: 'text-gray-900' },
          { label: 'Active',        value: active,                 icon: '✅', color: 'text-green-600' },
          { label: 'Degraded',      value: degraded,               icon: '⚠️', color: 'text-amber-600' },
          { label: 'Avg Coverage',  value: `${avgCov}%`,           icon: '📊', color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}
        className="card mb-6 flex flex-wrap items-center gap-3 p-4">
        <Filter className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs text-gray-400 font-semibold">Status:</span>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-all ${
              statusFilter === s ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>{s}</button>
        ))}
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <span className="text-xs text-gray-400 font-semibold">Category:</span>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
              catFilter === c ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>{c}</button>
        ))}
        <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-all">
          <Plus className="w-3.5 h-3.5" /> Add Tool
        </button>
      </motion.div>

      {/* Grid */}
      <motion.div variants={container} initial="hidden" animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(tool => <ToolCard key={tool.id} tool={tool} />)}
        {filtered.length === 0 && (
          <div className="col-span-full card flex flex-col items-center justify-center py-16">
            <Wrench className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-gray-400">No tools match this filter.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
