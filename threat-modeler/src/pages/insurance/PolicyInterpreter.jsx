import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, X, Loader2, AlertCircle, CheckCircle2,
  Filter, Sparkles, Trash2, ClipboardList,
} from 'lucide-react';
import { useInsurance } from '../../context/InsuranceContext';
import { useOrg } from '../../context/OrgContext';

const SAMPLE_REQUIREMENTS = [
  { id: 1, requirement: 'Multi-factor authentication must be enforced for all users accessing insured systems, including remote access.', severity: 'critical', section: 'Section 3.1', compliant: false },
  { id: 2, requirement: 'Endpoint Detection and Response (EDR) solution must be deployed on all endpoints with real-time monitoring.', severity: 'critical', section: 'Section 3.2', compliant: true },
  { id: 3, requirement: 'Data Loss Prevention (DLP) controls must be implemented for all outbound email and cloud storage.', severity: 'critical', section: 'Section 3.3', compliant: false },
  { id: 4, requirement: 'All critical systems must have offline immutable backups tested quarterly.', severity: 'high', section: 'Section 4.1', compliant: false },
  { id: 5, requirement: 'Privileged access must be managed via a PAM solution with session recording for all admin accounts.', severity: 'high', section: 'Section 4.2', compliant: false },
  { id: 6, requirement: 'Vulnerability scanning must be performed weekly with critical patches applied within 30 days.', severity: 'high', section: 'Section 4.3', compliant: false },
  { id: 7, requirement: 'An Incident Response plan must be documented and tested via tabletop exercise annually.', severity: 'high', section: 'Section 5.1', compliant: false },
  { id: 8, requirement: 'Security awareness training must be completed by all staff annually with phishing simulation quarterly.', severity: 'medium', section: 'Section 5.2', compliant: true },
  { id: 9, requirement: 'Email security gateway must be deployed with anti-phishing, anti-spam, and sandboxing capabilities.', severity: 'medium', section: 'Section 5.3', compliant: true },
  { id: 10, requirement: 'Network segmentation must be implemented to isolate critical systems from general user traffic.', severity: 'medium', section: 'Section 6.1', compliant: false },
  { id: 11, requirement: 'SIEM solution must aggregate logs from all critical systems with 90-day retention.', severity: 'medium', section: 'Section 6.2', compliant: true },
  { id: 12, requirement: 'Third-party vendor access must be controlled via time-limited, auditable remote access solutions.', severity: 'low', section: 'Section 7.1', compliant: false },
];

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const SEVERITY_STYLES = {
  critical: { className: 'bg-red-100 text-red-700',    label: 'Critical' },
  high:     { className: 'bg-amber-100 text-amber-700', label: 'High' },
  medium:   { className: 'bg-blue-100 text-blue-700',   label: 'Medium' },
  low:      { className: 'bg-gray-100 text-gray-600',   label: 'Low' },
};

const ACCEPTED = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
const MAX_BYTES = 8 * 1024 * 1024;

function SeverityBadge({ severity }) {
  const s = SEVERITY_STYLES[severity];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${s.className}`}>
      {s.label}
    </span>
  );
}

function CompliancePill({ compliant }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${
      compliant ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
    }`}>
      {compliant ? <CheckCircle2 className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
      {compliant ? 'Compliant' : 'Non-Compliant'}
    </span>
  );
}

