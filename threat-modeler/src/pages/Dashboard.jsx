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
  AreaChart,
  Area,
} from 'recharts';
import {
  AlertTriangle,
  Shield,
  FolderKanban,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useThreatContext, STRIDE_CATEGORIES, RISK_LEVELS, CONTROL_STATUS } from '../context/ThreatContext';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const { state, getRiskStats, getControlStats, getMitigationProgress } = useThreatContext();

  // Calculate global stats
  const totalThreats = state.threats.length;
  const totalControls = state.controls.length;
  const totalProjects = state.projects.length;

  const globalRiskStats = state.projects.reduce(
    (acc, project) => {
      const stats = getRiskStats(project.id);
      acc.critical += stats.critical;
      acc.high += stats.high;
      acc.medium += stats.medium;
      acc.low += stats.low;
      acc.minimal += stats.minimal;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0, minimal: 0 }
  );

  const globalControlStats = state.projects.reduce(
    (acc, project) => {
      const stats = getControlStats(project.id);
      acc.notStarted += stats.notStarted;
      acc.inProgress += stats.inProgress;
      acc.implemented += stats.implemented;
      acc.verified += stats.verified;
      return acc;
    },
    { notStarted: 0, inProgress: 0, implemented: 0, verified: 0 }
  );

  // Risk distribution data for pie chart
  const riskDistributionData = [
    { name: 'Critical', value: globalRiskStats.critical, color: RISK_LEVELS.CRITICAL.color },
    { name: 'High', value: globalRiskStats.high, color: RISK_LEVELS.HIGH.color },
    { name: 'Medium', value: globalRiskStats.medium, color: RISK_LEVELS.MEDIUM.color },
    { name: 'Low', value: globalRiskStats.low, color: RISK_LEVELS.LOW.color },
    { name: 'Minimal', value: globalRiskStats.minimal, color: RISK_LEVELS.MINIMAL.color },
  ].filter((d) => d.value > 0);

  // STRIDE category data
  const strideData = Object.entries(STRIDE_CATEGORIES).map(([key, category]) => ({
    name: category.name,
    short: key,
    value: state.threats.filter((t) => t.strideCategory === key).length,
    color: category.color,
  }));

  // Control status data
  const controlStatusData = [
    { name: 'Not Started', value: globalControlStats.notStarted, color: CONTROL_STATUS.NOT_STARTED.color },
    { name: 'In Progress', value: globalControlStats.inProgress, color: CONTROL_STATUS.IN_PROGRESS.color },
    { name: 'Implemented', value: globalControlStats.implemented, color: CONTROL_STATUS.IMPLEMENTED.color },
    { name: 'Verified', value: globalControlStats.verified, color: CONTROL_STATUS.VERIFIED.color },
  ];

  // Recent threats
  const recentThreats = [...state.threats]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // Project progress data
  const projectProgressData = state.projects.map((project) => ({
    name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
    progress: getMitigationProgress(project.id),
    threats: state.threats.filter((t) => t.projectId === project.id).length,
  }));

  // Radar data for STRIDE coverage
  const radarData = strideData.map((s) => ({
    category: s.short,
    threats: s.value,
    fullMark: Math.max(...strideData.map((d) => d.value), 5),
  }));

  const avgMitigationProgress =
    state.projects.length > 0
      ? Math.round(
          state.projects.reduce((acc, p) => acc + getMitigationProgress(p.id), 0) / state.projects.length
        )
      : 0;

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your threat modeling activities</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <motion.div variants={item} className="stat-card">
          <div className="stat-icon bg-blue-100">
            <FolderKanban className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Projects</p>
            <p className="text-2xl font-bold text-gray-900">{totalProjects}</p>
          </div>
        </motion.div>

        <motion.div variants={item} className="stat-card">
          <div className="stat-icon bg-red-100">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Threats</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-gray-900">{totalThreats}</p>
              {globalRiskStats.critical > 0 && (
                <span className="badge-critical">{globalRiskStats.critical} Critical</span>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="stat-card">
          <div className="stat-icon bg-green-100">
            <Shield className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Controls</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-gray-900">{totalControls}</p>
              <span className="badge-info">
                {globalControlStats.implemented + globalControlStats.verified} Active
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="stat-card">
          <div className="stat-icon bg-purple-100">
            <Activity className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Mitigation Progress</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-gray-900">{avgMitigationProgress}%</p>
              {avgMitigationProgress >= 70 ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Charts Row 1 */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
      >
        {/* Risk Distribution Pie Chart */}
        <motion.div variants={item} className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Risk Distribution</h3>
            <Link to="/threats" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {riskDistributionData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-600">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* STRIDE Categories Bar Chart */}
        <motion.div variants={item} className="card">
          <h3 className="font-semibold text-gray-900 mb-4">STRIDE Categories</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strideData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" />
                <YAxis dataKey="short" type="category" width={30} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value, name, props) => [value, props.payload.name]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {strideData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* STRIDE Radar */}
        <motion.div variants={item} className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Threat Coverage</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="category" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <PolarRadiusAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Radar
                  name="Threats"
                  dataKey="threats"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>

      {/* Charts Row 2 */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        {/* Control Status */}
        <motion.div variants={item} className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Control Implementation Status</h3>
            <Link to="/controls" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Manage <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={controlStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="url(#colorGradient)"
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-4">
            {controlStatusData.map((status) => (
              <div key={status.name} className="text-center">
                <div
                  className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center"
                  style={{ backgroundColor: status.color + '20' }}
                >
                  <span className="font-bold" style={{ color: status.color }}>
                    {status.value}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{status.name}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Project Progress */}
        <motion.div variants={item} className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Project Mitigation Progress</h3>
            <Link to="/projects" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              All projects <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {projectProgressData.length > 0 ? (
              projectProgressData.map((project, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{project.name}</span>
                    <span className="text-sm text-gray-500">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${project.progress}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className={`h-full rounded-full ${
                        project.progress >= 80
                          ? 'bg-gradient-to-r from-green-400 to-green-600'
                          : project.progress >= 50
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                          : 'bg-gradient-to-r from-red-400 to-red-600'
                      }`}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{project.threats} threats identified</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FolderKanban className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No projects yet</p>
                <Link to="/projects" className="btn-primary mt-4 inline-flex">
                  Create Project
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Threats */}
        <motion.div variants={item} className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Threats</h3>
            <Zap className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="space-y-3">
            {recentThreats.length > 0 ? (
              recentThreats.map((threat) => (
                <Link
                  key={threat.id}
                  to={`/threats/${threat.id}`}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: STRIDE_CATEGORIES[threat.strideCategory]?.color + '20' }}
                  >
                    <span
                      className="font-bold"
                      style={{ color: STRIDE_CATEGORIES[threat.strideCategory]?.color }}
                    >
                      {threat.strideCategory}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {threat.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{threat.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="badge"
                        style={{
                          backgroundColor: RISK_LEVELS[threat.riskLevel]?.bgColor,
                          color: RISK_LEVELS[threat.riskLevel]?.color,
                        }}
                      >
                        {RISK_LEVELS[threat.riskLevel]?.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(threat.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No threats identified yet</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Stats Summary */}
        <motion.div variants={item} className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Security Posture Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium text-gray-700">Critical Issues</span>
              </div>
              <p className="text-3xl font-bold text-red-600">{globalRiskStats.critical}</p>
              <p className="text-xs text-gray-500 mt-1">Require immediate attention</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">In Progress</span>
              </div>
              <p className="text-3xl font-bold text-yellow-600">{globalControlStats.inProgress}</p>
              <p className="text-xs text-gray-500 mt-1">Controls being implemented</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-700">Mitigated</span>
              </div>
              <p className="text-3xl font-bold text-green-600">
                {globalControlStats.implemented + globalControlStats.verified}
              </p>
              <p className="text-xs text-gray-500 mt-1">Controls active</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Coverage</span>
              </div>
              <p className="text-3xl font-bold text-blue-600">{avgMitigationProgress}%</p>
              <p className="text-xs text-gray-500 mt-1">Overall mitigation</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
