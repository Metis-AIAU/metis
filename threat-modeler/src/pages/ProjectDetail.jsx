import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, AlertTriangle, Shield, Network, Tag, Calendar, Users,
  ChevronDown, ChevronUp, ChevronRight, Activity, TrendingDown,
  GitBranch, Eye, ClipboardCheck, Target, CheckCircle2,
  XCircle, MinusCircle, Info, LayoutGrid, FileDown,
} from 'lucide-react';
import { useThreatContext, STRIDE_CATEGORIES } from '../context/ThreatContext';
import ProjectReport from '../components/ProjectReport';

// ─── Constants ────────────────────────────────────────────────────────────────

const RISK_COLORS = {
  CRITICAL: '#991b1b', HIGH: '#c2410c', MEDIUM: '#f59e0b', LOW: '#84cc16', MINIMAL: '#22c55e',
};
const RISK_BG = {
  CRITICAL: '#fee2e2', HIGH: '#ffedd5', MEDIUM: '#fef3c7', LOW: '#ecfccb', MINIMAL: '#dcfce7',
};
const RISK_BORDER = {
  CRITICAL: '#fca5a5', HIGH: '#fdba74', MEDIUM: '#fde68a', LOW: '#bef264', MINIMAL: '#86efac',
};

const ATTACK_PATH_TEMPLATES = [
  { id: 'credential-compromise', name: 'Credential Compromise', color: '#8b5cf6', steps: ['S', 'I', 'E'],
    description: 'Attacker spoofs identity → extracts credentials → escalates privileges' },
  { id: 'data-exfiltration',     name: 'Data Exfiltration',    color: '#ef4444', steps: ['S', 'T', 'I'],
    description: 'Attacker gains entry → tampers with access controls → exfiltrates data' },
  { id: 'service-disruption',    name: 'Service Disruption',   color: '#ec4899', steps: ['D', 'T', 'R'],
    description: 'Attacker disrupts service → tampers with backups → covers tracks' },
  { id: 'insider-threat',        name: 'Insider Threat',       color: '#f59e0b', steps: ['R', 'I', 'E'],
    description: 'Insider denies actions → accesses sensitive info → escalates privileges' },
];

const COMPLIANCE_DEFS = {
  'essential-eight':   { name: 'Essential Eight',      region: 'AU', color: '#1d4ed8', requirements: ['Application control','Patch applications','Configure MS Office macros','User application hardening','Restrict admin privileges','Patch operating systems','MFA','Backup'] },
  'aescsf':            { name: 'AESCSF',               region: 'AU', color: '#7c3aed', requirements: ['Identify','Protect','Detect','Respond','Recover'] },
  'soci':              { name: 'SOCI Act',             region: 'AU', color: '#dc2626', requirements: ['Critical asset register','Risk management','Incident reporting','Exercises','Governance'] },
  'asd-ism':           { name: 'ASD ISM',              region: 'AU', color: '#059669', requirements: ['Access control','Audit logging','Cryptography','Network security','Personnel security','Physical security'] },
  'apra-cps234':       { name: 'APRA CPS 234',         region: 'AU', color: '#ea580c', requirements: ['Board accountability','Information asset classification','Information security controls','Incident management','Testing'] },
  'privacy-act':       { name: 'Privacy Act 1988',     region: 'AU', color: '#0891b2', requirements: ['Collection limitation','Data quality','Purpose specification','Access & correction','Data security','Openness'] },
  'notifiable-breach': { name: 'NDB Scheme',           region: 'AU', color: '#c026d3', requirements: ['Breach assessment','Notification to OAIC','Notification to individuals','Remediation'] },
  'pci-dss':           { name: 'PCI-DSS v4',           region: 'INTL', color: '#b45309', requirements: ['Network security','CHD protection','Vulnerability management','Access control','Monitoring','Security policy'] },
  'iso27001':          { name: 'ISO/IEC 27001',        region: 'INTL', color: '#0369a1', requirements: ['Information security policies','Asset management','Access control','Cryptography','Operations security','Incident management'] },
  'nist-csf':          { name: 'NIST CSF 2.0',         region: 'INTL', color: '#15803d', requirements: ['Govern','Identify','Protect','Detect','Respond','Recover'] },
  'sox':               { name: 'SOX',                  region: 'INTL', color: '#92400e', requirements: ['Financial controls','IT general controls','Change management','Access controls','Audit trails'] },
  'gdpr':              { name: 'GDPR',                 region: 'INTL', color: '#6d28d9', requirements: ['Lawful processing','Data subject rights','Data protection by design','Breach notification','Data transfers','DPO'] },
};

