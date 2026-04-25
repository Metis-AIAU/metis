import { useState, useRef } from 'react';
import { fetchWithAuth } from '../services/fetchWithAuth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Code2, Map, GitBranch, Loader2, CheckCircle2,
  AlertTriangle, ChevronDown, ChevronUp, Upload, X,
  Plus, Minus, ArrowRight, Info, Sparkles, Shield,
  ExternalLink, TrendingUp, TrendingDown, AlertCircle,
} from 'lucide-react';
import { useThreatContext, STRIDE_CATEGORIES } from '../context/ThreatContext';

// ── Shared helpers ─────────────────────────────────────────────────────────────

const RISK_BG    = { CRITICAL:'#fee2e2', HIGH:'#ffedd5', MEDIUM:'#fef3c7', LOW:'#dcfce7', MINIMAL:'#e0f2fe' };
const RISK_COLOR = { CRITICAL:'#991b1b', HIGH:'#c2410c', MEDIUM:'#a16207', LOW:'#15803d', MINIMAL:'#0369a1' };

function RiskBadge({ level }) {
  if (!level) return null;
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: RISK_BG[level] || '#f3f4f6', color: RISK_COLOR[level] || '#374151' }}>
      {level}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    IMPLEMENTED: 'bg-green-100 text-green-700',
    PARTIAL:     'bg-yellow-100 text-yellow-700',
    MISSING:     'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  );
}

