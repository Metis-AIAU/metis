import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Save, Sparkles, Loader2, CheckCircle2, AlertTriangle,
  Info, ChevronDown, FolderKanban, LayoutTemplate, ShieldCheck,
} from 'lucide-react';
import { useThreatContext, STRIDE_CATEGORIES, RISK_LEVELS } from '../context/ThreatContext';
import ThreatModelCanvas from '../components/ThreatModelCanvas';
import AIThreatTable from '../components/AIThreatTable';
import { analyzeWithContext } from '../services/aiAnalysis';

// ── Component ────────────────────────────────────────────────────────────────

export default function Diagram() {
  const {
    state,
    updateProject,
    importAIResults,
    addThreat,
  } = useThreatContext();

  // ── Project picker ─────────────────────────────────────────────────────
  const [selectedProjectId, setSelectedProjectId] = useState(
    () => state.currentProject?.id || state.projects[0]?.id || ''
  );
  const project = state.projects.find(p => p.id === selectedProjectId) || null;

  // Sync when currentProject changes externally
  useEffect(() => {
    if (state.currentProject?.id && !selectedProjectId) {
      setSelectedProjectId(state.currentProject.id);
    }
  }, [state.currentProject?.id]); // eslint-disable-line

  // ── Diagram state ──────────────────────────────────────────────────────
  const [diagramData, setDiagramData] = useState({ elements: [], connections: [] });
  const [analysisState, setAnalysisState] = useState({ status: 'idle', progress: null, error: null });
  const [threatRows, setThreatRows] = useState([]);
  const [expandedThreat, setExpandedThreat] = useState(null);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [saved, setSaved] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Load diagram from project
  useEffect(() => {
    if (!project) return;
    if (project.workspaceDiagramData) {
      setDiagramData(project.workspaceDiagramData);
    } else {
      setDiagramData({ elements: [], connections: [] });
    }
    if (project.workspaceThreatRows) {
      setThreatRows(project.workspaceThreatRows);
    } else {
      setThreatRows([]);
    }
    setAppliedIds(new Set());
    setAnalysisState({ status: 'idle', progress: null, error: null });
    setShowAnalysis(false);
  }, [project?.id]); // eslint-disable-line

  // ── Save diagram to project ────────────────────────────────────────────
  const saveDiagram = useCallback(() => {
    if (!project) return;
    updateProject({
      id: project.id,
      workspaceDiagramData: diagramData,
      workspaceThreatRows: threatRows,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [project, diagramData, threatRows, updateProject]);

  // ── Run AI analysis ────────────────────────────────────────────────────
  const runAnalysis = async () => {
    if (!project) return;
    setAnalysisState({ status: 'running', progress: null, error: null });
    setThreatRows([]);
    setShowAnalysis(true);

    const formData = project.workspaceFormData || {};
    try {
      const result = await analyzeWithContext(
        {
          ...project,
          ...formData,
          name: formData.systemName || project.name,
          description: formData.systemDescription || project.description,
        },
        formData,
        diagramData.elements || [],
        (prog) => setAnalysisState(prev => ({ ...prev, progress: prog }))
      );
      if (result.success) {
        setThreatRows(result.threatRows || []);
        updateProject({ id: project.id, workspaceThreatRows: result.threatRows });
        setAnalysisState({ status: 'complete', progress: null, error: null });
      } else {
        setAnalysisState({ status: 'error', progress: null, error: result.error });
      }
    } catch (err) {
      setAnalysisState({ status: 'error', progress: null, error: err.message });
    }
  };

  // ── Apply a single AI-generated threat ─────────────────────────────────
  const applyThreatRow = (row) => {
    if (!project) return;
    const likelihood = row.likelihood || 3;
    const impact = row.impact || 3;
    addThreat({
      projectId: project.id,
      name: row.name || row.threat,
      description: row.description || row.rationale || '',
      strideCategory: row.strideCategory || row.stride?.[0] || 'I',
      likelihood,
      impact,
      riskScore: row.riskScore ?? likelihood * impact,
      riskLevel: row.riskLevel || row.risk || 'MEDIUM',
      rationale: row.rationale,
      residualRiskScore: row.residualRiskScore,
      residualRiskLevel: row.residualRiskLevel,
      recommendations: row.recommendations,
      attackVector: 'Network',
      aiGenerated: true,
    });
    setAppliedIds(prev => new Set([...prev, row.id]));
  };

  const applyAll = () => {
    threatRows.forEach(row => {
      if (!appliedIds.has(row.id)) applyThreatRow(row);
    });
  };

  const hasElements = diagramData.elements.length > 0;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6 h-[calc(100vh-0px)] flex flex-col bg-slate-50">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center ring-1 ring-slate-700/50">
              <LayoutTemplate className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Architecture Diagram</h1>
              <p className="text-xs font-mono text-slate-400 tracking-wider mt-0.5">map · connect · analyse · defend</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Project Selector */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
              <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="text-sm text-slate-700 bg-transparent outline-none cursor-pointer pr-1 font-medium"
              >
                <option value="">Select project...</option>
                {state.projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Save */}
            <button
              onClick={saveDiagram}
              disabled={!project}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all shadow-sm ${
                saved
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30'
              }`}
            >
              {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? 'Saved' : 'Save'}
            </button>

            {/* AI Analysis */}
            <button
              onClick={runAnalysis}
              disabled={!project || !hasElements || analysisState.status === 'running'}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-30 shadow-sm transition-all ring-1 ring-slate-700/50"
            >
              {analysisState.status === 'running' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-violet-400" />
              )}
              {analysisState.status === 'running' ? 'Analysing...' : 'AI Analysis'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* No project selected */}
      {!project && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-4 ring-1 ring-slate-700/50">
              <FolderKanban className="w-8 h-8 text-slate-600" />
            </div>
            <h2 className="text-base font-semibold text-slate-700 mb-1 tracking-tight">Select a Project</h2>
            <p className="text-xs font-mono text-slate-400 tracking-wider">choose a project above to begin</p>
          </div>
        </div>
      )}

      {/* Main content */}
      {project && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Minimal info strip */}
          <div className="px-4 py-2 bg-slate-900/5 border border-slate-200/80 rounded-xl mb-3 flex items-center gap-2.5 flex-shrink-0">
            <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-[11px] font-mono text-slate-500 tracking-wide">
              drag components from palette · use connector tool to draw data flows
              {hasElements && ' · click AI Analysis to identify threats'}
            </span>
          </div>

          {/* Canvas + Analysis split */}
          <div className={`flex-1 min-h-0 flex ${showAnalysis && threatRows.length > 0 ? 'gap-3' : ''}`}>
            {/* Canvas */}
            <div className={`${showAnalysis && threatRows.length > 0 ? 'flex-1' : 'w-full'} rounded-xl border border-slate-200 overflow-hidden shadow-sm`}>
              <ThreatModelCanvas
                value={diagramData}
                onChange={(data) => setDiagramData(data)}
              />
            </div>

            {/* AI Results Panel */}
            <AnimatePresence>
              {showAnalysis && threatRows.length > 0 && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 400, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="flex-shrink-0 bg-slate-900 rounded-xl border border-slate-700/60 overflow-hidden flex flex-col shadow-xl"
                >
                  <div className="px-4 py-3 border-b border-slate-700/60 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                      <Brain className="w-4 h-4 text-violet-400" />
                      <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-widest">Threat Intelligence</span>
                      <span className="text-[9px] font-mono bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full ring-1 ring-violet-500/30">
                        {threatRows.length}
                      </span>
                    </div>
                    <button
                      onClick={applyAll}
                      disabled={appliedIds.size >= threatRows.length}
                      className="text-[9px] font-mono text-blue-400 hover:text-blue-300 disabled:text-slate-600 uppercase tracking-widest transition-colors"
                    >
                      Apply All
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {threatRows.map(row => {
                      const applied = appliedIds.has(row.id);
                      const recs = Array.isArray(row.recommendations) ? row.recommendations : [];
                      const isExpanded = expandedThreat === row.id;
                      return (
                        <div
                          key={row.id}
                          className={`rounded-lg border text-sm transition-all ${
                            applied
                              ? 'bg-emerald-500/10 border-emerald-500/30'
                              : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                          }`}
                        >
                          {/* Threat header */}
                          <div className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                  {[row.strideCategory || row.stride?.[0]].filter(Boolean).map(s => (
                                    <span key={s} className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" style={{
                                      backgroundColor: (STRIDE_CATEGORIES[s]?.color || '#6b7280') + '25',
                                      color: STRIDE_CATEGORIES[s]?.color || '#6b7280',
                                    }}>{s}</span>
                                  ))}
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold" style={{
                                    backgroundColor: RISK_LEVELS[row.riskLevel || row.risk]?.bgColor || '#f3f4f6',
                                    color: RISK_LEVELS[row.riskLevel || row.risk]?.color || '#374151',
                                  }}>{row.riskLevel || row.risk}</span>
                                </div>
                                <p className="text-sm font-medium text-slate-200 leading-snug">{row.name || row.threat}</p>
                                {(row.rationale || row.description) && (
                                  <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{row.rationale || row.description}</p>
                                )}
                              </div>
                              <button
                                onClick={() => applyThreatRow(row)}
                                disabled={applied}
                                className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium transition-all uppercase tracking-wider ${
                                  applied
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                }`}
                              >
                                {applied ? (
                                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Added</span>
                                ) : 'Apply'}
                              </button>
                            </div>

                            {/* Toggle recommendations */}
                            {recs.length > 0 && (
                              <button
                                onClick={() => setExpandedThreat(isExpanded ? null : row.id)}
                                className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-violet-400 hover:text-violet-300 transition-colors"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                <span>{recs.length} control{recs.length > 1 ? 's' : ''}</span>
                                <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                            )}
                          </div>

                          {/* Controls recommendations */}
                          {isExpanded && recs.length > 0 && (
                            <div className="px-3 pb-3 border-t border-slate-700/40 pt-2.5">
                              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2">Control Recommendations</p>
                              <ul className="space-y-1.5">
                                {recs.map((rec, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-violet-500/15 text-violet-400 text-[9px] font-mono font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                                    <span className="text-[11px] text-slate-300 leading-relaxed">{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Analysis progress */}
          <AnimatePresence>
            {analysisState.status === 'running' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 px-4 py-3 bg-slate-900 border border-slate-700/60 rounded-xl flex items-center gap-3 flex-shrink-0 shadow-sm"
              >
                <Loader2 className="w-4 h-4 text-violet-400 animate-spin flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[11px] font-mono font-medium text-slate-300 tracking-wide">Running AI threat analysis...</p>
                  {analysisState.progress?.message && (
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5 tracking-wide">{analysisState.progress.message}</p>
                  )}
                </div>
              </motion.div>
            )}
            {analysisState.status === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 px-4 py-3 bg-red-950/50 border border-red-500/30 rounded-xl flex items-center gap-3 flex-shrink-0"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-[11px] font-mono text-red-400">{analysisState.error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