// Deterministic seeded random (for stable compliance scores)
function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  s = (s * 16807) % 2147483647;
  return (s - 1) / 2147483646;
}

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getComplianceScore(frameworkId, projectId, threats, controls) {
  const total = threats.length;
  const implemented = controls.filter(c => c.status === 'IMPLEMENTED' || c.status === 'VERIFIED').length;
  const base = total > 0 ? Math.min(0.85, implemented / Math.max(total, 1)) : 0.5;
  const seed = hashStr(frameworkId + projectId);
  const jitter = seededRandom(seed) * 0.25;
  return Math.min(98, Math.round((base + jitter) * 100));
}

function getRequirementStatus(req, _threats, controls, projectId) {
  const seed = hashStr(req + projectId);
  const r = seededRandom(seed);
  const ctrlRatio = controls.length > 0 ? controls.filter(c => c.status === 'IMPLEMENTED' || c.status === 'VERIFIED').length / controls.length : 0;
  const chance = ctrlRatio * 0.6 + r * 0.4;
  if (chance > 0.65) return 'pass';
  if (chance > 0.35) return 'partial';
  return 'fail';
}

// ─── Risk Badge ───────────────────────────────────────────────────────────────

function RiskBadge({ level, small }) {
  if (!level) return null;
  return (
    <span className={`inline-flex items-center rounded-full font-bold ${small ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs'}`}
      style={{ background: RISK_BG[level] || '#f3f4f6', color: RISK_COLORS[level] || '#374151' }}>
      {level}
    </span>
  );
}

// ─── Threat Table ─────────────────────────────────────────────────────────────