function ToolCard({ icon: Icon, color, title, subtitle, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        active
          ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${active ? 'bg-white/10' : ''}`}
        style={active ? {} : { backgroundColor: color + '18' }}>
        <Icon className="w-5 h-5" style={{ color: active ? 'white' : color }} />
      </div>
      <p className={`font-semibold text-sm ${active ? 'text-white' : 'text-gray-900'}`}>{title}</p>
      <p className={`text-xs mt-0.5 ${active ? 'text-slate-300' : 'text-gray-400'}`}>{subtitle}</p>
    </button>
  );
}

function FileDropzone({ label, accept, multiple, onFiles, files, onRemove }) {
  const inputRef = useRef();
  const onDrop = (e) => {
    e.preventDefault();
    const dropped = [...(e.dataTransfer?.files || [])];
    if (dropped.length) onFiles(dropped);
  };
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer"
      >
        <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1" />
        <p className="text-sm text-gray-500">Drop files here or <span className="text-blue-600 font-medium">browse</span></p>
        <p className="text-xs text-gray-400 mt-0.5">{accept}</p>
        <input ref={inputRef} type="file" className="hidden" multiple={multiple} onChange={e => onFiles([...e.target.files])} />
      </div>
      {files.length > 0 && (
        <div className="mt-2 space-y-1">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-xs">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              <span className="flex-1 font-mono text-gray-700 truncate">{f.name}</span>
              <span className="text-gray-400">{(f.size/1024).toFixed(0)}KB</span>
              <button onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                className="text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function readFileText(file) {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = e => resolve(e.target.result);
    r.readAsText(file);
  });
}

// ── Tool 1: Full Docs Analysis ─────────────────────────────────────────────────

function FullDocsPanel({ project }) {
  const { addThreat } = useThreatContext();
  const [docText, setDocText]   = useState('');
  const [docFiles, setDocFiles] = useState([]);
  const [result, setResult]     = useState(null);
  const [status, setStatus]     = useState('idle');
  const [error, setError]       = useState('');
  const [importing, setImporting] = useState(new Set());
  const [imported, setImported]   = useState(new Set());

  const run = async () => {
    if (!project) return;
    setStatus('loading'); setError(''); setResult(null);
    try {
      let combined = docText;
      for (const f of docFiles) combined += '\n\n' + await readFileText(f);
      if (!combined.trim()) { setError('Paste document text or upload files.'); setStatus('error'); return; }

      const r = await fetchWithAuth('/api/advanced/full-docs', {
        method: 'POST',
        body: JSON.stringify({ project, docContent: combined }),
      });
      const data = await r.json();
      if (!data.success) throw new Error(data.error);
      setResult(data);
      setStatus('done');
    } catch (e) { setError(e.message); setStatus('error'); }
  };

  const importThreat = (t) => {
    setImporting(p => new Set([...p, t.id]));
    addThreat({ ...t, projectId: project?.id });
    setTimeout(() => {
      setImporting(p => { const n = new Set(p); n.delete(t.id); return n; });
      setImported(p => new Set([...p, t.id]));
    }, 600);
  };

  const importAll = () => result?.threats?.filter(t => !imported.has(t.id)).forEach(importThreat);

  return (
    <div className="space-y-5">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 flex items-start gap-2">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>Paste architecture docs (README, design specs, API docs, network diagrams described in text) and Metis will extract components, data flows, and generate a full STRIDE threat model traceable to the documentation.</span>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Architecture Document Text</label>
        <textarea
          className="w-full h-40 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono text-gray-800 resize-none outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Paste README, design docs, system description, API specs, network topology..."
          value={docText}
          onChange={e => setDocText(e.target.value)}
        />
      </div>

      <FileDropzone label="Or upload files" accept=".md .txt .yaml .json .pdf" multiple
        files={docFiles}
        onFiles={fs => setDocFiles(p => [...p, ...fs])}
        onRemove={i => setDocFiles(p => p.filter((_, j) => j !== i))}
      />

      <button onClick={run} disabled={status === 'loading' || !project}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-40 transition-all">
        {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {status === 'loading' ? 'Analysing docs...' : 'Generate Threat Model from Docs'}
      </button>

      {status === 'error' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {result.architectureSummary && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Architecture Summary</p>
              <p className="text-sm text-slate-700">{result.architectureSummary}</p>
            </div>
          )}

          {result.components?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Extracted Components ({result.components.length})</p>
              <div className="flex flex-wrap gap-2">
                {result.components.map((c, i) => (
                  <span key={i} className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs text-blue-700 font-medium">{c.name}</span>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Generated Threats ({result.threats?.length || 0})
              </p>
              {result.threats?.length > 0 && (
                <button onClick={importAll}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium">Import All →</button>
              )}
            </div>
            <div className="space-y-2">
              {result.threats?.map(t => (
                <div key={t.id} className="border border-gray-200 rounded-xl p-3 bg-white">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: STRIDE_CATEGORIES[t.strideCategory]?.color || '#6b7280' }}>
                      {t.strideCategory}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                        <RiskBadge level={t.riskLevel} />
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{t.description}</p>
                      {t.rationale && <p className="text-xs text-blue-600 mt-1 italic line-clamp-1">📎 {t.rationale}</p>}
                    </div>
                    <button onClick={() => importThreat(t)} disabled={imported.has(t.id)}
                      className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        imported.has(t.id) ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}>
                      {importing.has(t.id) ? <Loader2 className="w-3 h-3 animate-spin" /> :
                       imported.has(t.id) ? <CheckCircle2 className="w-3 h-3" /> : 'Import'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Tool 2: Verify Controls ────────────────────────────────────────────────────

function VerifyPanel({ project, threats }) {
  const [codeFiles, setCodeFiles] = useState([]);
  const [result, setResult]       = useState(null);
  const [status, setStatus]       = useState('idle');
  const [error, setError]         = useState('');
  const [expanded, setExpanded]   = useState(null);

  const run = async () => {
    if (!codeFiles.length) { setError('Upload at least one source code file.'); setStatus('error'); return; }
    setStatus('loading'); setError(''); setResult(null);
    try {
      const files = await Promise.all(codeFiles.map(async f => ({ name: f.name, content: await readFileText(f) })));
      const r = await fetchWithAuth('/api/advanced/verify', {
        method: 'POST',
        body: JSON.stringify({ project, threats, codeFiles: files }),
      });
      const data = await r.json();
      if (!data.success) throw new Error(data.error);
      setResult(data);
      setStatus('done');
    } catch (e) { setError(e.message); setStatus('error'); }
  };

  return (
    <div className="space-y-5">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-start gap-2">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>Upload your source code files and Metis will scan them to find where security controls (auth, input validation, encryption, logging) are actually implemented — with file name and line number evidence.</span>
      </div>

      <FileDropzone label="Source code files" accept=".js .ts .py .go .java .cs .rb .php .jsx .tsx" multiple
        files={codeFiles}
        onFiles={fs => setCodeFiles(p => [...p, ...fs])}
        onRemove={i => setCodeFiles(p => p.filter((_, j) => j !== i))}
      />

      <button onClick={run} disabled={status === 'loading' || !codeFiles.length}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-40 transition-all">
        {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Code2 className="w-4 h-4" />}
        {status === 'loading' ? 'Scanning code...' : 'Verify Controls in Code'}
      </button>

      {status === 'error' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Coverage bar */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-900">Overall Control Coverage</p>
              <span className="text-2xl font-bold text-gray-900">{result.overallCoverage ?? 0}%</span>
            </div>
            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{
                  width: `${result.overallCoverage ?? 0}%`,
                  backgroundColor: (result.overallCoverage ?? 0) >= 70 ? '#22c55e' :
                                   (result.overallCoverage ?? 0) >= 40 ? '#f59e0b' : '#ef4444',
                }} />
            </div>
            {result.summary && <p className="text-xs text-gray-500 mt-2">{result.summary}</p>}
          </div>

          {result.criticalGaps?.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">Critical Gaps</p>
              <ul className="space-y-1">
                {result.criticalGaps.map((g, i) => (
                  <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            {result.controls?.map((c, i) => {
              const isOpen = expanded === i;
              return (
                <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setExpanded(isOpen ? null : i)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                    <StatusBadge status={c.status} />
                    <p className="flex-1 text-sm font-medium text-gray-900">{c.controlName}</p>
                    {c.evidence?.length > 0 && (
                      <span className="text-xs text-gray-400 font-mono">{c.evidence.length} reference{c.evidence.length !== 1 ? 's' : ''}</span>
                    )}
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {isOpen && (
                    <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-3">
                      {c.evidence?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Code Evidence</p>
                          {c.evidence.map((ev, j) => (
                            <div key={j} className="flex items-start gap-2 mb-2">
                              <Code2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-mono text-blue-700">
                                  {ev.file}{ev.line ? `:${ev.line}` : ''}
                                </p>
                                {ev.snippet && (
                                  <code className="block text-xs bg-gray-900 text-green-400 px-2 py-1 rounded mt-1 font-mono">
                                    {ev.snippet}
                                  </code>
                                )}
                                {ev.description && <p className="text-xs text-gray-500 mt-1">{ev.description}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {c.gap && (
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-xs font-semibold text-yellow-700 mb-0.5">Gap / Improvement</p>
                          <p className="text-xs text-yellow-700">{c.gap}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Tool 3: Compliance Mapping ─────────────────────────────────────────────────

const FRAMEWORK_META = {
  OWASP_Top10: { label: 'OWASP Top 10', color: '#dc2626' },
  SOC2:        { label: 'SOC 2',        color: '#7c3aed' },
  PCI_DSS:     { label: 'PCI-DSS v4',   color: '#b45309' },
  ISO27001:    { label: 'ISO 27001',    color: '#0369a1' },
  NIST_CSF:    { label: 'NIST CSF',     color: '#15803d' },
};

function ComplianceMapPanel({ project, threats }) {
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError]   = useState('');
  const [expanded, setExpanded] = useState(null);

  const run = async () => {
    if (!threats.length) { setError('Project has no threats — run AI Analysis first.'); setStatus('error'); return; }
    setStatus('loading'); setError(''); setResult(null);
    try {
      const r = await fetchWithAuth('/api/advanced/compliance-map', {
        method: 'POST',
        body: JSON.stringify({ project, threats }),
      });
      const data = await r.json();
      if (!data.success) throw new Error(data.error);
      setResult(data);
      setStatus('done');
    } catch (e) { setError(e.message); setStatus('error'); }
  };

  return (
    <div className="space-y-5">
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-800 flex items-start gap-2">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>Maps every threat in the project to specific requirements in OWASP Top 10, SOC 2, PCI-DSS v4, ISO 27001, and NIST CSF — with requirement IDs and coverage scores.</span>
      </div>

      <button onClick={run} disabled={status === 'loading' || !threats.length}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-40 transition-all">
        {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Map className="w-4 h-4" />}
        {status === 'loading' ? 'Mapping to frameworks...' : `Map ${threats.length} Threats to Compliance Frameworks`}
      </button>

      {status === 'error' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Framework coverage scores */}
          {result.frameworkCoverage && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Framework Coverage</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(FRAMEWORK_META).map(([key, meta]) => {
                  const cov = result.frameworkCoverage?.[key];
                  const score = cov?.score ?? 0;
                  return (
                    <div key={key} className="border border-gray-200 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold" style={{ color: meta.color }}>{score}%</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{meta.label}</p>
                      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: meta.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {result.gaps?.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-2">Unmapped Compliance Areas</p>
              <ul className="space-y-1">
                {result.gaps.map((g, i) => (
                  <li key={i} className="text-xs text-yellow-700 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Per-threat mappings */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Threat → Framework Mapping</p>
            <div className="space-y-2">
              {result.mappings?.map((m, i) => {
                const isOpen = expanded === i;
                return (
                  <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => setExpanded(isOpen ? null : i)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors">
                      <span className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: STRIDE_CATEGORIES[m.strideCategory]?.color || '#6b7280' }}>
                        {m.strideCategory}
                      </span>
                      <p className="flex-1 text-sm font-medium text-gray-900">{m.threatName}</p>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {Object.entries(m.frameworks || {}).filter(([,v]) => v?.relevance === 'HIGH').map(([k]) => (
                          <span key={k} className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold text-white"
                            style={{ backgroundColor: FRAMEWORK_META[k]?.color || '#6b7280' }}>
                            {FRAMEWORK_META[k]?.label?.split(' ')[0] || k}
                          </span>
                        ))}
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {Object.entries(m.frameworks || {}).map(([fk, fv]) => {
                            const meta = FRAMEWORK_META[fk];
                            if (!meta || !fv?.id) return null;
                            const relColor = fv.relevance === 'HIGH' ? 'border-red-200 bg-red-50' :
                                             fv.relevance === 'MEDIUM' ? 'border-yellow-200 bg-yellow-50' :
                                             'border-gray-200 bg-white';
                            return (
                              <div key={fk} className={`border rounded-lg p-2.5 ${relColor}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white"
                                    style={{ backgroundColor: meta.color }}>{meta.label}</span>
                                  <span className="text-xs font-mono font-bold text-gray-700">{fv.id}</span>
                                </div>
                                <p className="text-xs text-gray-600">{fv.name}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Tool 4: Drift Detection ────────────────────────────────────────────────────

function DriftPanel({ project, threats, addThreat }) {
  const [diffText, setDiffText]   = useState('');
  const [diffFiles, setDiffFiles] = useState([]);
  const [result, setResult]       = useState(null);
  const [status, setStatus]       = useState('idle');
  const [error, setError]         = useState('');
  const [imported, setImported]   = useState(new Set());

  const run = async () => {
    setStatus('loading'); setError(''); setResult(null);
    try {
      let combined = diffText;
      for (const f of diffFiles) combined += '\n\n' + await readFileText(f);
      if (!combined.trim()) { setError('Paste a git diff or upload changed files.'); setStatus('error'); return; }

      const r = await fetchWithAuth('/api/advanced/drift', {
        method: 'POST',
        body: JSON.stringify({ project, threats, diffContent: combined }),
      });
      const data = await r.json();
      if (!data.success) throw new Error(data.error);
      setResult(data);
      setStatus('done');
    } catch (e) { setError(e.message); setStatus('error'); }
  };

  const importNewThreat = (t) => {
    addThreat({ ...t, projectId: project?.id });
    setImported(p => new Set([...p, t.id]));
  };

  const CHANGE_ICONS = {
    INCREASED: <TrendingUp className="w-4 h-4 text-red-500" />,
    DECREASED: <TrendingDown className="w-4 h-4 text-green-500" />,
    REMOVED:   <CheckCircle2 className="w-4 h-4 text-green-600" />,
    NEW:       <Plus className="w-4 h-4 text-orange-500" />,
  };
  const CHANGE_LABEL = {
    INCREASED: 'Risk Increased',
    DECREASED: 'Risk Decreased',
    REMOVED:   'Threat Mitigated',
    NEW:       'New Threat',
  };

  const driftColors = {
    CRITICAL: 'bg-red-50 border-red-200 text-red-700',
    HIGH:     'bg-orange-50 border-orange-200 text-orange-700',
    MEDIUM:   'bg-yellow-50 border-yellow-200 text-yellow-700',
    LOW:      'bg-green-50 border-green-200 text-green-700',
    NONE:     'bg-gray-50 border-gray-200 text-gray-600',
  };

  return (
    <div className="space-y-5">
      <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 flex items-start gap-2">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>Paste a <code className="bg-green-100 px-1 rounded font-mono text-xs">git diff</code> or upload changed files. Metis will detect which existing threats are now more or less likely, flag removed security controls, and surface any new attack surface introduced by the changes.</span>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Git Diff or Changed Code</label>
        <textarea
          className="w-full h-40 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-mono text-gray-800 resize-none outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Paste git diff output here...&#10;&#10;$ git diff HEAD~1 HEAD"
          value={diffText}
          onChange={e => setDiffText(e.target.value)}
        />
      </div>

      <FileDropzone label="Or upload changed files" accept=".js .ts .py .go .java .diff .patch" multiple
        files={diffFiles}
        onFiles={fs => setDiffFiles(p => [...p, ...fs])}
        onRemove={i => setDiffFiles(p => p.filter((_, j) => j !== i))}
      />

      <button onClick={run} disabled={status === 'loading'}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-40 transition-all">
        {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
        {status === 'loading' ? 'Detecting drift...' : 'Detect Security Drift'}
      </button>

      {status === 'error' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Drift severity banner */}
          <div className={`p-4 border rounded-xl ${driftColors[result.driftSeverity] || driftColors.NONE}`}>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Drift Severity: {result.driftSeverity}</p>
                {result.summary && <p className="text-xs mt-0.5 opacity-80">{result.summary}</p>}
              </div>
              {result.requiresReview && (
                <span className="ml-auto px-2 py-0.5 bg-white/50 rounded-full text-xs font-bold border border-current">
                  ⚠ Review Required
                </span>
              )}
            </div>
          </div>

          {result.removedControls?.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">Removed / Weakened Controls</p>
              <ul className="space-y-1">
                {result.removedControls.map((c, i) => (
                  <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                    <Minus className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.affectedThreats?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Affected Threats ({result.affectedThreats.length})</p>
              <div className="space-y-2">
                {result.affectedThreats.map((a, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-3 bg-white">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">{CHANGE_ICONS[a.changeType]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">{a.threatName}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            a.changeType === 'INCREASED' ? 'bg-red-100 text-red-700' :
                            a.changeType === 'NEW' ? 'bg-orange-100 text-orange-700' :
                            'bg-green-100 text-green-700'
                          }`}>{CHANGE_LABEL[a.changeType]}</span>
                          {a.newRiskLevel && <RiskBadge level={a.newRiskLevel} />}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{a.reason}</p>
                        {a.codeEvidence && (
                          <code className="text-xs text-blue-600 font-mono mt-0.5 block">{a.codeEvidence}</code>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.newThreats?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                New Threats Introduced ({result.newThreats.length})
              </p>
              <div className="space-y-2">
                {result.newThreats.map(t => (
                  <div key={t.id} className="border border-orange-200 bg-orange-50 rounded-xl p-3">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: STRIDE_CATEGORIES[t.strideCategory]?.color || '#f97316' }}>
                        {t.strideCategory}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-gray-900">{t.name}</p>
                          <RiskBadge level={t.riskLevel} />
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{t.description}</p>
                        <p className="text-xs text-orange-700 italic mt-1">📎 {t.rationale}</p>
                      </div>
                      <button onClick={() => importNewThreat(t)} disabled={imported.has(t.id)}
                        className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          imported.has(t.id) ? 'bg-green-100 text-green-700' : 'bg-white border border-orange-300 text-orange-700 hover:bg-orange-100'
                        }`}>
                        {imported.has(t.id) ? <CheckCircle2 className="w-3.5 h-3.5" /> : 'Import'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

const TOOLS = [
  { id: 'full-docs',   icon: FileText,  color: '#3b82f6', title: 'Full Docs Analysis',  subtitle: 'Generate threats from architecture docs' },
  { id: 'verify',      icon: Code2,     color: '#10b981', title: 'Verify Controls',      subtitle: 'Find file:line evidence in source code' },
  { id: 'compliance',  icon: Map,       color: '#8b5cf6', title: 'Compliance Mapping',   subtitle: 'Map threats to OWASP, SOC2, PCI-DSS, ISO' },
  { id: 'drift',       icon: GitBranch, color: '#f59e0b', title: 'Drift Detection',      subtitle: 'Detect security drift from code changes' },
];

export default function AdvancedAnalysis() {
  const [activeTool, setActiveTool] = useState('full-docs');
  const { state, addThreat, getProjectThreats, getProjectControls } = useThreatContext();

  const project = state.currentProject || state.projects[0] || null;
  const threats  = project ? getProjectThreats(project.id) : [];
  const controls = project ? getProjectControls(project.id) : [];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Advanced AI Analysis</h1>
            <p className="text-xs font-mono text-gray-400 tracking-wider mt-0.5">docs · verify · compliance · drift</p>
          </div>
        </div>
        {project && (
          <p className="text-sm text-gray-500 mt-3">
            Active project: <span className="font-semibold text-gray-800">{project.name}</span>
            {threats.length > 0 && <span className="text-gray-400"> · {threats.length} threats</span>}
          </p>
        )}
        {!project && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            No project selected. Open a project first to use these tools.
          </div>
        )}
      </motion.div>

      {/* Tool selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {TOOLS.map(t => (
          <ToolCard key={t.id} {...t} active={activeTool === t.id} onClick={() => setActiveTool(t.id)} />
        ))}
      </div>

      {/* Active tool panel */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTool}
          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.15 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
        >
          {activeTool === 'full-docs'  && <FullDocsPanel project={project} />}
          {activeTool === 'verify'     && <VerifyPanel project={project} threats={threats} />}
          {activeTool === 'compliance' && <ComplianceMapPanel project={project} threats={threats} controls={controls} />}
          {activeTool === 'drift'      && <DriftPanel project={project} threats={threats} addThreat={addThreat} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
