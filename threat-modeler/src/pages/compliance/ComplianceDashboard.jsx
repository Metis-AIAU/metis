import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts';
import {
  Shield, AlertTriangle, CheckCircle2, Clock, ChevronRight,
  Activity, TrendingUp, FileText, Zap, AlertCircle, Info,
} from 'lucide-react';
import { useCompliance } from '../../context/ComplianceContext';
import { AESCSF_FUNCTIONS, COMPLIANCE_STATUS } from '../../data/aescsf';
import { ASD_FORTIFY_STRATEGIES } from '../../data/asdFortify';
import { E8_STRATEGIES } from '../../data/essentialEight';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const STATUS_COLORS = {
  COMPLIANT: '#10b981',
  PARTIALLY_COMPLIANT: '#f59e0b',
  NON_COMPLIANT: '#ef4444',
  NOT_ASSESSED: '#9ca3af',
  NOT_APPLICABLE: '#6b7280',
};

function ScoreGauge({ score, label, color, to }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;
  return (
    <Link to={to} className="group block">
      <div className="flex flex-col items-center">
        <div className="relative w-28 h-28">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke={color} strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{score}%</span>
          </div>
        </div>
        <p className="mt-2 text-sm font-medium text-gray-700 text-center group-hover:text-blue-600 transition-colors">{label}</p>
      </div>
    </Link>
  );
}