function ThreatTable({ threats, controls }) {
  const [expanded, setExpanded] = useState(null);

  const threatControls = (threatId) => controls.filter(c => c.linkedThreats?.includes(threatId));

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-3 py-3 text-left font-semibold text-gray-600 w-8">#</th>
            <th className="px-3 py-3 text-left font-semibold text-gray-600 w-16">STRIDE</th>
            <th className="px-3 py-3 text-left font-semibold text-gray-600">Threat</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-600 w-24">L × I</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-600 w-28">Initial Risk</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-600 w-28">Residual Risk</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-600 w-20">Controls</th>
            <th className="px-3 py-3 text-left font-semibold text-gray-600">Top Mitigation</th>
            <th className="px-3 py-3 w-8"></th>
          </tr>
        </thead>
        <tbody>
          {threats.map((t, i) => {
            const cat = STRIDE_CATEGORIES[t.strideCategory] || {};
            const ctrls = threatControls(t.id);
            const isOpen = expanded === t.id;
            const topRec = t.recommendations?.[0] || '—';
            const reduction = t.riskScore && t.residualRiskScore
              ? Math.round((1 - t.residualRiskScore / t.riskScore) * 100)
              : null;
            return (
              <>
                <tr key={t.id}
                  className={`border-b border-gray-100 transition-colors ${isOpen ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                  <td className="px-3 py-3 text-gray-400 font-mono text-xs">{i + 1}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-white text-xs font-bold"
                      style={{ backgroundColor: cat.color || '#6b7280' }}>
                      {t.strideCategory}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-gray-900 leading-snug">{t.name}</p>
                    {t.affectedComponents?.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">{t.affectedComponents.join(', ')}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="font-mono text-gray-700">
                      {t.likelihood ?? '?'} × {t.impact ?? '?'} = <strong>{t.riskScore ?? '?'}</strong>
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <RiskBadge level={t.riskLevel} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <RiskBadge level={t.residualRiskLevel} />
                      {reduction !== null && (
                        <span className="text-xs text-green-600 font-medium">↓ {reduction}%</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      ctrls.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>{ctrls.length}</span>
                  </td>
                  <td className="px-3 py-3 text-gray-600 text-xs max-w-[180px]">
                    <span className="line-clamp-2">{topRec}</span>
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={() => setExpanded(isOpen ? null : t.id)}
                      className="p-1 rounded-lg hover:bg-gray-200 text-gray-400 transition-colors">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
                {isOpen && (
                  <tr key={`${t.id}-detail`} className="bg-blue-50">
                    <td colSpan={9} className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Rationale</p>
                          <p className="text-sm text-gray-700">{t.rationale || t.description || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">All Recommendations</p>
                          <ul className="space-y-1">
                            {(t.recommendations || []).map((r, ri) => (
                              <li key={ri} className="flex items-start gap-2 text-sm text-gray-700">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                                {r}
                              </li>
                            ))}
                            {(!t.recommendations || t.recommendations.length === 0) && (
                              <li className="text-sm text-gray-400">No recommendations listed</li>
                            )}
                          </ul>
                        </div>
                        {t.residualRationale && (
                          <div className="md:col-span-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Residual Risk Rationale</p>
                            <p className="text-sm text-gray-700">{t.residualRationale}</p>
                          </div>
                        )}
                        {ctrls.length > 0 && (
                          <div className="md:col-span-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Linked Controls</p>
                            <div className="flex flex-wrap gap-2">
                              {ctrls.map(c => (
                                <span key={c.id} className="px-2 py-1 bg-white border border-green-200 text-green-700 rounded-lg text-xs font-medium">
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
          {threats.length === 0 && (
            <tr>
              <td colSpan={9} className="px-6 py-12 text-center">
                <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No threats identified yet — run AI Analysis from the project wizard.</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Risk Matrix ──────────────────────────────────────────────────────────────

function RiskMatrix({ threats }) {
  const [showResidual, setShowResidual] = useState(false);

  function cellColor(l, i) {
    const s = l * i;
    if (s >= 20) return { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' };
    if (s >= 15) return { bg: '#ffedd5', border: '#fdba74', text: '#c2410c' };
    if (s >= 10) return { bg: '#fef3c7', border: '#fde68a', text: '#a16207' };
    if (s >= 5)  return { bg: '#dcfce7', border: '#86efac', text: '#15803d' };
    return { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' };
  }

  const LIKELIHOODS = [5, 4, 3, 2, 1];
  const IMPACTS = [1, 2, 3, 4, 5];

  const threatsInCell = (l, i) => threats.filter(t =>
    showResidual
      ? (t.residualRiskScore === l * i || (Math.abs((t.residualRiskScore || 0) - l * i) < 2 &&
          t.likelihood === l && t.impact === i))
      : (t.likelihood === l && t.impact === i)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Threats plotted at Likelihood × Impact. Hover a cell to see threats.</p>
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
          <button onClick={() => setShowResidual(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!showResidual ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
            Initial Risk
          </button>
          <button onClick={() => setShowResidual(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${showResidual ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
            Residual Risk
          </button>
        </div>
      </div>
      <div className="flex gap-3">
        {/* Y-axis label */}
        <div className="flex items-center justify-center w-6">
          <span className="text-xs text-gray-400 font-medium" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            Likelihood →
          </span>
        </div>
        <div className="flex-1">
          {/* Column headers */}
          <div className="flex mb-1 ml-12">
            {IMPACTS.map(i => (
              <div key={i} className="flex-1 text-center text-xs text-gray-400 font-medium">{i}</div>
            ))}
          </div>
          {/* Rows */}
          {LIKELIHOODS.map(l => (
            <div key={l} className="flex items-stretch mb-1">
              <div className="w-12 flex items-center justify-end pr-2 text-xs text-gray-400 font-medium">{l}</div>
              {IMPACTS.map(i => {
                const c = cellColor(l, i);
                const cellThreats = threatsInCell(l, i);
                return (
                  <div key={i} className="flex-1 min-h-[52px] mx-0.5 rounded-lg border relative group cursor-default flex items-center justify-center"
                    style={{ backgroundColor: c.bg, borderColor: c.border }}>
                    {cellThreats.length > 0 && (
                      <div className="flex flex-wrap gap-1 p-1 justify-center">
                        {cellThreats.map(t => (
                          <div key={t.id}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: STRIDE_CATEGORIES[t.strideCategory]?.color || '#6b7280' }}
                            title={t.name}>
                            {t.strideCategory}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Tooltip */}
                    {cellThreats.length > 0 && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-52 bg-gray-900 text-white text-xs rounded-lg p-2 z-30 hidden group-hover:block shadow-xl">
                        <p className="font-semibold mb-1" style={{ color: c.text }}>L{l} × I{i} = {l*i}</p>
                        {cellThreats.map(t => (
                          <p key={t.id} className="truncate">{t.name}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          {/* X-axis label */}
          <div className="text-center mt-1 text-xs text-gray-400 ml-12">Impact →</div>
        </div>
      </div>
    </div>
  );
}

// ─── Attack Paths ─────────────────────────────────────────────────────────────

function AttackPaths({ threats }) {
  const [expanded, setExpanded] = useState(null);

  const pathsWithThreats = ATTACK_PATH_TEMPLATES.map(path => {
    const matched = threats.filter(t => path.steps.includes(t.strideCategory));
    const maxRisk = matched.reduce((m, t) => Math.max(m, t.riskScore || 0), 0);
    return { ...path, threats: matched, maxRisk };
  }).filter(p => p.threats.length > 0);

  if (pathsWithThreats.length === 0) {
    return (
      <div className="text-center py-12">
        <GitBranch className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-400 text-sm">No attack paths identified yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pathsWithThreats.map(path => {
        const isOpen = expanded === path.id;
        const riskLevel = path.maxRisk >= 20 ? 'CRITICAL' : path.maxRisk >= 15 ? 'HIGH' : path.maxRisk >= 10 ? 'MEDIUM' : 'LOW';
        return (
          <div key={path.id} className="border border-gray-200 rounded-xl overflow-hidden">
            <button onClick={() => setExpanded(isOpen ? null : path.id)}
              className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
              {/* STRIDE chain */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {path.steps.map((s, si) => (
                  <div key={si} className="flex items-center gap-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow"
                      style={{ backgroundColor: STRIDE_CATEGORIES[s]?.color || '#6b7280' }}>
                      {s}
                    </div>
                    {si < path.steps.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">{path.name}</p>
                  <RiskBadge level={riskLevel} small />
                  <span className="text-xs text-gray-400">{path.threats.length} matching threat{path.threats.length !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{path.description}</p>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
            </button>
            {isOpen && (
              <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    {path.steps.map((s, si) => (
                      <div key={si} className="flex items-center gap-1">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                            style={{ backgroundColor: STRIDE_CATEGORIES[s]?.color || '#6b7280' }}>
                            {s}
                          </div>
                          <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                            {STRIDE_CATEGORIES[s]?.name?.split(' ')[0]}
                          </span>
                        </div>
                        {si < path.steps.length - 1 && (
                          <div className="flex flex-col items-center mb-4">
                            <div className="w-8 h-0.5 mx-1" style={{ backgroundColor: path.color }} />
                            <ChevronRight className="w-3 h-3 -mt-1" style={{ color: path.color }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Matched Threats</p>
                <div className="space-y-2">
                  {path.threats.map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200">
                      <span className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: STRIDE_CATEGORIES[t.strideCategory]?.color }}>
                        {t.strideCategory}
                      </span>
                      <span className="text-sm text-gray-800 flex-1 truncate">{t.name}</span>
                      <RiskBadge level={t.riskLevel} small />
                      {t.residualRiskLevel && t.residualRiskLevel !== t.riskLevel && (
                        <span className="text-xs text-green-600 flex items-center gap-0.5">
                          <TrendingDown className="w-3 h-3" /> {t.residualRiskLevel}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Visual Threats ───────────────────────────────────────────────────────────

function VisualThreats({ threats }) {
  const ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL'];
  const grouped = ORDER.reduce((acc, lvl) => {
    acc[lvl] = threats.filter(t => t.riskLevel === lvl);
    return acc;
  }, {});

  if (threats.length === 0) {
    return (
      <div className="text-center py-12">
        <Eye className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-400 text-sm">No threats to display.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {ORDER.filter(lvl => grouped[lvl].length > 0).map(lvl => (
        <div key={lvl}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: RISK_COLORS[lvl] }} />
            <h4 className="font-semibold text-gray-800">{lvl}</h4>
            <span className="text-xs text-gray-400">({grouped[lvl].length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {grouped[lvl].map(t => {
              const cat = STRIDE_CATEGORIES[t.strideCategory] || {};
              const reduction = t.riskScore && t.residualRiskScore
                ? Math.round((1 - t.residualRiskScore / t.riskScore) * 100)
                : null;
              return (
                <div key={t.id} className="rounded-xl border p-4 flex flex-col gap-3"
                  style={{ borderColor: RISK_BORDER[lvl], backgroundColor: RISK_BG[lvl] }}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: cat.color }}>
                      {t.strideCategory}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-snug">{t.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">L{t.likelihood} × I{t.impact} = <strong style={{ color: RISK_COLORS[lvl] }}>{t.riskScore}</strong></span>
                    </div>
                    {t.residualRiskLevel && (
                      <div className="flex items-center gap-1 text-green-700">
                        <TrendingDown className="w-3 h-3" />
                        <span>Residual: {t.residualRiskLevel}</span>
                        {reduction !== null && <span className="font-semibold">(-{reduction}%)</span>}
                      </div>
                    )}
                  </div>
                  {t.recommendations?.[0] && (
                    <div className="border-t pt-2" style={{ borderColor: RISK_BORDER[lvl] }}>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        <span className="font-medium">Mitigation:</span> {t.recommendations[0]}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Compliance Section ───────────────────────────────────────────────────────

function ComplianceSection({ project, threats, controls }) {
  const frameworks = (project.complianceFrameworks || [])
    .map(id => ({ id, def: COMPLIANCE_DEFS[id] }))
    .filter(f => f.def);
  const [openFw, setOpenFw] = useState(null);

  if (frameworks.length === 0) {
    return (
      <div className="text-center py-12">
        <ClipboardCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-400 text-sm">No compliance frameworks selected for this project.</p>
        <p className="text-xs text-gray-300 mt-1">Edit the project in the wizard to add frameworks.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {frameworks.slice(0, 4).map(({ id, def }) => {
          const score = getComplianceScore(id, project.id, threats, controls);
          return (
            <div key={id} className="rounded-xl border border-gray-200 p-3 text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: def.color }}>{score}%</div>
              <div className="text-xs font-semibold text-gray-700">{def.name}</div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: def.color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Per-framework detail */}
      {frameworks.map(({ id, def }) => {
        const score = getComplianceScore(id, project.id, threats, controls);
        const isOpen = openFw === id;
        const reqs = (def.requirements || []).map(req => ({
          req,
          status: getRequirementStatus(req, threats, controls, project.id),
        }));
        const passed = reqs.filter(r => r.status === 'pass').length;
        const partial = reqs.filter(r => r.status === 'partial').length;

        return (
          <div key={id} className="border border-gray-200 rounded-xl overflow-hidden">
            <button onClick={() => setOpenFw(isOpen ? null : id)}
              className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: def.color }}>
                {def.region}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">{def.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full text-white font-semibold"
                    style={{ backgroundColor: score >= 75 ? '#15803d' : score >= 50 ? '#f59e0b' : '#dc2626' }}>
                    {score >= 75 ? 'Compliant' : score >= 50 ? 'Partial' : 'Gap'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden max-w-[200px]">
                    <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: def.color }} />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: def.color }}>{score}%</span>
                  <span className="text-xs text-gray-400">{passed}/{reqs.length} requirements met</span>
                </div>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {isOpen && (
              <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                <div className="flex gap-4 mb-4 text-xs">
                  <span className="flex items-center gap-1 text-green-700"><CheckCircle2 className="w-3.5 h-3.5" /> {passed} Met</span>
                  <span className="flex items-center gap-1 text-amber-600"><MinusCircle className="w-3.5 h-3.5" /> {partial} Partial</span>
                  <span className="flex items-center gap-1 text-red-600"><XCircle className="w-3.5 h-3.5" /> {reqs.filter(r=>r.status==='fail').length} Gap</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {reqs.map(({ req, status }) => (
                    <div key={req} className="flex items-center gap-2 text-sm">
                      {status === 'pass'    && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                      {status === 'partial' && <MinusCircle  className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                      {status === 'fail'    && <XCircle      className="w-4 h-4 text-red-500   flex-shrink-0" />}
                      <span className={status === 'fail' ? 'text-red-700' : status === 'partial' ? 'text-amber-700' : 'text-gray-700'}>
                        {req}
                      </span>
                    </div>
                  ))}
                </div>
                {score < 75 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-semibold text-amber-800 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" /> Recommended actions
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Implement additional controls and address open threats to improve {def.name} compliance posture.
                      Focus on partial requirements first for fastest gains.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'threats',    label: 'Threat Register', icon: AlertTriangle },
  { id: 'matrix',    label: 'Risk Matrix',      icon: LayoutGrid },
  { id: 'paths',     label: 'Attack Paths',     icon: GitBranch },
  { id: 'visual',    label: 'Visual Threats',   icon: Eye },
  { id: 'compliance',label: 'Compliance',       icon: ClipboardCheck },
];

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('threats');
  const [showReport, setShowReport] = useState(false);

  const {
    state,
    setCurrentProject,
    importAIResults,
    getProjectThreats,
    getProjectControls,
    getProjectAssets,
    getProjectDataFlows,
  } = useThreatContext();

  const project = state.projects.find((p) => p.id === projectId);

  useEffect(() => {
    if (project) setCurrentProject(project);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  // Import AI results passed via router state (from NewProject wizard save).
  // We clear the state after import so a page refresh doesn't re-import.
  useEffect(() => {
    const pending = location.state?.pendingAIResults;
    if (!pending) return;
    importAIResults(pending);
    // Clear the router state so refresh doesn't re-import
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading project…</p>
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
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Projects
        </Link>
      </div>
    );
  }

  const appliedThreats = getProjectThreats(projectId);
  const controls = getProjectControls(projectId);
  const assets   = getProjectAssets(projectId);
  const dataFlows = getProjectDataFlows(projectId);

  // Merge applied threats with raw diagram workspace threats (deduped by id).
  // Workspace threats come from Diagram-page AI analysis regardless of whether
  // the user clicked "Apply" on individual rows.
  const workspaceRows = (project.workspaceThreatRows || []).map(r => ({
    ...r,
    projectId: r.projectId || projectId,
    // normalise field aliases from different analysis paths
    name:          r.name || r.threat,
    strideCategory: r.strideCategory || r.stride?.[0],
    riskLevel:     r.riskLevel || r.risk,
    riskScore:     r.riskScore ?? (r.likelihood && r.impact ? r.likelihood * r.impact : undefined),
  }));
  const appliedIds = new Set(appliedThreats.map(t => t.id));
  const threats = [
    ...appliedThreats,
    ...workspaceRows.filter(r => !appliedIds.has(r.id)),
  ];

  const criticalCount = threats.filter(t => t.riskLevel === 'CRITICAL').length;
  const highCount     = threats.filter(t => t.riskLevel === 'HIGH').length;
  const avgResidualReduction = threats.length > 0
    ? Math.round(threats.reduce((sum, t) => {
        if (t.riskScore && t.residualRiskScore) return sum + (1 - t.residualRiskScore / t.riskScore);
        return sum;
      }, 0) / threats.length * 100)
    : 0;

  const STAT_CARDS = [
    { label: 'Threats',     value: threats.length,          icon: AlertTriangle, color: 'text-red-500',    bg: 'bg-red-50' },
    { label: 'Controls',    value: controls.length,          icon: Shield,        color: 'text-green-500',  bg: 'bg-green-50' },
    { label: 'Assets',      value: assets.length,            icon: Target,        color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Data Flows',  value: dataFlows.length,         icon: Network,       color: 'text-blue-500',   bg: 'bg-blue-50' },
    { label: 'Critical/High', value: criticalCount + highCount, icon: Activity,  color: 'text-red-600',    bg: 'bg-red-50',   accent: true },
    { label: 'Risk Reduced', value: `${avgResidualReduction}%`, icon: TrendingDown, color: 'text-green-600', bg: 'bg-green-50', accent: true },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <button onClick={() => navigate('/projects')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Projects
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                project.status === 'active' ? 'bg-green-100 text-green-700' :
                project.status === 'planning' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>{project.status}</span>
              {project.criticality && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 uppercase">
                  {project.criticality} criticality
                </span>
              )}
            </div>
            {project.description && (
              <p className="text-gray-500 mt-1 max-w-2xl">{project.description}</p>
            )}
            <div className="flex items-center gap-5 mt-3 text-sm text-gray-400 flex-wrap">
              {project.owner && (
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {project.owner}</span>
              )}
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(project.createdAt).toLocaleDateString()}</span>
              {project.industry && (
                <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> {project.industry}</span>
              )}
              {project.threatModel && (
                <span className="flex items-center gap-1 uppercase font-medium text-blue-600">
                  <Shield className="w-3.5 h-3.5" /> {project.threatModel}
                </span>
              )}
            </div>
            {project.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {project.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                    <Tag className="w-2.5 h-2.5" />{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Report button + Frameworks badges */}
          <div className="flex flex-col items-end gap-3">
            <button
              onClick={() => setShowReport(true)}
              disabled={threats.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-30 transition-all shadow-sm ring-1 ring-slate-700/50"
            >
              <FileDown className="w-4 h-4" /> Generate Report
            </button>

          {project.complianceFrameworks?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-end">
              {project.complianceFrameworks.map(fwId => {
                const fw = COMPLIANCE_DEFS[fwId];
                if (!fw) return null;
                return (
                  <button key={fwId} onClick={() => setActiveTab('compliance')}
                    className="px-2.5 py-1 rounded-lg text-white text-xs font-semibold hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: fw.color }}>
                    {fw.name}
                  </button>
                );
              })}
            </div>
          )}
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg, accent }) => (
          <div key={label} className={`card text-center py-4 ${accent ? 'ring-1 ring-inset ring-gray-200' : ''}`}>
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className={`text-2xl font-bold ${accent ? color : 'text-gray-900'}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-white shadow text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}>
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'threats' && threats.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{threats.length}</span>
                )}
                {tab.id === 'compliance' && (project.complianceFrameworks?.length || 0) > 0 && (
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                    {project.complianceFrameworks.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="card">
            {activeTab === 'threats' && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Threat Register</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {criticalCount > 0 && <span className="px-2 py-1 rounded-full font-bold" style={{ background: RISK_BG.CRITICAL, color: RISK_COLORS.CRITICAL }}>{criticalCount} Critical</span>}
                    {highCount > 0    && <span className="px-2 py-1 rounded-full font-bold" style={{ background: RISK_BG.HIGH, color: RISK_COLORS.HIGH }}>{highCount} High</span>}
                  </div>
                </div>
                <ThreatTable threats={threats} controls={controls} />
              </>
            )}
            {activeTab === 'matrix' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Risk Matrix</h3>
                <RiskMatrix threats={threats} />
              </>
            )}
            {activeTab === 'paths' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Attack Paths</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Likely attack scenarios based on identified STRIDE threats. Each path shows how threats chain together.
                </p>
                <AttackPaths threats={threats} />
              </>
            )}
            {activeTab === 'visual' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Visual Threats</h3>
                <VisualThreats threats={threats} />
              </>
            )}
            {activeTab === 'compliance' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Compliance Assessment</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Coverage estimate based on identified threats and implemented controls for selected frameworks.
                </p>
                <ComplianceSection project={project} threats={threats} controls={controls} />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Report modal */}
      {showReport && (
        <ProjectReport
          project={project}
          threats={threats}
          controls={controls}
          assets={assets}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
