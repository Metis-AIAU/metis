import { motion } from 'framer-motion';
import {
  Upload, ClipboardList, Plug, Cpu, Zap, BarChart3,
  ArrowDown, Shield, Database, Calculator, CheckCircle2,
  AlertTriangle, Clock, GitMerge, Layers,
} from 'lucide-react';
import { NIST_CONTROLS } from '../../context/InsuranceContext';

// ── Constants ─────────────────────────────────────────────────────────────────

const LAYERS = [
  {
    id: 'input',
    step: '01',
    label: 'Data Ingestion',
    color: 'blue',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    accent: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
    headingColor: 'text-blue-700',
    icon: Database,
    description: 'Raw security data collected from two complementary paths — manual questionnaire or live API connections.',
    items: [
      { icon: ClipboardList, label: '7-Step Manual Assessment', sub: 'Org profile, controls, incidents, domain questions' },
      { icon: Plug,          label: 'Live API Integrations',    sub: 'Entra ID, Defender, CrowdStrike, Tenable' },
      { icon: Upload,        label: 'Policy Document Upload',   sub: 'PDF / DOCX → AI text extraction via mammoth' },
    ],
  },
  {
    id: 'ai',
    step: '02',
    label: 'AI Processing',
    color: 'purple',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    accent: 'bg-purple-100 text-purple-700',
    dot: 'bg-purple-500',
    headingColor: 'text-purple-700',
    icon: Cpu,
    description: 'Claude Sonnet 4.6 acts as a senior cyber insurance underwriter — extracting policy requirements and evaluating risk.',
    items: [
      { icon: Upload,  label: 'Policy Requirement Extraction', sub: 'Identifies 8–20 actionable security controls from policy text' },
      { icon: Cpu,     label: 'Underwriting Risk Model',       sub: 'Evaluates org profile, gap analysis, incident history' },
      { icon: Shield,  label: 'Domain Scoring',                sub: 'Scores MFA, EDR, Backup, VulnMgmt, IR on 0–100 scale' },
    ],
  },
  {
    id: 'engine',
    step: '03',
    label: 'Risk Scoring Engine',
    color: 'amber',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    accent: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
    headingColor: 'text-amber-700',
    icon: Zap,
    description: 'Weighted formula combines control posture, domain maturity, incident history, and industry risk multiplier.',
    items: [
      { icon: Calculator,    label: 'Control Coverage Weight (60%)', sub: 'Missing controls × premium impact %' },
      { icon: AlertTriangle, label: 'Incident History Adjustment',   sub: 'Ransomware +15, BEC +10, Breach +12…' },
      { icon: Layers,        label: 'Domain Maturity Score (20%)',   sub: '5 domains × 3 questions × answer weight' },
    ],
  },
  {
    id: 'output',
    step: '04',
    label: 'Executive Output',
    color: 'green',
    bg: 'bg-green-50',
    border: 'border-green-200',
    accent: 'bg-green-100 text-green-700',
    dot: 'bg-green-500',
    headingColor: 'text-green-700',
    icon: BarChart3,
    description: 'Actionable outputs ranked by ROI — risk score, estimated savings, prioritised remediation roadmap.',
    items: [
      { icon: Zap,          label: 'Risk Score 0–100',           sub: 'Colour-coded: Low / Medium / High / Critical' },
      { icon: BarChart3,    label: 'Premium Savings Estimate',   sub: 'AUD reduction per control implemented' },
      { icon: CheckCircle2, label: 'Prioritised Recommendations',sub: '4–6 actions ordered by savings impact' },
    ],
  },
];