export default function ComplianceDashboard() {
  const { state, getFrameworkScore, getAescsfFunctionScore, getOverallScore, getGaps, hasPendingMigration, importLocalData, dismissMigration } = useCompliance();

  const aescsfScore = getFrameworkScore('AESCSF');
  const sociScore = getFrameworkScore('SOCI');
  const asdScore = getFrameworkScore('ASD_FORTIFY');
  const e8Score = getFrameworkScore('ESSENTIAL_EIGHT');
  const overallScore = getOverallScore();

  // Radar data for AESCSF functions
  const radarData = AESCSF_FUNCTIONS.map(fn => ({
    function: fn.id,
    fullName: fn.name,
    score: getAescsfFunctionScore(fn.id).score,
  }));

  // Status distribution for each framework
  function getStatusDist(framework) {
    const statuses = Object.values(state.assessments).filter(a => a.framework === framework);
    return Object.values(COMPLIANCE_STATUS).map(s => ({
      name: s.label,
      value: statuses.filter(a => a.status === s.id).length,
      color: STATUS_COLORS[s.id],
    })).filter(d => d.value > 0);
  }

  // Top gaps across all frameworks
  const allGaps = [
    ...getGaps('AESCSF'),
    ...getGaps('SOCI'),
    ...getGaps('ASD_FORTIFY'),
    ...getGaps('ESSENTIAL_EIGHT'),
  ].filter(g => g.priority === 'critical' || g.priority === 'high').slice(0, 6);

  // Framework bar chart
  const frameworkData = [
    { name: 'AESCSF', score: aescsfScore.score, fill: '#3b82f6' },
    { name: 'SOCI', score: sociScore.score, fill: '#8b5cf6' },
    { name: 'ASD Fortify', score: asdScore.score, fill: '#10b981' },
    { name: 'Essential Eight', score: e8Score.score, fill: '#f97316' },
  ];

  // ASD strategy scores
  const asdStrategyData = ASD_FORTIFY_STRATEGIES.slice(0, 8).map(s => {
    const controls = s.controls;
    const compliant = controls.filter(c => state.assessments[c.id]?.status === 'COMPLIANT').length;
    return { name: s.shortName, score: controls.length > 0 ? Math.round((compliant / controls.length) * 100) : 0, fill: s.color };
  });

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">OT Compliance Dashboard</h1>
            <p className="text-gray-500 mt-1">AESCSF · SOCI · ASD Fortify · Essential Eight — Compliance tracking for critical infrastructure</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Profile:</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">{state.aescsfProfile}</span>
            <Link to="/compliance/report" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <FileText className="w-4 h-4" /> Generate Report
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Migration banner */}
      {hasPendingMigration && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl"
        >
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 flex-1">
            You have existing compliance data saved locally. Import it to your account so it persists across sessions and devices.
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={async () => { try { await importLocalData(); } catch {} }}
              className="px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors"
            >
              Import Now
            </button>
            <button
              onClick={dismissMigration}
              className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg hover:bg-amber-200 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

      {/* Overall score + framework gauges */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <motion.div variants={item} className="card col-span-1 flex flex-col items-center justify-center py-6">
          <div className="relative w-36 h-36">
            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="12" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                stroke={getScoreColor(overallScore)} strokeWidth="12"
                strokeDasharray={2 * Math.PI * 50}
                strokeDashoffset={2 * Math.PI * 50 - (overallScore / 100) * 2 * Math.PI * 50}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900">{overallScore}%</span>
              <span className="text-xs text-gray-500">Overall</span>
            </div>
          </div>
          <p className="mt-3 font-semibold text-gray-800">Compliance Score</p>
          <p className="text-xs text-gray-500 mt-1">Across all frameworks</p>
        </motion.div>

        <motion.div variants={item} className="card col-span-3">
          <h3 className="font-semibold text-gray-900 mb-6">Framework Compliance Scores</h3>
          <div className="flex items-center justify-around flex-wrap gap-4">
            <ScoreGauge score={aescsfScore.score} label="AESCSF" color="#3b82f6" to="/compliance/aescsf" />
            <ScoreGauge score={sociScore.score} label="SOCI Act" color="#8b5cf6" to="/compliance/soci" />
            <ScoreGauge score={asdScore.score} label="ASD Fortify" color="#10b981" to="/compliance/asd-fortify" />
            <ScoreGauge score={e8Score.score} label="Essential Eight" color="#f97316" to="/compliance/essential-eight" />
          </div>
        </motion.div>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Compliant Controls', value: aescsfScore.compliant + sociScore.compliant + asdScore.compliant + e8Score.compliant, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Partial Compliance', value: aescsfScore.partial + sociScore.partial + asdScore.partial + e8Score.partial, icon: Activity, color: 'text-yellow-600', bg: 'bg-yellow-100' },
          { label: 'Non-Compliant', value: aescsfScore.nonCompliant + sociScore.nonCompliant + asdScore.nonCompliant + e8Score.nonCompliant, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
          { label: 'Not Yet Assessed', value: aescsfScore.notAssessed + sociScore.notAssessed + asdScore.notAssessed + e8Score.notAssessed, icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100' },
        ].map((stat, i) => (
          <motion.div key={i} variants={item} className="stat-card">
            <div className={`stat-icon ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts row */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* AESCSF Radar */}
        <motion.div variants={item} className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">AESCSF Function Coverage</h3>
            <Link to="/compliance/aescsf" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Detail <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="function" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 9 }} />
                <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
                <Tooltip formatter={(v, n, props) => [`${v}%`, props.payload.fullName]} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Framework bar chart */}
        <motion.div variants={item} className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Framework Comparison</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={frameworkData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#374151', fontSize: 12 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Compliance']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {frameworkData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ASD Fortify strategies */}
        <motion.div variants={item} className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">ASD Fortify Strategies</h3>
            <Link to="/compliance/asd-fortify" className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1">
              Detail <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={asdStrategyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={75} tick={{ fill: '#374151', fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Score']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {asdStrategyData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom row: gaps + quick links */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Gaps */}
        <motion.div variants={item} className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Priority Compliance Gaps</h3>
            <Link to="/compliance/gap-analysis" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Full analysis <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {allGaps.length > 0 ? allGaps.map((gap) => (
              <div key={gap.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${gap.priority === 'critical' ? 'bg-red-500' : 'bg-orange-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-medium text-gray-500">{gap.id}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      gap.framework === 'AESCSF' ? 'bg-blue-100 text-blue-700' :
                      gap.framework === 'SOCI' ? 'bg-purple-100 text-purple-700' :
                      'bg-green-100 text-green-700'
                    }`}>{gap.framework}</span>
                    {gap.assessment?.status === 'NON_COMPLIANT' && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium">Non-Compliant</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{gap.description}</p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                <CheckCircle2 className="w-12 h-12 mb-2 text-green-400" />
                <p className="font-medium">No critical gaps identified</p>
                <p className="text-sm mt-1">Complete assessments to identify gaps</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick navigation */}
        <motion.div variants={item} className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Framework Assessments</h3>
          <div className="space-y-3">
            <Link to="/compliance/aescsf" className="flex items-center gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">AESCSF {state.aescsfProfile}</p>
                <p className="text-sm text-gray-500">Australian Energy Sector Cyber Security Framework</p>
                <div className="mt-2 bg-blue-200 rounded-full h-1.5 w-full">
                  <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${aescsfScore.score}%` }} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-blue-600">{aescsfScore.score}%</p>
                <ChevronRight className="w-4 h-4 text-blue-400 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link to="/compliance/soci" className="flex items-center gap-4 p-4 rounded-xl border border-purple-100 bg-purple-50 hover:bg-purple-100 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">SOCI Act</p>
                <p className="text-sm text-gray-500">Security of Critical Infrastructure Act 2018</p>
                <div className="mt-2 bg-purple-200 rounded-full h-1.5 w-full">
                  <div className="bg-purple-600 h-1.5 rounded-full transition-all" style={{ width: `${sociScore.score}%` }} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-purple-600">{sociScore.score}%</p>
                <ChevronRight className="w-4 h-4 text-purple-400 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link to="/compliance/asd-fortify" className="flex items-center gap-4 p-4 rounded-xl border border-green-100 bg-green-50 hover:bg-green-100 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">ASD Fortify</p>
                <p className="text-sm text-gray-500">Essential Eight + OT/ICS Hardening Strategies</p>
                <div className="mt-2 bg-green-200 rounded-full h-1.5 w-full">
                  <div className="bg-green-600 h-1.5 rounded-full transition-all" style={{ width: `${asdScore.score}%` }} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-green-600">{asdScore.score}%</p>
                <ChevronRight className="w-4 h-4 text-green-400 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link to="/compliance/essential-eight" className="flex items-center gap-4 p-4 rounded-xl border border-orange-100 bg-orange-50 hover:bg-orange-100 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Essential Eight</p>
                <p className="text-sm text-gray-500">ASD Essential Eight Maturity Assessment</p>
                <div className="mt-2 bg-orange-200 rounded-full h-1.5 w-full">
                  <div className="bg-orange-500 h-1.5 rounded-full transition-all" style={{ width: `${e8Score.score}%` }} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-orange-600">{e8Score.score}%</p>
                <ChevronRight className="w-4 h-4 text-orange-400 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link to="/compliance/gap-analysis" className="flex items-center gap-4 p-4 rounded-xl border border-red-100 bg-red-50 hover:bg-red-100 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Gap Analysis</p>
                <p className="text-sm text-gray-500">Identify and prioritise compliance gaps</p>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
