import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Info,
  AlertTriangle,
  ChevronRight,
  Filter,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useThreatContext, STRIDE_CATEGORIES, RISK_LEVELS } from '../context/ThreatContext';

const LIKELIHOOD_LABELS = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
const IMPACT_LABELS = ['Minimal', 'Low', 'Moderate', 'High', 'Critical'];

// Risk color based on score (likelihood * impact)
const getRiskColor = (likelihood, impact) => {
  const score = likelihood * impact;
  if (score >= 20) return { bg: '#991b1b', text: '#fee2e2', level: 'Critical' };
  if (score >= 15) return { bg: '#c2410c', text: '#ffedd5', level: 'High' };
  if (score >= 10) return { bg: '#f59e0b', text: '#fef3c7', level: 'Medium' };
  if (score >= 5) return { bg: '#84cc16', text: '#ecfccb', level: 'Low' };
  return { bg: '#22c55e', text: '#dcfce7', level: 'Minimal' };
};

export default function RiskMatrix() {
  const { state, getThreatControls } = useThreatContext();
  const [filterProject, setFilterProject] = useState('');
  const [selectedCell, setSelectedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  const filteredThreats = useMemo(() => {
    if (!filterProject) return state.threats;
    return state.threats.filter((t) => t.projectId === filterProject);
  }, [state.threats, filterProject]);

  // Create matrix data
  const matrixData = useMemo(() => {
    const matrix = {};
    for (let i = 1; i <= 5; i++) {
      for (let l = 1; l <= 5; l++) {
        matrix[`${l}-${i}`] = [];
      }
    }
    filteredThreats.forEach((threat) => {
      const key = `${threat.likelihood}-${threat.impact}`;
      if (matrix[key]) {
        matrix[key].push(threat);
      }
    });
    return matrix;
  }, [filteredThreats]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredThreats.length;
    const byRisk = {
      critical: filteredThreats.filter((t) => t.likelihood * t.impact >= 20).length,
      high: filteredThreats.filter((t) => t.likelihood * t.impact >= 15 && t.likelihood * t.impact < 20).length,
      medium: filteredThreats.filter((t) => t.likelihood * t.impact >= 10 && t.likelihood * t.impact < 15).length,
      low: filteredThreats.filter((t) => t.likelihood * t.impact >= 5 && t.likelihood * t.impact < 10).length,
      minimal: filteredThreats.filter((t) => t.likelihood * t.impact < 5).length,
    };
    const avgRisk = total > 0
      ? Math.round(filteredThreats.reduce((acc, t) => acc + t.likelihood * t.impact, 0) / total)
      : 0;
    return { total, byRisk, avgRisk };
  }, [filteredThreats]);

  const getProjectName = (projectId) => {
    return state.projects.find((p) => p.id === projectId)?.name || 'Unknown';
  };

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Risk Assessment Matrix</h1>
          <p className="text-gray-500 mt-1">Visualize threats by likelihood and impact</p>
        </div>
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="input w-auto"
        >
          <option value="">All Projects</option>
          {state.projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8"
      >
        <div className="card text-center">
          <p className="text-sm text-gray-500 mb-1">Total Threats</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="card text-center bg-gradient-to-br from-red-50 to-red-100">
          <p className="text-sm text-red-700 mb-1">Critical</p>
          <p className="text-3xl font-bold text-red-600">{stats.byRisk.critical}</p>
        </div>
        <div className="card text-center bg-gradient-to-br from-orange-50 to-orange-100">
          <p className="text-sm text-orange-700 mb-1">High</p>
          <p className="text-3xl font-bold text-orange-600">{stats.byRisk.high}</p>
        </div>
        <div className="card text-center bg-gradient-to-br from-yellow-50 to-yellow-100">
          <p className="text-sm text-yellow-700 mb-1">Medium</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.byRisk.medium}</p>
        </div>
        <div className="card text-center bg-gradient-to-br from-lime-50 to-lime-100">
          <p className="text-sm text-lime-700 mb-1">Low</p>
          <p className="text-3xl font-bold text-lime-600">{stats.byRisk.low}</p>
        </div>
        <div className="card text-center bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-sm text-green-700 mb-1">Minimal</p>
          <p className="text-3xl font-bold text-green-600">{stats.byRisk.minimal}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Risk Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 card"
        >
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Risk Heatmap</h3>
          </div>

          <div className="relative">
            {/* Y-Axis Label */}
            <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-medium text-gray-500 whitespace-nowrap">
              Impact
            </div>

            {/* Matrix Grid */}
            <div className="ml-16">
              {/* Y-Axis Labels */}
              <div className="flex">
                <div className="w-20" />
                {LIKELIHOOD_LABELS.map((label, index) => (
                  <div key={index} className="flex-1 text-center text-xs text-gray-500 pb-2">
                    {label}
                  </div>
                ))}
              </div>

              {/* Matrix Cells */}
              {[5, 4, 3, 2, 1].map((impact) => (
                <div key={impact} className="flex items-center">
                  <div className="w-20 text-xs text-gray-500 pr-3 text-right">
                    {IMPACT_LABELS[impact - 1]}
                  </div>
                  <div className="flex-1 flex gap-2">
                    {[1, 2, 3, 4, 5].map((likelihood) => {
                      const cellKey = `${likelihood}-${impact}`;
                      const threats = matrixData[cellKey] || [];
                      const colors = getRiskColor(likelihood, impact);
                      const isHovered = hoveredCell === cellKey;
                      const isSelected = selectedCell === cellKey;

                      return (
                        <motion.div
                          key={cellKey}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedCell(isSelected ? null : cellKey)}
                          onMouseEnter={() => setHoveredCell(cellKey)}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`flex-1 aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all relative ${
                            isSelected ? 'ring-4 ring-blue-400 ring-offset-2' : ''
                          }`}
                          style={{ backgroundColor: colors.bg }}
                        >
                          <span className="text-2xl font-bold text-white">
                            {threats.length || ''}
                          </span>
                          {threats.length > 0 && (
                            <span className="text-xs text-white/80">
                              threat{threats.length !== 1 ? 's' : ''}
                            </span>
                          )}

                          {/* Tooltip */}
                          <AnimatePresence>
                            {isHovered && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-full mb-2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-10 shadow-lg"
                              >
                                <div className="font-medium">{colors.level} Risk</div>
                                <div className="text-gray-300">
                                  Score: {likelihood * impact} | L:{likelihood} × I:{impact}
                                </div>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
                                  <div className="border-8 border-transparent border-t-gray-900" />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* X-Axis Label */}
              <div className="text-center text-sm font-medium text-gray-500 mt-4">
                Likelihood
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-6">
              {[
                { label: 'Critical', color: '#991b1b' },
                { label: 'High', color: '#c2410c' },
                { label: 'Medium', color: '#f59e0b' },
                { label: 'Low', color: '#84cc16' },
                { label: 'Minimal', color: '#22c55e' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Cell Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card h-fit"
        >
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">
              {selectedCell ? 'Selected Cell Details' : 'Click a Cell'}
            </h3>
          </div>

          {selectedCell ? (
            <div>
              {(() => {
                const [likelihood, impact] = selectedCell.split('-').map(Number);
                const threats = matrixData[selectedCell] || [];
                const colors = getRiskColor(likelihood, impact);

                return (
                  <div>
                    <div
                      className="rounded-xl p-4 mb-4"
                      style={{ backgroundColor: colors.bg }}
                    >
                      <div className="text-white text-center">
                        <p className="text-sm opacity-80">Risk Level</p>
                        <p className="text-2xl font-bold">{colors.level}</p>
                        <p className="text-sm opacity-80 mt-1">
                          Score: {likelihood * impact}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500">Likelihood</p>
                        <p className="font-bold text-gray-900">{likelihood}/5</p>
                        <p className="text-xs text-gray-400">{LIKELIHOOD_LABELS[likelihood - 1]}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500">Impact</p>
                        <p className="font-bold text-gray-900">{impact}/5</p>
                        <p className="text-xs text-gray-400">{IMPACT_LABELS[impact - 1]}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Threats ({threats.length})
                      </p>
                      {threats.length > 0 ? (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {threats.map((threat) => {
                            const controls = getThreatControls(threat.id);
                            return (
                              <Link
                                key={threat.id}
                                to={`/threats`}
                                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-900 truncate">
                                      {threat.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span
                                        className="w-5 h-5 rounded text-xs flex items-center justify-center text-white font-bold"
                                        style={{
                                          backgroundColor: STRIDE_CATEGORIES[threat.strideCategory]?.color,
                                        }}
                                      >
                                        {threat.strideCategory}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {controls.length} control{controls.length !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {getProjectName(threat.projectId)}
                                    </p>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-gray-50 rounded-lg">
                          <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No threats in this cell</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Click on any cell in the matrix to see threat details</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Risk Score Guide */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card mt-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Risk Scoring Guide</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { level: 'Critical', range: '20-25', color: '#991b1b', description: 'Immediate action required. Unacceptable risk.' },
            { level: 'High', range: '15-19', color: '#c2410c', description: 'Senior management attention needed. Action plan required.' },
            { level: 'Medium', range: '10-14', color: '#f59e0b', description: 'Management responsibility. Monitor and manage.' },
            { level: 'Low', range: '5-9', color: '#84cc16', description: 'Manage by routine procedures. Review periodically.' },
            { level: 'Minimal', range: '1-4', color: '#22c55e', description: 'Acceptable risk. Document and monitor.' },
          ].map((item) => (
            <div key={item.level} className="p-4 rounded-lg" style={{ backgroundColor: item.color + '15' }}>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium" style={{ color: item.color }}>
                  {item.level}
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-1">Score: {item.range}</p>
              <p className="text-xs text-gray-500">{item.description}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
