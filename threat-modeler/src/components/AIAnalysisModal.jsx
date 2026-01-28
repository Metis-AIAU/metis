import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Network,
  Database,
  Sparkles,
  X,
  ChevronRight,
  Zap,
  Target,
  ArrowRight,
} from 'lucide-react';
import { analyzeProject } from '../services/aiAnalysis';
import { STRIDE_CATEGORIES, RISK_LEVELS } from '../context/ThreatContext';

const ANALYSIS_STEPS = [
  { id: 1, label: 'Analyzing project characteristics', icon: Brain },
  { id: 2, label: 'Identifying threats using STRIDE', icon: AlertTriangle },
  { id: 3, label: 'Recommending security controls', icon: Shield },
  { id: 4, label: 'Mapping system assets', icon: Database },
  { id: 5, label: 'Creating data flow diagram', icon: Network },
];

export default function AIAnalysisModal({ project, isOpen, onClose, onComplete }) {
  const [status, setStatus] = useState('idle'); // idle, analyzing, complete, error
  const [progress, setProgress] = useState({ step: 0, total: 5, message: '' });
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && project && status === 'idle') {
      startAnalysis();
    }
  }, [isOpen, project]);

  const startAnalysis = async () => {
    setStatus('analyzing');
    setProgress({ step: 0, total: 5, message: 'Initializing AI analysis...' });
    setError(null);

    try {
      const result = await analyzeProject(project, (progressUpdate) => {
        setProgress(progressUpdate);
      });

      if (result.success) {
        setResults(result);
        setStatus('complete');
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  const handleApplyResults = () => {
    if (results && onComplete) {
      onComplete(results);
    }
    handleClose();
  };

  const handleClose = () => {
    setStatus('idle');
    setProgress({ step: 0, total: 5, message: '' });
    setResults(null);
    setError(null);
    onClose();
  };

  const handleRetry = () => {
    setStatus('idle');
    setError(null);
    setTimeout(() => startAnalysis(), 100);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && status !== 'analyzing' && handleClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Brain className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">AI Threat Analysis</h2>
                  <p className="text-white/80 text-sm">Powered by STRIDE Methodology</p>
                </div>
              </div>
              {status !== 'analyzing' && (
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Project Info */}
            <div className="mt-4 p-3 bg-white/10 rounded-lg">
              <p className="text-sm text-white/70">Analyzing project:</p>
              <p className="font-semibold">{project?.name}</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Analyzing State */}
            {status === 'analyzing' && (
              <div className="space-y-6">
                {/* Progress Steps */}
                <div className="space-y-3">
                  {ANALYSIS_STEPS.map((step) => {
                    const isComplete = progress.step > step.id;
                    const isCurrent = progress.step === step.id;
                    const StepIcon = step.icon;

                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: step.id * 0.1 }}
                        className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                          isComplete
                            ? 'bg-green-50'
                            : isCurrent
                            ? 'bg-blue-50 ring-2 ring-blue-200'
                            : 'bg-gray-50'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isComplete
                              ? 'bg-green-500 text-white'
                              : isCurrent
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          {isComplete ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : isCurrent ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <StepIcon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`font-medium ${
                              isComplete
                                ? 'text-green-700'
                                : isCurrent
                                ? 'text-blue-700'
                                : 'text-gray-400'
                            }`}
                          >
                            {step.label}
                          </p>
                          {isCurrent && (
                            <p className="text-sm text-blue-500">{progress.message}</p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Analysis Progress</span>
                    <span className="font-medium text-blue-600">
                      {Math.round((progress.step / progress.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(progress.step / progress.total) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                  <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
                  <span>AI is analyzing your project for security threats...</span>
                </div>
              </div>
            )}

            {/* Complete State */}
            {status === 'complete' && results && (
              <div className="space-y-6">
                {/* Success Header */}
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4"
                  >
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900">Analysis Complete!</h3>
                  <p className="text-gray-500 mt-1">
                    AI has identified potential threats and recommended controls
                  </p>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-red-50 rounded-xl p-4 text-center"
                  >
                    <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-600">{results.summary.threatCount}</p>
                    <p className="text-xs text-red-600">Threats Found</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-green-50 rounded-xl p-4 text-center"
                  >
                    <Shield className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">{results.summary.controlCount}</p>
                    <p className="text-xs text-green-600">Controls Suggested</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-purple-50 rounded-xl p-4 text-center"
                  >
                    <Database className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-600">{results.summary.assetCount}</p>
                    <p className="text-xs text-purple-600">Assets Identified</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-blue-50 rounded-xl p-4 text-center"
                  >
                    <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">{results.summary.riskScore}</p>
                    <p className="text-xs text-blue-600">Avg Risk Score</p>
                  </motion.div>
                </div>

                {/* Critical/High Threats Alert */}
                {(results.summary.criticalThreats > 0 || results.summary.highThreats > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 border border-red-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-red-800">Attention Required</p>
                        <p className="text-sm text-red-600">
                          {results.summary.criticalThreats} critical and {results.summary.highThreats} high-risk threats identified
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Threat Preview */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Top Threats Identified:</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {results.threats.slice(0, 5).map((threat, index) => (
                      <motion.div
                        key={threat.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-center gap-3 p-2 bg-white rounded-lg"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: STRIDE_CATEGORIES[threat.strideCategory]?.color }}
                        >
                          {threat.strideCategory}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{threat.name}</p>
                        </div>
                        <span
                          className="badge text-xs"
                          style={{
                            backgroundColor: RISK_LEVELS[threat.riskLevel]?.bgColor,
                            color: RISK_LEVELS[threat.riskLevel]?.color,
                          }}
                        >
                          {RISK_LEVELS[threat.riskLevel]?.label}
                        </span>
                      </motion.div>
                    ))}
                    {results.threats.length > 5 && (
                      <p className="text-sm text-gray-400 text-center pt-2">
                        +{results.threats.length - 5} more threats
                      </p>
                    )}
                  </div>
                </div>

                {/* Characteristics */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-500">Detected characteristics:</span>
                  {results.summary.characteristics.map((char) => (
                    <span key={char} className="badge-info text-xs">
                      {char}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Analysis Failed</h3>
                <p className="text-gray-500 mb-4">{error || 'An error occurred during analysis'}</p>
                <button onClick={handleRetry} className="btn-primary">
                  <Loader2 className="w-4 h-4 mr-2" />
                  Retry Analysis
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {status === 'complete' && (
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  <Sparkles className="w-4 h-4 inline mr-1 text-purple-500" />
                  Results will be added to your project
                </p>
                <div className="flex items-center gap-3">
                  <button onClick={handleClose} className="btn-secondary">
                    Cancel
                  </button>
                  <button onClick={handleApplyResults} className="btn-primary">
                    Apply Results
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
