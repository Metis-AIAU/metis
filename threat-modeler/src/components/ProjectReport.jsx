import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Printer, FileDown, ExternalLink, AlertTriangle, Shield,
  TrendingDown, CheckCircle2, XCircle, MinusCircle, ChevronDown,
  ChevronUp, GitBranch, Loader2, CheckCircle,
} from 'lucide-react';
import { STRIDE_CATEGORIES } from '../context/ThreatContext';

// ── Risk helpers ──────────────────────────────────────────────────────────────
const RISK_COLORS = {
  CRITICAL: '#991b1b', HIGH: '#c2410c', MEDIUM: '#a16207', LOW: '#15803d', MINIMAL: '#0369a1',
};
const RISK_BG = {
  CRITICAL: '#fee2e2', HIGH: '#ffedd5', MEDIUM: '#fef3c7', LOW: '#dcfce7', MINIMAL: '#e0f2fe',
};

function riskBadge(level) {
  if (!level) return null;
  return (
    <span style={{ background: RISK_BG[level], color: RISK_COLORS[level] }}
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap">
      {level}
    </span>
  );
}

// ── Confluence export ─────────────────────────────────────────────────────────
async function publishToConfluence({ config, project, threats, controls, summary }) {
  const { baseUrl, email, apiToken, spaceKey } = config;
  if (!baseUrl || !email || !apiToken || !spaceKey) {
    throw new Error('Confluence configuration incomplete — check Settings.');
  }

  const date = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });

  // Build Confluence Storage Format (XHTML)
  const strideRows = Object.entries(STRIDE_CATEGORIES).map(([k, v]) => {
    const count = threats.filter(t => t.strideCategory === k).length;
    return `<tr><td><strong>${k}</strong> — ${v.name}</td><td>${count}</td></tr>`;
  }).join('');

  const threatRows = threats.map(t => {
    const residual = t.residualRiskScore != null
      ? `${t.residualRiskLevel || ''} (${t.residualRiskScore})`
      : '—';
    const recs = (t.recommendations || []).slice(0, 2).map(r => `<li>${typeof r === 'object' ? r.name : r}</li>`).join('');
    return `
<tr>
  <td><strong>${t.name || t.threat || ''}</strong><br/><em>${t.strideCategory}</em></td>
  <td>${t.description || t.rationale || ''}</td>
  <td><ac:structured-macro ac:name="status"><ac:parameter ac:name="colour">${
    t.riskLevel === 'CRITICAL' ? 'Red' : t.riskLevel === 'HIGH' ? 'Red' :
    t.riskLevel === 'MEDIUM' ? 'Yellow' : 'Green'
  }</ac:parameter><ac:parameter ac:name="title">${t.riskLevel || ''}</ac:parameter></ac:structured-macro></td>
  <td>${t.likelihood || ''}×${t.impact || ''} = ${t.riskScore || ''}</td>
  <td>${residual}</td>
  <td><ul>${recs}</ul></td>
</tr>`;
  }).join('');

  const body = `
<ac:structured-macro ac:name="info">
  <ac:parameter ac:name="title">AI-Generated Threat Model Report</ac:parameter>
  <ac:rich-text-body><p>Generated on <strong>${date}</strong> by Threat Modeler. This report contains AI-assisted STRIDE threat analysis.</p></ac:rich-text-body>
</ac:structured-macro>

<h2>Executive Summary</h2>
<table>
  <tr><th>Project</th><td>${project.name}</td><th>Industry</th><td>${project.industry || '—'}</td></tr>
  <tr><th>Owner</th><td>${project.owner || '—'}</td><th>Criticality</th><td>${project.criticality || '—'}</td></tr>
  <tr><th>Architecture</th><td>${project.architectureType || '—'}</td><th>Network Exposure</th><td>${project.networkExposure || '—'}</td></tr>
  <tr><th>Compliance Frameworks</th><td colspan="3">${(project.complianceFrameworks || []).join(', ') || '—'}</td></tr>
</table>

<h2>Risk Summary</h2>
<table>
  <tr><th>Total Threats</th><th>Critical</th><th>High</th><th>Medium</th><th>Low/Minimal</th><th>Controls</th></tr>
  <tr>
    <td>${summary.total}</td>
    <td><ac:structured-macro ac:name="status"><ac:parameter ac:name="colour">Red</ac:parameter><ac:parameter ac:name="title">${summary.critical}</ac:parameter></ac:structured-macro></td>
    <td><ac:structured-macro ac:name="status"><ac:parameter ac:name="colour">Red</ac:parameter><ac:parameter ac:name="title">${summary.high}</ac:parameter></ac:structured-macro></td>
    <td><ac:structured-macro ac:name="status"><ac:parameter ac:name="colour">Yellow</ac:parameter><ac:parameter ac:name="title">${summary.medium}</ac:parameter></ac:structured-macro></td>
    <td><ac:structured-macro ac:name="status"><ac:parameter ac:name="colour">Green</ac:parameter><ac:parameter ac:name="title">${summary.low}</ac:parameter></ac:structured-macro></td>
    <td>${controls.length}</td>
  </tr>
</table>

<h2>STRIDE Distribution</h2>
<table>
  <tr><th>Category</th><th>Count</th></tr>
  ${strideRows}
</table>

<h2>Threat Register</h2>
<table>
  <tr><th>Threat</th><th>Description</th><th>Risk Level</th><th>Score (L×I)</th><th>Residual Risk</th><th>Top Mitigations</th></tr>
  ${threatRows}
</table>

<h2>Controls</h2>
<table>
  <tr><th>Control</th><th>Type</th><th>Status</th></tr>
  ${controls.map(c => `<tr><td>${c.name}</td><td>${c.type || ''}</td><td>${c.status || ''}</td></tr>`).join('')}
</table>
`;

  const pageTitle = `Threat Model — ${project.name} — ${date}`;

  const payload = {
    type: 'page',
    title: pageTitle,
    space: { key: spaceKey },
    body: { storage: { value: body, representation: 'storage' } },
  };

  const resp = await fetch('/api/confluence/page', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config: { baseUrl, email, apiToken }, payload }),
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || `Confluence API error ${resp.status}`);
  return data; // { pageUrl, pageId }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProjectReport({ project, threats, controls, assets, onClose }) {
  const printRef = useRef(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [confluenceStatus, setConfluenceStatus] = useState('idle'); // idle | loading | success | error
  const [confluenceUrl, setConfluenceUrl] = useState('');
  const [confluenceError, setConfluenceError] = useState('');

  const date = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' });

  // Normalise threat fields
  const normalised = threats.map(t => ({
    ...t,
    name: t.name || t.threat || 'Unnamed',
    strideCategory: t.strideCategory || t.stride?.[0] || '?',
    riskLevel: t.riskLevel || t.risk || 'MEDIUM',
    riskScore: t.riskScore ?? ((t.likelihood || 3) * (t.impact || 3)),
  })).sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));

  const summary = {
    total:    normalised.length,
    critical: normalised.filter(t => t.riskLevel === 'CRITICAL').length,
    high:     normalised.filter(t => t.riskLevel === 'HIGH').length,
    medium:   normalised.filter(t => t.riskLevel === 'MEDIUM').length,
    low:      normalised.filter(t => ['LOW', 'MINIMAL'].includes(t.riskLevel)).length,
  };

  const avgResidualReduction = normalised.length > 0
    ? Math.round(normalised.reduce((sum, t) => {
        if (t.riskScore && t.residualRiskScore) return sum + (1 - t.residualRiskScore / t.riskScore);
        return sum;
      }, 0) / normalised.length * 100)
    : 0;

  const handlePrint = () => window.print();

  const handleConfluence = async () => {
    const raw = localStorage.getItem('confluenceConfig');
    if (!raw) {
      setConfluenceError('No Confluence configuration found. Go to Settings → Integrations to configure.');
      setConfluenceStatus('error');
      return;
    }
    const config = JSON.parse(raw);
    setConfluenceStatus('loading');
    setConfluenceError('');
    try {
      const result = await publishToConfluence({ config, project, threats: normalised, controls, summary });
      setConfluenceUrl(result.pageUrl);
      setConfluenceStatus('success');
    } catch (e) {
      setConfluenceError(e.message);
      setConfluenceStatus('error');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-8 print:bg-transparent print:block print:p-0 print:inset-auto"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 overflow-hidden print:shadow-none print:rounded-none print:mx-0 print:max-w-none"
        >
          {/* Toolbar — hidden on print */}
          <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                <FileDown className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Threat Model Report</p>
                <p className="text-xs text-gray-400 font-mono">{project.name} · {date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Confluence export */}
              <div className="flex items-center gap-2">
                {confluenceStatus === 'success' && confluenceUrl && (
                  <a href={confluenceUrl} target="_blank" rel="noreferrer"
                    className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                    <ExternalLink className="w-3 h-3" /> View in Confluence
                  </a>
                )}
                {confluenceStatus === 'error' && (
                  <span className="text-xs text-red-500 max-w-xs truncate" title={confluenceError}>{confluenceError}</span>
                )}
                <button
                  onClick={handleConfluence}
                  disabled={confluenceStatus === 'loading'}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                >
                  {confluenceStatus === 'loading' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : confluenceStatus === 'success' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <ExternalLink className="w-3.5 h-3.5" />
                  )}
                  {confluenceStatus === 'loading' ? 'Publishing...' :
                   confluenceStatus === 'success' ? 'Published!' : 'Export to Confluence'}
                </button>
              </div>

              <button onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-700 transition-colors">
                <Printer className="w-3.5 h-3.5" /> Print / PDF
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Report content */}
          <div ref={printRef} className="p-8 print:p-6">
            {/* Cover */}
            <div className="mb-10 pb-8 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">STRIDE Threat Model Report</p>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">{project.name}</h1>
                  {project.description && <p className="text-gray-500 mt-1 max-w-2xl">{project.description}</p>}
                </div>
                <div className="text-right text-sm text-gray-400 font-mono shrink-0 ml-6">
                  <p>Generated: {date}</p>
                  <p>AI Model: Claude Sonnet</p>
                </div>
              </div>
              {/* Project meta */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {[
                  { label: 'Owner', value: project.owner },
                  { label: 'Industry', value: project.industry },
                  { label: 'Architecture', value: project.architectureType },
                  { label: 'Criticality', value: project.criticality },
                  { label: 'Network Exposure', value: project.networkExposure },
                  { label: 'Auth Mechanism', value: project.authMechanism },
                  { label: 'Technology Stack', value: project.technologyStack },
                  { label: 'Data Residency', value: project.dataResidency },
                ].filter(m => m.value).map(m => (
                  <div key={m.label}>
                    <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">{m.label}</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{m.value}</p>
                  </div>
                ))}
              </div>
              {(project.complianceFrameworks || []).length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-1">Compliance Frameworks</p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.complianceFrameworks.map(f => (
                      <span key={f} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium">{f}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Risk summary cards */}
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" /> Risk Summary
              </h2>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  { label: 'Total', value: summary.total, bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900' },
                  { label: 'Critical', value: summary.critical, bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-800' },
                  { label: 'High',     value: summary.high,     bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800' },
                  { label: 'Medium',   value: summary.medium,   bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' },
                  { label: 'Low/Min',  value: summary.low,      bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-800' },
                  { label: 'Controls', value: controls.length,  bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-800' },
                ].map(card => (
                  <div key={card.label} className={`${card.bg} border ${card.border} rounded-xl p-3 text-center`}>
                    <p className={`text-2xl font-bold ${card.text}`}>{card.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5 font-mono">{card.label}</p>
                  </div>
                ))}
              </div>
              {avgResidualReduction > 0 && (
                <div className="mt-3 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <TrendingDown className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-800">
                    Average residual risk reduction after controls: <strong>{avgResidualReduction}%</strong>
                  </p>
                </div>
              )}
            </div>

            {/* STRIDE distribution */}
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-500" /> STRIDE Distribution
              </h2>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {Object.entries(STRIDE_CATEGORIES).map(([k, v]) => {
                  const count = normalised.filter(t => t.strideCategory === k).length;
                  const pct = normalised.length > 0 ? Math.round(count / normalised.length * 100) : 0;
                  return (
                    <div key={k} className="rounded-xl border border-gray-200 p-3 text-center">
                      <div className="w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: v.color }}>{k}</div>
                      <p className="text-lg font-bold text-gray-900">{count}</p>
                      <p className="text-[10px] font-mono text-gray-400 truncate">{v.name.split(' ')[0]}</p>
                      <div className="mt-1.5 h-1 rounded-full bg-gray-100">
                        <div className="h-1 rounded-full" style={{ width: `${pct}%`, backgroundColor: v.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Threat register */}
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" /> Threat Register
              </h2>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs uppercase tracking-wider w-8">#</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Threat</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs uppercase tracking-wider w-20">STRIDE</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs uppercase tracking-wider w-24">Risk</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs uppercase tracking-wider w-20">Score</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs uppercase tracking-wider w-28">Residual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {normalised.map((t, i) => {
                      const isOpen = expandedRow === t.id;
                      const linkedControls = controls.filter(c => c.linkedThreats?.includes(t.id));
                      return (
                        <>
                          <tr key={t.id}
                            onClick={() => setExpandedRow(isOpen ? null : t.id)}
                            className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                              i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                            }`}>
                            <td className="px-4 py-3 text-xs text-gray-400 font-mono">{i + 1}</td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900">{t.name}</p>
                              <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{t.description}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md text-white text-xs font-bold"
                                style={{ backgroundColor: STRIDE_CATEGORIES[t.strideCategory]?.color || '#6b7280' }}>
                                {t.strideCategory}
                              </span>
                            </td>
                            <td className="px-4 py-3">{riskBadge(t.riskLevel)}</td>
                            <td className="px-4 py-3 font-mono text-sm text-gray-700">
                              {t.likelihood && t.impact ? `${t.likelihood}×${t.impact}=${t.riskScore}` : t.riskScore || '—'}
                            </td>
                            <td className="px-4 py-3">
                              {t.residualRiskLevel ? (
                                <div className="flex items-center gap-1">
                                  {riskBadge(t.residualRiskLevel)}
                                  {t.residualRiskScore && (
                                    <span className="text-xs text-gray-400 font-mono">({t.residualRiskScore})</span>
                                  )}
                                </div>
                              ) : <span className="text-xs text-gray-400">—</span>}
                            </td>
                          </tr>
                          {isOpen && (
                            <tr key={`${t.id}-detail`} className="bg-blue-50/40 border-b border-gray-100">
                              <td />
                              <td colSpan={5} className="px-4 py-4">
                                {t.rationale && (
                                  <div className="mb-3">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Rationale</p>
                                    <p className="text-sm text-gray-700">{t.rationale}</p>
                                  </div>
                                )}
                                {(t.recommendations || []).length > 0 && (
                                  <div className="mb-3">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Recommended Controls</p>
                                    <ul className="space-y-1">
                                      {t.recommendations.map((r, ri) => (
                                        <li key={ri} className="text-sm text-gray-700 flex items-start gap-1.5">
                                          <Shield className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                                          {typeof r === 'object' ? `${r.name}${r.description ? ': ' + r.description : ''}` : r}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {t.residualRationale && (
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Residual Risk Rationale</p>
                                    <p className="text-sm text-gray-700">{t.residualRationale}</p>
                                  </div>
                                )}
                                {linkedControls.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-blue-100">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Applied Controls</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {linkedControls.map(c => (
                                        <span key={c.id} className="px-2 py-0.5 bg-green-50 border border-green-200 rounded-full text-xs text-green-700">
                                          {c.name}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
                {normalised.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">No threats recorded — run AI Analysis first.</div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2 print:hidden">Click a row to expand rationale and mitigations.</p>
            </div>

            {/* Controls summary */}
            {controls.length > 0 && (
              <div className="mb-10">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" /> Security Controls
                </h2>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs uppercase tracking-wider">Control</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs uppercase tracking-wider w-28">Type</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs uppercase tracking-wider w-32">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {controls.map((c, i) => (
                        <tr key={c.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                          <td className="px-4 py-2.5 font-medium text-gray-900">{c.name}</td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs">{c.type}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                              c.status === 'IMPLEMENTED' || c.status === 'VERIFIED' ? 'bg-green-50 text-green-700' :
                              c.status === 'IN_PROGRESS' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {c.status === 'IMPLEMENTED' || c.status === 'VERIFIED'
                                ? <CheckCircle2 className="w-3 h-3" />
                                : c.status === 'IN_PROGRESS'
                                ? <MinusCircle className="w-3 h-3" />
                                : <XCircle className="w-3 h-3" />}
                              {c.status?.replace('_', ' ') || 'NOT STARTED'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Assets */}
            {assets.length > 0 && (
              <div className="mb-10">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">System Assets</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {assets.map(a => (
                    <div key={a.id} className="border border-gray-200 rounded-xl p-3">
                      <p className="font-medium text-gray-900 text-sm">{a.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{a.type}</p>
                      {a.sensitivity && (
                        <span className={`mt-1.5 inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                          a.sensitivity === 'CRITICAL' ? 'bg-red-50 text-red-700' :
                          a.sensitivity === 'HIGH' ? 'bg-orange-50 text-orange-700' :
                          'bg-gray-50 text-gray-600'
                        }`}>{a.sensitivity}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-6 border-t border-gray-200 text-xs text-gray-400 font-mono flex items-center justify-between">
              <span>Threat Modeler · AI-Assisted STRIDE Analysis</span>
              <span>{date}</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
