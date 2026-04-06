import { useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
} from 'recharts';
import {
  ArrowLeft,
  AlertTriangle,
  Shield,
  Network,
  Tag,
  Calendar,
  Users,
  ChevronRight,
  Plus,
  Activity,
  Target,
  TrendingUp,
  LayoutTemplate,
} from 'lucide-react';
import { useThreatContext, STRIDE_CATEGORIES, RISK_LEVELS, CONTROL_STATUS } from '../context/ThreatContext';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const {
    state,
    setCurrentProject,
    getProjectThreats,
    getProjectControls,
    getProjectAssets,
    getProjectDataFlows,
    getRiskStats,
    getControlStats,
    getMitigationProgress,
    getThreatsByCategory,
  } = useThreatContext();

  const project = state.projects.find((p) => p.id === projectId);

  useEffect(() => {
    if (project) {
      setCurrentProject(project);
    }
    // setCurrentProject is a new function ref each render — intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  if (state.isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading project data…</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h2>
        <p className="text-gray-500 mb-4">The project you're looking for doesn't exist.</p>
        <Link to="/projects" className="btn-primary">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Projects
        </Link>
      </div>
    );
  }

  const threats = getProjectThreats(projectId);
  const controls = getProjectControls(projectId);
  const assets = getProjectAssets(projectId);
  const dataFlows = getProjectDataFlows(projectId);
  const riskStats = getRiskStats(projectId);
  const controlStats = getControlStats(projectId);
  const progress = getMitigationProgress(projectId);
  const threatsByCategory = getThreatsByCategory(projectId);

  // Chart data
  const riskDistributionData = [
    { name: 'Critical', value: riskStats.critical, color: RISK_LEVELS.CRITICAL.color },
    { name: 'High', value: riskStats.high, color: RISK_LEVELS.HIGH.color },
    { name: 'Medium', value: riskStats.medium, color: RISK_LEVELS.MEDIUM.color },
    { name: 'Low', value: riskStats.low, color: RISK_LEVELS.LOW.color },
    { name: 'Minimal', value: riskStats.minimal, color: RISK_LEVELS.MINIMAL.color },
  ].filter((d) => d.value > 0);

  const strideData = Object.entries(STRIDE_CATEGORIES).map(([key, category]) => ({
    name: key,
    fullName: category.name,
    value: threatsByCategory[key]?.length || 0,
    color: category.color,
  }));

  const recentThreats = [...threats]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const recentControls = [...controls]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link
          to="/projects"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Projects
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-500 mt-1 max-w-2xl">{project.description}</p>

            {/* Tags */}
            {project.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {project.tags.map((tag) => (
                  <span key={tag} className="badge-info">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Meta Info */}
            <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{project.owner || 'Unassigned'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
              <span
                className={`badge ${
                  project.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : project.status === 'planning'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {project.status}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Link
              to={`/projects/${projectId}/workspace`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-sm transition-all"
            >
              <LayoutTemplate className="w-4 h-4" />
              Threat Modeling Workspace
            </Link>
            <Link to="/threats" className="btn-secondary">
              <Plus className="w-4 h-4 mr-2" />
              Add Threat
            </Link>
            <Link to="/controls" className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Control
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8"
      >
        <div className="card text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{threats.length}</p>
          <p className="text-sm text-gray-500">Threats</p>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{controls.length}</p>
          <p className="text-sm text-gray-500">Controls</p>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Target className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{assets.length}</p>
          <p className="text-sm text-gray-500">Assets</p>
        </div>

        <div className="card text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Network className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{dataFlows.length}</p>
          <p className="text-sm text-gray-500">Data Flows</p>
        </div>

        <div className="card text-center bg-gradient-to-br from-red-50 to-orange-50">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">{riskStats.critical + riskStats.high}</p>
          <p className="text-sm text-gray-500">High Risk</p>
        </div>

        <div className="card text-center bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600">{progress}%</p>
          <p className="text-sm text-gray-500">Mitigated</p>
        </div>
      </motion.div>

      {/* Charts Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
      >
        {/* Risk Distribution */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Risk Distribution</h3>
          {riskDistributionData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {riskDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-400">No threats identified yet</p>
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {riskDistributionData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-600">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* STRIDE Distribution */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">STRIDE Analysis</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strideData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name, props) => [value, props.payload.fullName]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {strideData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Control Progress */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Control Implementation</h3>
          <Link to="/controls" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {Object.entries(CONTROL_STATUS).map(([key, status]) => {
            const count = key === 'NOT_STARTED' ? controlStats.notStarted
              : key === 'IN_PROGRESS' ? controlStats.inProgress
              : key === 'IMPLEMENTED' ? controlStats.implemented
              : controlStats.verified;
            const percentage = controls.length > 0 ? Math.round((count / controls.length) * 100) : 0;

            return (
              <div key={key} className="text-center">
                <div
                  className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center mb-2"
                  style={{ backgroundColor: status.color + '20' }}
                >
                  <span className="text-2xl font-bold" style={{ color: status.color }}>
                    {count}
                  </span>
                </div>
                <p className="font-medium text-gray-900">{status.label}</p>
                <p className="text-sm text-gray-500">{percentage}%</p>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Overall Mitigation Progress</span>
            <span className="font-medium text-gray-900">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1 }}
              className={`h-full rounded-full ${
                progress >= 80
                  ? 'bg-gradient-to-r from-green-400 to-green-600'
                  : progress >= 50
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                  : 'bg-gradient-to-r from-red-400 to-red-600'
              }`}
            />
          </div>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Recent Threats */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Threats</h3>
            <Link to="/threats" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {recentThreats.length > 0 ? (
            <div className="space-y-3">
              {recentThreats.map((threat) => (
                <Link
                  key={threat.id}
                  to="/threats"
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
                    style={{ backgroundColor: STRIDE_CATEGORIES[threat.strideCategory]?.color }}
                  >
                    {threat.strideCategory}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{threat.name}</p>
                    <span
                      className="badge text-xs"
                      style={{
                        backgroundColor: RISK_LEVELS[threat.riskLevel]?.bgColor,
                        color: RISK_LEVELS[threat.riskLevel]?.color,
                      }}
                    >
                      {RISK_LEVELS[threat.riskLevel]?.label}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No threats yet</p>
              <Link to="/threats" className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block">
                Add a threat
              </Link>
            </div>
          )}
        </div>

        {/* Recent Controls */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Controls</h3>
            <Link to="/controls" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {recentControls.length > 0 ? (
            <div className="space-y-3">
              {recentControls.map((control) => (
                <Link
                  key={control.id}
                  to="/controls"
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: CONTROL_STATUS[control.status]?.color + '20' }}
                  >
                    <Shield
                      className="w-4 h-4"
                      style={{ color: CONTROL_STATUS[control.status]?.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{control.name}</p>
                    <span
                      className="text-xs"
                      style={{ color: CONTROL_STATUS[control.status]?.color }}
                    >
                      {CONTROL_STATUS[control.status]?.label}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No controls yet</p>
              <Link to="/controls" className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block">
                Add a control
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