export default function PolicyInterpreter() {
  const { state, setPolicyRequirements, setPolicyLoading, setPolicyError, clearPolicy } = useInsurance();
  const { fetchWithAuth } = useOrg();

  const [inputMode, setInputMode] = useState('upload');
  const [pasteText, setPasteText] = useState('');
  const [file, setFile]     = useState(null);
  const [drag, setDrag]     = useState(false);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const fileRef = useRef(null);

  const requirements = state.policyRequirements;
  const hasResults   = requirements.length > 0;

  const compliantCount    = requirements.filter(r => r.compliant).length;
  const nonCompliantCount = requirements.filter(r => !r.compliant).length;
  const complianceRate    = requirements.length > 0 ? Math.round((compliantCount / requirements.length) * 100) : 0;

  const filtered = filterSeverity === 'all' ? requirements : requirements.filter(r => r.severity === filterSeverity);

  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) { setPolicyError('Only PDF, DOC, DOCX accepted.'); return; }
    if (f.size > MAX_BYTES)         { setPolicyError('File exceeds 8 MB limit.');      return; }
    setFile(f); setPolicyError(null);
  }, [setPolicyError]);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const readBase64 = (f) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(f);
  });

  const runAnalysis = async () => {
    setPolicyLoading(true);
    if (inputMode === 'sample') {
      await new Promise(r => setTimeout(r, 1200));
      setPolicyRequirements(SAMPLE_REQUIREMENTS);
      return;
    }
    try {
      let body = {};
      if (inputMode === 'upload' && file) {
        const b64 = await readBase64(file);
        body = { documentBase64: b64, documentMimeType: file.type, documentName: file.name };
      } else if (inputMode === 'paste' && pasteText.trim()) {
        body = { policyText: pasteText.trim() };
      } else {
        setPolicyError('Provide a file or paste policy text.'); setPolicyLoading(false); return;
      }
      const res  = await fetchWithAuth('/api/insurance/policy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: AbortSignal.timeout(120_000),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Analysis failed');
      setPolicyRequirements(data.requirements);
    } catch (err) {
      setPolicyError(err.name === 'TimeoutError' ? 'Request timed out — try again.' : err.message);
    }
  };

  const canRun = inputMode === 'sample'
    || (inputMode === 'upload' && file)
    || (inputMode === 'paste' && pasteText.trim().length > 50);

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-xs font-bold tracking-widest uppercase text-amber-600 mb-1">Cyber Insurance & Accountability</p>
        <h1 className="text-3xl font-bold text-gray-900">Policy Interpreter</h1>
        <p className="text-gray-500 mt-1">Upload your cyber insurance policy — AI extracts security requirements and maps them to your controls.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input panel */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Policy Input</h2>

            {/* Mode tabs */}
            <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-5">
              {[{ key: 'upload', label: 'Upload PDF' }, { key: 'paste', label: 'Paste Text' }, { key: 'sample', label: 'Sample Data' }].map(m => (
                <button key={m.key} onClick={() => { setInputMode(m.key); clearPolicy(); setFile(null); }}
                  className={`flex-1 py-2 text-xs font-bold transition-all ${
                    inputMode === m.key ? 'bg-amber-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Upload zone */}
            {inputMode === 'upload' && (
              <div onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)} onDrop={handleDrop}
                onClick={() => !file && fileRef.current?.click()}
                className={`rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer transition-all border-2 border-dashed ${
                  drag ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`} style={{ minHeight: 140 }}>
                {file ? (
                  <div className="text-center">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                    <p className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">{file.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                    <button onClick={e => { e.stopPropagation(); setFile(null); }}
                      className="mt-3 flex items-center gap-1 text-xs font-semibold text-red-500 mx-auto">
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mb-2 text-gray-300" />
                    <p className="text-sm text-gray-500 text-center">Drop policy here or click to browse</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX · max 8 MB</p>
                  </>
                )}
              </div>
            )}
            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={e => handleFile(e.target.files[0])} />

            {/* Paste zone */}
            {inputMode === 'paste' && (
              <textarea value={pasteText} onChange={e => setPasteText(e.target.value)}
                placeholder="Paste your insurance policy text here..."
                className="w-full rounded-xl p-4 text-sm text-gray-700 resize-none focus:outline-none border border-gray-200 bg-gray-50 focus:border-amber-300"
                style={{ minHeight: 160 }} />
            )}

            {/* Sample info */}
            {inputMode === 'sample' && (
              <div className="rounded-xl p-4 text-center bg-amber-50 border border-amber-100">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                <p className="text-sm font-semibold text-gray-700">Uses built-in sample policy</p>
                <p className="text-xs text-gray-400 mt-1">12 requirements across 4 severity levels</p>
              </div>
            )}

            {state.policyAnalysisError && (
              <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-red-50 border border-red-100">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
                <p className="text-xs text-red-600">{state.policyAnalysisError}</p>
              </div>
            )}

            <button onClick={runAnalysis} disabled={!canRun || state.policyAnalysisLoading}
              className="mt-5 w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={{ background: canRun && !state.policyAnalysisLoading ? '#f59e0b' : '#fde68a', color: canRun && !state.policyAnalysisLoading ? '#fff' : '#92400e' }}>
              {state.policyAnalysisLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing…</>
                : <><Sparkles className="w-4 h-4" /> Analyse Policy</>}
            </button>

            {hasResults && (
              <button onClick={clearPolicy} className="mt-2 w-full py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-all">
                Clear Results
              </button>
            )}
          </div>
        </motion.div>

        {/* Results */}
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {!hasResults && !state.policyAnalysisLoading ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="card flex flex-col items-center justify-center py-24 text-center">
                <FileText className="w-12 h-12 mb-4 text-gray-200" />
                <p className="text-gray-500 font-medium">No policy analysed yet</p>
                <p className="text-gray-400 text-sm mt-1">Select an input method and run analysis</p>
              </motion.div>
            ) : state.policyAnalysisLoading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="card flex flex-col items-center justify-center py-24 text-center">
                <div className="w-12 h-12 rounded-full border-2 border-t-transparent border-amber-400 animate-spin mb-4" />
                <p className="text-gray-700 font-semibold">AI is reading your policy…</p>
                <p className="text-gray-400 text-sm mt-1">Extracting requirements and mapping to controls</p>
              </motion.div>
            ) : (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Total Requirements', value: requirements.length,  color: 'text-gray-900' },
                    { label: 'Compliant',           value: compliantCount,       color: 'text-green-600' },
                    { label: 'Non-Compliant',       value: nonCompliantCount,    color: 'text-red-600' },
                    { label: 'Compliance Rate',     value: `${complianceRate}%`, color: complianceRate >= 70 ? 'text-green-600' : complianceRate >= 40 ? 'text-amber-600' : 'text-red-600' },
                  ].map(m => (
                    <div key={m.label} className="card text-center p-4">
                      <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                      <p className="text-xs text-gray-400 mt-1 leading-tight">{m.label}</p>
                    </div>
                  ))}
                </div>

                {/* Requirements list */}
                <div className="card p-0 overflow-hidden">
                  {/* Filter bar */}
                  <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 flex-wrap">
                    <Filter className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-400 font-semibold mr-1">Filter:</span>
                    {['all', 'critical', 'high', 'medium', 'low'].map(f => (
                      <button key={f} onClick={() => setFilterSeverity(f)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all capitalize ${
                          filterSeverity === f
                            ? (SEVERITY_STYLES[f]?.className || 'bg-amber-100 text-amber-700')
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}>
                        {f}
                      </button>
                    ))}
                  </div>

                  <div className="divide-y divide-gray-50">
                    {filtered
                      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
                      .map((req, i) => (
                        <motion.div key={req.id}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                          className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700 leading-relaxed">{req.requirement}</p>
                              <p className="text-xs text-gray-400 mt-1 font-mono">{req.section}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                              <SeverityBadge severity={req.severity} />
                              <CompliancePill compliant={req.compliant} />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    {filtered.length === 0 && (
                      <div className="px-5 py-8 text-center text-gray-400 text-sm">
                        No requirements match this filter.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