const DOMAIN_WEIGHTS = [
  { domain: 'MFA',         weight: 18, color: 'text-blue-600',    bg: 'bg-blue-100',    questions: ['Coverage %', 'Privileged enforcement', 'MFA method'] },
  { domain: 'EDR',         weight: 16, color: 'text-cyan-600',    bg: 'bg-cyan-100',    questions: ['Endpoint coverage %', '24/7 monitoring', 'Mean time to respond'] },
  { domain: 'Backup',      weight: 17, color: 'text-green-600',   bg: 'bg-green-100',   questions: ['Backup frequency', 'Immutable storage', 'Restoration test cadence'] },
  { domain: 'Vuln Mgmt',   weight: 14, color: 'text-emerald-600', bg: 'bg-emerald-100', questions: ['Scan frequency', 'Patch SLA (critical CVEs)', 'Asset coverage %'] },
  { domain: 'Incident Resp', weight: 11, color: 'text-amber-600', bg: 'bg-amber-100',   questions: ['IR plan documented', 'IR retainer in place', 'Tabletop exercise recency'] },
];

const INCIDENT_ADJUSTMENTS = [
  { type: 'Ransomware',                 delta: '+15', color: 'text-red-600',    badge: 'bg-red-100 text-red-700' },
  { type: 'Data Breach',               delta: '+12', color: 'text-red-600',    badge: 'bg-red-100 text-red-700' },
  { type: 'Business Email Compromise', delta: '+10', color: 'text-amber-600',  badge: 'bg-amber-100 text-amber-700' },
  { type: 'Insider Threat',            delta: '+8',  color: 'text-amber-600',  badge: 'bg-amber-100 text-amber-700' },
  { type: 'Supply Chain Attack',        delta: '+10', color: 'text-amber-600',  badge: 'bg-amber-100 text-amber-700' },
  { type: 'DDoS',                       delta: '+5',  color: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700' },
  { type: 'IR Retainer in place',       delta: '−8',  color: 'text-green-600',  badge: 'bg-green-100 text-green-700' },
  { type: 'No incidents (3 years)',     delta: '−5',  color: 'text-green-600',  badge: 'bg-green-100 text-green-700' },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item      = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return <p className="text-xs font-bold tracking-widest uppercase text-amber-600 mb-1">{children}</p>;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Architecture() {
  const maxImpact = Math.max(...NIST_CONTROLS.map(c => c.premiumImpact));

  return (
    <div className="p-8">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <SectionLabel>Cyber Insurance & Accountability</SectionLabel>
        <h1 className="text-3xl font-bold text-gray-900">Risk Engine Architecture</h1>
        <p className="text-gray-500 mt-1 max-w-2xl">
          How raw security data flows through the AI underwriting model to produce a risk score, premium savings estimate, and remediation roadmap.
        </p>
      </motion.div>

      {/* ── 4-Layer Flow Diagram ──────────────────────────────────────────────── */}
      <motion.div variants={container} initial="hidden" animate="show" className="mb-12">
        <SectionLabel>System Architecture</SectionLabel>
        <h2 className="text-lg font-bold text-gray-900 mb-6">4-Layer Processing Pipeline</h2>

        <div className="space-y-0">
          {LAYERS.map((layer, idx) => {
            const Icon = layer.icon;
            return (
              <div key={layer.id}>
                <motion.div variants={item}
                  className={`rounded-2xl border-2 ${layer.border} ${layer.bg} p-6`}>
                  <div className="flex items-start gap-6">
                    {/* Step number + icon */}
                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-black tracking-[0.2em] text-gray-400">{layer.step}</span>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${layer.accent}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className={`text-base font-bold ${layer.headingColor}`}>{layer.label}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${layer.accent}`}>Layer {idx + 1}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{layer.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {layer.items.map(it => {
                          const It = it.icon;
                          return (
                            <div key={it.label} className="flex items-start gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${layer.accent}`}>
                                <It className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-800 leading-snug">{it.label}</p>
                                <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{it.sub}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Arrow connector */}
                {idx < LAYERS.length - 1 && (
                  <div className="flex justify-center py-2">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-0.5 h-4 bg-gray-200" />
                      <ArrowDown className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Two Paths ───────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-12">
        <SectionLabel>Data Collection</SectionLabel>
        <h2 className="text-lg font-bold text-gray-900 mb-6">Two Paths to Risk Data</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
          {/* Path A: Manual */}
          <div className="card border-l-4 border-l-amber-400">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                <ClipboardList className="w-4.5 h-4.5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Path A — Manual Assessment</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">7-Step Wizard</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { step: 1, label: 'Insurance Policy',   detail: 'Optional upload — AI extracts requirements' },
                { step: 2, label: 'Organisation Profile', detail: 'Name, industry, size, premium, sum insured' },
                { step: 3, label: 'Asset Inventory',    detail: 'Asset types, cloud %, critical system count' },
                { step: 4, label: 'Security Controls',  detail: '12 controls checklist — present or absent' },
                { step: 5, label: 'Incident History',   detail: 'Past incidents, recency, IR retainer status' },
                { step: 6, label: 'Domain Assessment',  detail: '15 questions across 5 security domains' },
                { step: 7, label: 'AI Analysis',        detail: 'Claude generates risk score + recommendations' },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.step}</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{s.label}</p>
                    <p className="text-[10px] text-gray-500">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
              <p className="text-[10px] font-bold text-amber-700 mb-1">Output shape</p>
              <code className="text-[10px] text-amber-800 leading-loose block">
                {'{'} riskScore, riskLevel, savings,<br />
                &nbsp;&nbsp;controlsCovered, totalControls,<br />
                &nbsp;&nbsp;recommendations: [{'{'} action, rationale, savings, priority {'}'}] {'}'}
              </code>
            </div>
          </div>

          {/* Path B: API */}
          <div className="card border-l-4 border-l-blue-400">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <Plug className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Path B — API Integrations</p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Live Tool Data</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { tool: 'Microsoft Entra ID',    data: 'MFA %, Conditional Access policies, privileged roles, risky sign-ins' },
                { tool: 'Microsoft Defender',    data: 'EDR coverage %, threat detections, high-risk devices, missing patches' },
                { tool: 'CrowdStrike Falcon',    data: 'Sensor integrity %, device health score, 30-day detections' },
                { tool: 'Tenable.io',            data: 'Assets scanned, critical CVEs, patch compliance %, MTTR' },
                { tool: 'Splunk SIEM',           data: 'Events/day, alert fidelity, data sources, MTTD (coming soon)' },
                { tool: 'Okta Identity',         data: 'MFA enrollment, SSO coverage, policy compliance (coming soon)' },
              ].map(t => (
                <div key={t.tool} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-blue-300 flex-shrink-0 mt-1.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{t.tool}</p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">{t.data}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
              <p className="text-[10px] font-bold text-blue-700 mb-1">Live metrics replace manual answers</p>
              <p className="text-[10px] text-blue-600 leading-relaxed">
                Connected integrations automatically populate control coverage, performance scores, and API health — no manual entry required.
              </p>
            </div>
          </div>
        </div>

        {/* Convergence arrow */}
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-0.5 bg-gray-200" />
            <div className="flex flex-col items-center gap-1">
              <GitMerge className="w-5 h-5 text-gray-400" />
              <span className="text-[10px] font-semibold text-gray-400">Both paths feed the same risk engine</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-200" />
          </div>
        </div>
      </motion.div>

      {/* ── Risk Score Formula ────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mb-12">
        <SectionLabel>Scoring Model</SectionLabel>
        <h2 className="text-lg font-bold text-gray-900 mb-6">Risk Score Formula</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main formula */}
          <div className="lg:col-span-2 card">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Risk Score Calculation (0–100)</p>
            <div className="rounded-xl bg-gray-900 px-6 py-5 mb-4 font-mono text-sm leading-loose overflow-x-auto">
              <p className="text-amber-400 font-bold">RiskScore =</p>
              <p className="text-gray-300 ml-4">100</p>
              <p className="text-gray-300 ml-4">− (<span className="text-cyan-400">ControlScore</span> × <span className="text-purple-400">0.60</span>)</p>
              <p className="text-gray-300 ml-4">± <span className="text-red-400">IncidentAdjustment</span></p>
              <p className="text-gray-300 ml-4">± <span className="text-green-400">DomainScore</span> × <span className="text-purple-400">0.20</span></p>
              <br />
              <p className="text-gray-500 text-xs">where:</p>
              <p className="text-cyan-400 text-xs ml-4">ControlScore  = (controls_in_place / 12) × 100</p>
              <p className="text-red-400 text-xs ml-4">IncidentAdjustment = Σ(incident_type_weight × recency_factor)</p>
              <p className="text-green-400 text-xs ml-4">DomainScore   = avg(MFA, EDR, Backup, VulnMgmt, IR) scores</p>
            </div>
            <div className="rounded-xl bg-gray-900 px-6 py-5 font-mono text-sm leading-loose overflow-x-auto">
              <p className="text-green-400 font-bold">PremiumSavings =</p>
              <p className="text-gray-300 ml-4">CurrentPremium</p>
              <p className="text-gray-300 ml-4">× Σ( <span className="text-amber-400">missing_control.premiumImpact%</span> )</p>
              <br />
              <p className="text-gray-500 text-xs ml-4">— Each unimplemented control carries a % impact on total premium</p>
              <p className="text-gray-500 text-xs ml-4">— Implementing all missing controls closes the full savings gap</p>
            </div>
          </div>

          {/* Incident adjustments */}
          <div className="card">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Incident Adjustments</p>
            <div className="space-y-2">
              {INCIDENT_ADJUSTMENTS.map(inc => (
                <div key={inc.type} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-700">{inc.type}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${inc.badge}`}>{inc.delta}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
              Recency factor applied: incidents within 12 months carry full weight; 1–3 years = 0.5×.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Domain Scoring ────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-12">
        <SectionLabel>Domain Assessment</SectionLabel>
        <h2 className="text-lg font-bold text-gray-900 mb-6">5 Security Domains — 15 Scored Questions</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DOMAIN_WEIGHTS.map(d => (
            <div key={d.domain} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${d.bg.replace('bg-', 'bg-').replace('100', '400')}`} />
                  <p className={`text-sm font-bold ${d.color}`}>{d.domain}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${d.bg} ${d.color}`}>
                  {d.weight}% max premium impact
                </span>
              </div>
              <div className="mb-3">
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full ${d.bg.replace('100', '400')}`}
                    style={{ width: `${d.weight / 20 * 100}%` }} />
                </div>
              </div>
              <div className="space-y-1.5">
                {d.questions.map((q, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center flex-shrink-0 ${d.bg} ${d.color}`}>
                      {i + 1}
                    </span>
                    <span className="text-xs text-gray-600">{q}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-3 pt-3 border-t border-gray-100">
                Each answer maps to a 0–100 sub-score. All 3 questions averaged = domain score.
              </p>
            </div>
          ))}

          {/* Answer weight guide */}
          <div className="card bg-gray-50 border-gray-200">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Answer → Score Mapping</p>
            <div className="space-y-2">
              {[
                { answer: 'Best practice / 95–100%', score: 90, color: 'bg-green-400' },
                { answer: 'Good / 80–94%',           score: 70, color: 'bg-green-300' },
                { answer: 'Partial / 50–79%',        score: 45, color: 'bg-amber-400' },
                { answer: 'Poor / <50%',             score: 20, color: 'bg-red-400' },
                { answer: 'None / Not in place',     score: 0,  color: 'bg-red-500' },
              ].map(a => (
                <div key={a.answer} className="flex items-center gap-3">
                  <div className="w-24 flex-shrink-0">
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full rounded-full ${a.color}`} style={{ width: `${a.score}%` }} />
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500 flex-1 leading-snug">{a.answer}</span>
                  <span className="text-[10px] font-bold text-gray-700 w-6 text-right">{a.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── NIST Control Premium Weights ─────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mb-12">
        <SectionLabel>Premium Impact</SectionLabel>
        <h2 className="text-lg font-bold text-gray-900 mb-6">NIST Control Weight Table</h2>
        <div className="card overflow-hidden p-0">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
            {['NIST Function', 'Control', 'Status', 'Coverage', 'Premium Impact %', 'Impact Bar'].map((h, i) => (
              <span key={h} className={`text-[10px] font-bold text-gray-400 uppercase tracking-wide ${
                i === 0 ? 'col-span-2' : i === 1 ? 'col-span-3' : i === 5 ? 'col-span-2' : 'col-span-1'
              }`}>{h}</span>
            ))}
          </div>
          <div className="divide-y divide-gray-50">
            {NIST_CONTROLS.map(ctrl => (
              <div key={ctrl.id} className="grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-gray-50 transition-colors">
                <span className="col-span-2">
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-600">
                    {ctrl.nistFunction}
                  </span>
                </span>
                <span className="col-span-3 text-xs font-semibold text-gray-800">{ctrl.name}</span>
                <span className="col-span-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    ctrl.status === 'implemented' ? 'bg-green-100 text-green-700' :
                    ctrl.status === 'partial'     ? 'bg-amber-100 text-amber-700' :
                                                    'bg-red-100 text-red-600'
                  }`}>
                    {ctrl.status === 'implemented' ? '✓' : ctrl.status === 'partial' ? '~' : '✗'}
                  </span>
                </span>
                <span className="col-span-1 text-xs font-bold text-gray-700">{ctrl.coverage}%</span>
                <span className="col-span-1 text-xs font-bold text-red-500">−{ctrl.premiumImpact}%</span>
                <div className="col-span-2 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-red-300"
                      style={{ width: `${(ctrl.premiumImpact / maxImpact) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 bg-amber-50 border-t border-amber-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">Total if all controls missing</p>
            <p className="text-sm font-bold text-red-600">
              −{NIST_CONTROLS.reduce((s, c) => s + c.premiumImpact, 0)}% premium impact
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── AI Model Detail ───────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <SectionLabel>AI Underwriting Engine</SectionLabel>
        <h2 className="text-lg font-bold text-gray-900 mb-6">Claude Sonnet 4.6 — Model Behaviour</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Upload,
              title: 'Policy Extraction',
              endpoint: 'POST /api/insurance/policy',
              color: 'purple',
              steps: [
                'Accepts PDF (document block), DOCX (mammoth text), or pasted text',
                'Extracts 8–20 actionable security requirements',
                'Assigns severity: critical / high / medium / low',
                'Maps to policy section reference',
                'Returns structured JSON array — no markdown',
              ],
            },
            {
              icon: Calculator,
              title: 'Risk Assessment',
              endpoint: 'POST /api/insurance/assess',
              color: 'amber',
              steps: [
                'Receives full 7-step wizard formData as JSON',
                'Evaluates org profile: industry, size, asset scope',
                'Scores controls present vs missing against 12-control checklist',
                'Analyses 15 domain answers for maturity signals',
                'Factors incident history recency and severity',
                'Returns risk score, savings, 4–6 prioritised recommendations',
              ],
            },
            {
              icon: Zap,
              title: 'Model Constraints',
              endpoint: 'claude-sonnet-4-6',
              color: 'green',
              steps: [
                'max_tokens: 2000 (assess), 3000 (policy)',
                'Risk scores calibrated to AU market: industry + org size',
                'Savings realistic relative to stated current premium',
                'Recommendations reference the org\'s specific gaps — not generic',
                'Falls back to local computeLocal() formula if API unavailable',
                'Strip markdown fences before JSON.parse on all responses',
              ],
            },
          ].map(m => {
            const Icon = m.icon;
            const colors = {
              purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-50 text-purple-600' },
              amber:  { bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-200',  badge: 'bg-amber-50 text-amber-600' },
              green:  { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-200',  badge: 'bg-green-50 text-green-600' },
            }[m.color];
            return (
              <div key={m.title} className={`card border ${colors.border}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors.bg}`}>
                    <Icon className={`w-4.5 h-4.5 ${colors.text}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{m.title}</p>
                    <code className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${colors.badge}`}>{m.endpoint}</code>
                  </div>
                </div>
                <div className="space-y-2">
                  {m.steps.map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${colors.text}`} />
                      <p className="text-xs text-gray-600 leading-relaxed">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
