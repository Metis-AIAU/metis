import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, CheckCircle2, Loader2,
  FileText, Building2, Server, Shield, AlertTriangle,
  Monitor, Sparkles,
} from 'lucide-react';
import { useInsurance } from '../../context/InsuranceContext';
import { useOrg } from '../../context/OrgContext';

const INDUSTRIES = ['Finance & Banking', 'Healthcare', 'Energy & Utilities', 'Government', 'Manufacturing', 'Retail', 'Technology', 'Education', 'Other'];
const ORG_SIZES  = ['1–50', '51–200', '201–1000', '1001–5000', '5000+'];
const ASSET_TYPES = ['On-premises servers', 'Cloud infrastructure (AWS/Azure/GCP)', 'Industrial control systems (OT)', 'Mobile devices', 'Remote workforce endpoints', 'Third-party SaaS applications', 'Customer-facing web apps'];
const CONTROLS_LIST = ['Multi-Factor Authentication (MFA)', 'Endpoint Detection & Response (EDR)', 'Security Information & Event Mgmt (SIEM)', 'Privileged Access Management (PAM)', 'Data Loss Prevention (DLP)', 'Email Security Gateway', 'Web Application Firewall (WAF)', 'Network Segmentation / Zero Trust', 'Vulnerability Management', 'Security Awareness Training', 'Incident Response Plan', 'Immutable Backups'];
const INCIDENT_TYPES = ['Ransomware', 'Business Email Compromise (BEC)', 'Data Breach', 'DDoS Attack', 'Insider Threat', 'Supply Chain Attack', 'Credential Theft', 'None in the past 3 years'];
const DOMAIN_QUESTIONS = [
  { domain: 'MFA',      label: 'Multi-Factor Authentication',     color: 'text-blue-600',   bg: 'bg-blue-50  border-blue-100',  questions: [
    { key: 'coverage', label: 'What % of users have MFA enabled?',         options: ['<50%','50–79%','80–94%','95–100%'] },
    { key: 'privileged',label: 'Is MFA enforced for all privileged accounts?', options: ['No','Partially','Yes'] },
    { key: 'type',      label: 'Primary MFA method',                        options: ['SMS/Email OTP','Authenticator App','Hardware Token','Phishing-resistant (FIDO2)'] },
  ]},
  { domain: 'EDR',      label: 'Endpoint Detection & Response',   color: 'text-cyan-600',   bg: 'bg-cyan-50   border-cyan-100',  questions: [
    { key: 'coverage',  label: 'EDR deployed on what % of endpoints?',     options: ['<50%','50–79%','80–94%','95–100%'] },
    { key: 'monitoring',label: 'Is EDR monitored 24/7?',                   options: ['No','Business hours only','Yes — 24/7'] },
    { key: 'response',  label: 'Avg time to respond to critical alert?',   options: ['>24 hours','4–24 hours','1–4 hours','<1 hour'] },
  ]},
  { domain: 'Backup',   label: 'Backup & Disaster Recovery',      color: 'text-green-600',  bg: 'bg-green-50  border-green-100', questions: [
    { key: 'freq',      label: 'How often are critical systems backed up?', options: ['Monthly','Weekly','Daily','Continuous'] },
    { key: 'immutable', label: 'Are backups stored in immutable format?',   options: ['No','Partially','Yes'] },
    { key: 'tested',    label: 'How often is restoration tested?',          options: ['Never','Annually','Quarterly','Monthly'] },
  ]},
  { domain: 'VulnMgmt', label: 'Vulnerability Management',        color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-100', questions: [
    { key: 'scanFreq',  label: 'How often are vulnerability scans run?',   options: ['Never','Quarterly','Monthly','Weekly or more'] },
    { key: 'patchSla',  label: 'SLA for patching critical vulnerabilities?', options: ['>90 days','30–90 days','14–30 days','<14 days'] },
    { key: 'coverage',  label: 'What % of assets are included in scans?',  options: ['<50%','50–79%','80–94%','95–100%'] },
  ]},
  { domain: 'IR',       label: 'Incident Response',               color: 'text-amber-600',  bg: 'bg-amber-50  border-amber-100', questions: [
    { key: 'plan',      label: 'Do you have a documented IR plan?',        options: ['No','Informal only','Documented but not tested','Documented and tested'] },
    { key: 'retainer',  label: 'Do you have an IR retainer?',              options: ['No','Yes'] },
    { key: 'tabletop',  label: 'Most recent tabletop exercise?',           options: ['>2 years ago','1–2 years ago','6–12 months ago','<6 months ago'] },
  ]},
];

const STEPS = [
  { id: 1, label: 'Insurance Policy',  icon: FileText },
  { id: 2, label: 'Organisation',      icon: Building2 },
  { id: 3, label: 'Asset Inventory',   icon: Server },
  { id: 4, label: 'Security Controls', icon: Shield },
  { id: 5, label: 'Incident History',  icon: AlertTriangle },
  { id: 6, label: 'Domain Assessment', icon: Monitor },
  { id: 7, label: 'AI Analysis',       icon: Sparkles },
];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const done   = s.id < current;
        const active = s.id === current;
        return (
          <div key={s.id} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              done ? 'bg-green-500 text-white' : active ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              {done ? <CheckCircle2 className="w-4 h-4" /> : s.id}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 transition-all ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SelectInput({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full rounded-xl px-3 py-2.5 text-sm text-gray-700 border border-gray-200 bg-gray-50 focus:outline-none focus:border-amber-300 appearance-none">
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function CheckGroup({ options, selected, onChange }) {
  const toggle = v => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  return (
    <div className="grid grid-cols-1 gap-2">
      {options.map(o => (
        <label key={o} onClick={() => toggle(o)}
          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
            selected.includes(o) ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
          }`}>
          <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
            selected.includes(o) ? 'bg-amber-500' : 'bg-white border border-gray-300'
          }`}>
            {selected.includes(o) && <CheckCircle2 className="w-3 h-3 text-white" />}
          </div>
          <span className="text-sm text-gray-700">{o}</span>
        </label>
      ))}
    </div>
  );
}

const EMPTY = { orgName:'', industry:'', orgSize:'', currentPremium:'', sumInsured:'', assetTypes:[], cloudPct:'', criticalSystemCount:'', controlsInPlace:[], incidentTypes:[], lastIncidentDate:'', hasIRRetainer:'', domainAnswers:{} };

function ResultCard({ result }) {
  const riskColor = result.riskScore >= 70 ? 'text-red-600' : result.riskScore >= 40 ? 'text-amber-600' : 'text-green-600';
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Risk Score',        value: `${result.riskScore}/100`, color: riskColor },
          { label: 'Potential Savings', value: `$${(result.savings / 1000).toFixed(0)}K`, color: 'text-green-600' },
          { label: 'Controls Covered',  value: `${result.controlsCovered}/${result.totalControls}`, color: 'text-blue-600' },
        ].map(m => (
          <div key={m.label} className="card text-center">
            <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
            <p className="text-xs text-gray-500 mt-1">{m.label}</p>
          </div>
        ))}
      </div>
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">Top Recommendations</h3>
        <div className="divide-y divide-gray-50">
          {result.recommendations.map((r, i) => (
            <div key={i} className="flex items-start gap-3 py-3">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{r.action}</p>
                <p className="text-xs text-gray-400 mt-0.5">{r.rationale}</p>
              </div>
              <span className="text-sm font-bold text-green-600 flex-shrink-0">${(r.savings / 1000).toFixed(0)}K</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function ManualAssessment() {
  const navigate = useNavigate();
  const [step,   setStep]   = useState(1);
  const [form,   setForm]   = useState(EMPTY);
  const [result, setResult] = useState(null);
  const { setManualResult, setManualLoading, state } = useInsurance();
  const { fetchWithAuth } = useOrg();

  const set       = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setDomain = (domain, key, val) => setForm(f => ({ ...f, domainAnswers: { ...f.domainAnswers, [`${domain}_${key}`]: val } }));

  const runAnalysis = async () => {
    setManualLoading(true);
    try {
      const res  = await fetchWithAuth('/api/insurance/assess', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: form }), signal: AbortSignal.timeout(120_000),
      });
      const data = await res.json();
      if (res.ok && data.success) { setResult(data.result); setManualResult(data.result); }
      else { const c = computeLocal(); setResult(c); setManualResult(c); }
    } catch {
      const c = computeLocal(); setResult(c); setManualResult(c);
    } finally { setManualLoading(false); }
  };

  const computeLocal = () => {
    const ctrl = (form.controlsInPlace.length / CONTROLS_LIST.length) * 100;
    const risk = Math.round(Math.min(100, Math.max(0, 100 - ctrl * 0.6)));
    const savings = Math.round((risk / 100) * 150000);
    return {
      riskScore: risk, savings, controlsCovered: form.controlsInPlace.length, totalControls: CONTROLS_LIST.length,
      assessment: { riskScore: risk, potentialSavings: savings },
      recommendations: [
        { action: 'Implement immutable backups for all critical systems', rationale: 'High ransomware exposure', savings: 42000 },
        { action: 'Enforce MFA on all privileged accounts',              rationale: 'Credential theft risk',    savings: 38000 },
        { action: 'Deploy a DLP solution',                               rationale: 'Policy non-compliance gap',savings: 22000 },
      ],
    };
  };

  const canProceed = () => {
    if (step === 2) return form.orgName && form.industry && form.orgSize;
    if (step === 3) return form.assetTypes.length > 0;
    if (step === 4) return form.controlsInPlace.length > 0;
    return true;
  };

  const handleNext = () => {
    if (step === 6) runAnalysis();
    if (step < 7) setStep(s => s + 1);
  };

  const stepContent = () => {
    switch (step) {
      case 1: return (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 leading-relaxed">Optionally upload your existing cyber insurance policy. AI will extract requirements and customise your risk evaluation.</p>
          <div className="rounded-xl p-8 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer hover:border-amber-300 hover:bg-amber-50 transition-all">
            <FileText className="w-10 h-10 mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">Drop policy PDF here or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">Optional — skip to use standard risk modelling</p>
          </div>
          <button onClick={() => setStep(2)} className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all">
            Skip — Use Standard Risk Modelling
          </button>
        </div>
      );
      case 2: return (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Organisation Name</label>
            <input value={form.orgName} onChange={e => set('orgName', e.target.value)} placeholder="Acme Corp"
              className="w-full rounded-xl px-3 py-2.5 text-sm text-gray-700 border border-gray-200 bg-gray-50 focus:outline-none focus:border-amber-300" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Industry</label>
              <SelectInput value={form.industry} onChange={v => set('industry', v)} options={INDUSTRIES} placeholder="Select industry" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Org Size</label>
              <SelectInput value={form.orgSize} onChange={v => set('orgSize', v)} options={ORG_SIZES} placeholder="Employees" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Current Annual Premium (AUD)</label>
              <input type="number" value={form.currentPremium} onChange={e => set('currentPremium', e.target.value)} placeholder="e.g. 485000"
                className="w-full rounded-xl px-3 py-2.5 text-sm text-gray-700 border border-gray-200 bg-gray-50 focus:outline-none focus:border-amber-300" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Sum Insured (AUD)</label>
              <input type="number" value={form.sumInsured} onChange={e => set('sumInsured', e.target.value)} placeholder="e.g. 10000000"
                className="w-full rounded-xl px-3 py-2.5 text-sm text-gray-700 border border-gray-200 bg-gray-50 focus:outline-none focus:border-amber-300" />
            </div>
          </div>
        </div>
      );
      case 3: return (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Asset Types in Scope (select all that apply)</label>
            <CheckGroup options={ASSET_TYPES} selected={form.assetTypes} onChange={v => set('assetTypes', v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Cloud Workload %</label>
              <SelectInput value={form.cloudPct} onChange={v => set('cloudPct', v)} options={['<10%','10–30%','30–60%','60–80%','>80%']} placeholder="Cloud %" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Critical Systems Count</label>
              <SelectInput value={form.criticalSystemCount} onChange={v => set('criticalSystemCount', v)} options={['<10','10–50','50–200','200+']} placeholder="Count" />
            </div>
          </div>
        </div>
      );
      case 4: return (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Select all security controls currently deployed and operational.</p>
          <CheckGroup options={CONTROLS_LIST} selected={form.controlsInPlace} onChange={v => set('controlsInPlace', v)} />
        </div>
      );
      case 5: return (
        <div className="space-y-4">
          <CheckGroup options={INCIDENT_TYPES} selected={form.incidentTypes} onChange={v => set('incidentTypes', v)} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Most recent incident date</label>
              <input type="month" value={form.lastIncidentDate} onChange={e => set('lastIncidentDate', e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-gray-700 border border-gray-200 bg-gray-50 focus:outline-none focus:border-amber-300" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">IR retainer in place?</label>
              <SelectInput value={form.hasIRRetainer} onChange={v => set('hasIRRetainer', v)} options={['Yes','No','Under evaluation']} placeholder="Select" />
            </div>
          </div>
        </div>
      );
      case 6: return (
        <div className="space-y-4">
          {DOMAIN_QUESTIONS.map(domain => (
            <div key={domain.domain} className={`rounded-xl p-4 border ${domain.bg}`}>
              <h3 className={`text-sm font-bold mb-3 ${domain.color}`}>{domain.label}</h3>
              <div className="space-y-3">
                {domain.questions.map(q => (
                  <div key={q.key}>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{q.label}</label>
                    <SelectInput
                      value={form.domainAnswers[`${domain.domain}_${q.key}`] || ''}
                      onChange={v => setDomain(domain.domain, q.key, v)}
                      options={q.options} placeholder="Select answer" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
      case 7: return (
        result ? <ResultCard result={result} /> : (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full border-2 border-t-transparent border-amber-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-700 font-semibold">AI is analysing your security posture…</p>
            <p className="text-gray-400 text-sm mt-1">Calculating risk score and premium savings opportunities</p>
          </div>
        )
      );
      default: return null;
    }
  };

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-xs font-bold tracking-widest uppercase text-amber-600 mb-1">Cyber Insurance & Accountability</p>
        <h1 className="text-3xl font-bold text-gray-900">Manual Assessment</h1>
        <p className="text-gray-500 mt-1">7-step security posture evaluation with AI-generated insurance and risk insights.</p>
      </motion.div>

      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-8">
          <StepIndicator current={step} />
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="card">

          {/* Step header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
              {(() => { const S = STEPS[step - 1]; return <S.icon className="w-4 h-4 text-amber-600" />; })()}
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Step {step} of {STEPS.length}</p>
              <h2 className="text-base font-bold text-gray-900">{STEPS[step - 1].label}</h2>
            </div>
          </div>

          {stepContent()}

          {step < 7 && (
            <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
              <button onClick={handleNext} disabled={!canProceed()}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  canProceed() ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}>
                {step === 6 ? <><Sparkles className="w-4 h-4" /> Run AI Analysis</> : <>Next <ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
          )}

          {step === 7 && result && (
            <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
              <button onClick={() => { setStep(1); setForm(EMPTY); setResult(null); }}
                className="px-4 py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all">
                New Assessment
              </button>
              <button onClick={() => navigate('/insurance/executive')}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-green-100 text-green-700 hover:bg-green-200 transition-all">
                View Executive Dashboard →
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
