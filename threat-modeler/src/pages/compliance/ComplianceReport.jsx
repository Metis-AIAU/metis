import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Printer, Shield, Zap, CheckCircle2, AlertTriangle, Clock, AlertCircle } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { useCompliance } from '../../context/ComplianceContext';
import { AESCSF_FUNCTIONS, AESCSF_PROFILES, COMPLIANCE_STATUS } from '../../data/aescsf';
import { SOCI_OBLIGATIONS } from '../../data/soci';
import { ASD_FORTIFY_STRATEGIES, ASD_MATURITY_LEVELS } from '../../data/asdFortify';
import { E8_STRATEGIES, E8_MATURITY_LEVELS, computeAchievedMaturity } from '../../data/essentialEight';

function ScoreCircle({ score, color, size = 80 }) {
  const r = size * 0.4;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={size * 0.1} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={size * 0.1}
        strokeDasharray={c} strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

function StatusSummaryRow({ label, count, color, icon: Icon }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <span className="text-sm font-bold" style={{ color }}>{count}</span>
    </div>
  );
}

export default function ComplianceReport() {
  const { state, getFrameworkScore, getAescsfFunctionScore, getOverallScore, getGaps } = useCompliance();

  const reportDate = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'long', year: 'numeric' });

  const aescsfScore = getFrameworkScore('AESCSF');
  const sociScore = getFrameworkScore('SOCI');
  const asdScore = getFrameworkScore('ASD_FORTIFY');
  const e8Score = getFrameworkScore('ESSENTIAL_EIGHT');
  const overallScore = getOverallScore();

  const aescsfProfile = AESCSF_PROFILES[state.aescsfProfile];
  const asdML = ASD_MATURITY_LEVELS[state.asdTargetMaturity];
  const e8ML = E8_MATURITY_LEVELS[state.e8TargetMaturity];

  const radarData = AESCSF_FUNCTIONS.map(fn => ({
    function: fn.id,
    name: fn.name,
    score: getAescsfFunctionScore(fn.id).score,
  }));

  const frameworkBarData = [
    { name: 'AESCSF', score: aescsfScore.score, fill: '#3b82f6' },
    { name: 'SOCI Act', score: sociScore.score, fill: '#8b5cf6' },
    { name: 'ASD Fortify', score: asdScore.score, fill: '#10b981' },
    { name: 'Essential Eight', score: e8Score.score, fill: '#f97316' },
  ];

  const allGaps = [
    ...getGaps('AESCSF'),
    ...getGaps('SOCI'),
    ...getGaps('ASD_FORTIFY'),
    ...getGaps('ESSENTIAL_EIGHT'),
  ];

  const criticalGaps = allGaps.filter(g => g.priority === 'critical');
  const highGaps = allGaps.filter(g => g.priority === 'high');

  // E8 achieved maturity per strategy
  const e8MaturitySummary = E8_STRATEGIES.map(s => ({
    name: s.shortName,
    number: s.number,
    achieved: computeAchievedMaturity(s, state.assessments),
    color: s.color,
  }));

  // Controls by status for each framework
  function getStatusCounts(framework) {
    const a = Object.values(state.assessments).filter(x => x.framework === framework);
    return {
      compliant: a.filter(x => x.status === 'COMPLIANT').length,
      partial: a.filter(x => x.status === 'PARTIALLY_COMPLIANT').length,
      nonCompliant: a.filter(x => x.status === 'NON_COMPLIANT').length,
      notAssessed: a.filter(x => x.status === 'NOT_ASSESSED').length,
      na: a.filter(x => x.status === 'NOT_APPLICABLE').length,
    };
  }

  function getScoreColor(score) {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  }

  function getScoreLabel(score) {
    if (score >= 80) return 'Compliant';
    if (score >= 60) return 'Partially Compliant';
    if (score >= 40) return 'At Risk';
    return 'Non-Compliant';
  }

  const aescsfCounts = getStatusCounts('AESCSF');
  const sociCounts = getStatusCounts('SOCI');
  const asdCounts = getStatusCounts('ASD_FORTIFY');
  const e8Counts = getStatusCounts('ESSENTIAL_EIGHT');

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Print button */}
      <div className="flex justify-end mb-6 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Printer className="w-4 h-4" /> Print / Export PDF
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm print:shadow-none print:border-0">
        {/* Report header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-purple-800 text-white p-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">OT Cybersecurity Compliance Report</h1>
                  <p className="text-blue-200 text-sm">Australian Critical Infrastructure Security Frameworks</p>
                </div>
              </div>
              {state.organisation.name && (
                <p className="text-lg font-semibold text-white/90 mt-2">{state.organisation.name}</p>
              )}
              {state.organisation.sector && (
                <p className="text-blue-200 text-sm">Sector: {state.organisation.sector}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-sm">Report Date</p>
              <p className="text-white font-semibold">{reportDate}</p>
              <div className="mt-3 flex flex-col items-end gap-1">
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded">AESCSF {state.aescsfProfile}</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded">ASD Fortify {state.asdTargetMaturity}</span>
                {state.isSoNS && <span className="text-xs bg-red-500/70 px-2 py-0.5 rounded">SoNS</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Executive Summary */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">1. Executive Summary</h2>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl">
                <div className="relative">
                  <ScoreCircle score={overallScore} color={getScoreColor(overallScore)} size={100} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{overallScore}%</span>
                  </div>
                </div>
                <p className="mt-3 font-semibold text-gray-700">Overall Score</p>
                <span className="text-sm font-medium mt-1" style={{ color: getScoreColor(overallScore) }}>
                  {getScoreLabel(overallScore)}
                </span>
              </div>

              <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'AESCSF', sublabel: aescsfProfile?.id, score: aescsfScore.score, color: '#3b82f6' },
                  { label: 'SOCI Act', sublabel: state.isSoNS ? 'SoNS' : 'Standard', score: sociScore.score, color: '#8b5cf6' },
                  { label: 'ASD Fortify', sublabel: asdML?.id, score: asdScore.score, color: '#10b981' },
                  { label: 'Essential Eight', sublabel: e8ML?.id, score: e8Score.score, color: '#f97316' },
                ].map(fw => (
                  <div key={fw.label} className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
                    <div className="relative">
                      <ScoreCircle score={fw.score} color={fw.color} size={80} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-900">{fw.score}%</span>
                      </div>
                    </div>
                    <p className="mt-2 font-semibold text-gray-700 text-sm">{fw.label}</p>
                    <p className="text-xs text-gray-400">{fw.sublabel}</p>
                    <span className="text-xs font-medium mt-1" style={{ color: getScoreColor(fw.score) }}>
                      {getScoreLabel(fw.score)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl border-l-4 text-sm" style={{
              borderColor: getScoreColor(overallScore),
              backgroundColor: getScoreColor(overallScore) + '10',
            }}>
              <p className="font-semibold mb-1" style={{ color: getScoreColor(overallScore) }}>
                Assessment Status: {getScoreLabel(overallScore)}
              </p>
              <p className="text-gray-700">
                This assessment covers {Object.keys(state.assessments).length} controls across AESCSF, SOCI Act, ASD Fortify, and Essential Eight frameworks.
                {criticalGaps.length > 0 && ` There are ${criticalGaps.length} critical priority gaps requiring immediate attention.`}
                {allGaps.filter(g => g.assessment?.status === 'NOT_ASSESSED').length > 0 &&
                  ` ${allGaps.filter(g => g.assessment?.status === 'NOT_ASSESSED').length} controls have not yet been assessed.`}
              </p>
            </div>
          </section>

          {/* Framework scores visual */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">2. Framework Compliance Overview</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">AESCSF Function Scores</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="function" tick={{ fill: '#6b7280', fontSize: 11 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 9 }} />
                      <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
                      <Tooltip formatter={(v, n, p) => [`${v}%`, p.payload.name]} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Compliance by Framework</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={frameworkBarData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fill: '#6b7280', fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#374151', fontSize: 12 }} />
                      <Tooltip formatter={v => [`${v}%`, 'Score']} contentStyle={{ borderRadius: '8px' }} />
                      <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                        {frameworkBarData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          {/* Control status tables */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">3. Control Status Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: 'AESCSF', counts: aescsfCounts, color: '#3b82f6' },
                { label: 'SOCI Act', counts: sociCounts, color: '#8b5cf6' },
                { label: 'ASD Fortify', counts: asdCounts, color: '#10b981' },
                { label: 'Essential Eight', counts: e8Counts, color: '#f97316' },
              ].map(fw => (
                <div key={fw.label} className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-bold text-gray-800 mb-3" style={{ color: fw.color }}>{fw.label}</h3>
                  <StatusSummaryRow label="Compliant" count={fw.counts.compliant} color="#10b981" icon={CheckCircle2} />
                  <StatusSummaryRow label="Partially Compliant" count={fw.counts.partial} color="#f59e0b" icon={Clock} />
                  <StatusSummaryRow label="Non-Compliant" count={fw.counts.nonCompliant} color="#ef4444" icon={AlertTriangle} />
                  <StatusSummaryRow label="Not Assessed" count={fw.counts.notAssessed} color="#9ca3af" icon={Clock} />
                  <StatusSummaryRow label="Not Applicable" count={fw.counts.na} color="#6b7280" icon={AlertCircle} />
                </div>
              ))}
            </div>
          </section>

          {/* Essential Eight Maturity Summary */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">4. Essential Eight Maturity Status</h2>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm text-gray-600">Target Maturity Level:</span>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">{e8ML?.id} — {e8ML?.name}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {e8MaturitySummary.map(s => {
                const mlOrder = ['ML0', 'ML1', 'ML2', 'ML3'];
                const achievedIdx = mlOrder.indexOf(s.achieved);
                const targetIdx = mlOrder.indexOf(state.e8TargetMaturity);
                const met = achievedIdx >= targetIdx;
                return (
                  <div key={s.number} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{E8_STRATEGIES.find(x => x.number === s.number)?.icon}</span>
                      <span className="text-xs font-semibold text-gray-700 leading-tight">{s.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Achieved</p>
                        <p className="font-bold text-sm" style={{ color: s.color }}>{s.achieved}</p>
                      </div>
                      <div className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        met ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {met ? '✓ Met' : '✗ Gap'}
                      </div>
                    </div>
                    {/* Maturity bar */}
                    <div className="mt-2 flex gap-0.5">
                      {['ML1', 'ML2', 'ML3'].map(ml => (
                        <div
                          key={ml}
                          className="flex-1 h-1.5 rounded-full"
                          style={{ backgroundColor: mlOrder.indexOf(ml) <= achievedIdx ? s.color : '#e5e7eb' }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Critical & High Gaps */}
          {(criticalGaps.length > 0 || highGaps.length > 0) && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">5. Priority Compliance Gaps</h2>

              {criticalGaps.length > 0 && (
                <>
                  <h3 className="text-sm font-bold text-red-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Critical Priority ({criticalGaps.length})
                  </h3>
                  <div className="space-y-2 mb-6">
                    {criticalGaps.map(gap => (
                      <div key={gap.id} className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                        <span className="font-mono text-xs font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded flex-shrink-0">{gap.id}</span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">{gap.description}</p>
                          {gap.categoryName && <p className="text-xs text-gray-500 mt-0.5">{gap.categoryName}</p>}
                        </div>
                        <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded flex-shrink-0">
                          {COMPLIANCE_STATUS[gap.assessment?.status]?.label || 'Not Assessed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {highGaps.length > 0 && (
                <>
                  <h3 className="text-sm font-bold text-orange-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> High Priority ({highGaps.length})
                  </h3>
                  <div className="space-y-2">
                    {highGaps.slice(0, 10).map(gap => (
                      <div key={gap.id} className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-100 rounded-lg">
                        <span className="font-mono text-xs font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded flex-shrink-0">{gap.id}</span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">{gap.description}</p>
                          {gap.categoryName && <p className="text-xs text-gray-500 mt-0.5">{gap.categoryName}</p>}
                        </div>
                        <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded flex-shrink-0">
                          {COMPLIANCE_STATUS[gap.assessment?.status]?.label || 'Not Assessed'}
                        </span>
                      </div>
                    ))}
                    {highGaps.length > 10 && (
                      <p className="text-sm text-gray-500 text-center">... and {highGaps.length - 10} more high priority gaps</p>
                    )}
                  </div>
                </>
              )}
            </section>
          )}

          {/* Recommendations */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">6. Recommendations</h2>
            <div className="space-y-3">
              {[
                criticalGaps.length > 0 && {
                  priority: 'Immediate',
                  color: '#ef4444',
                  text: `Address ${criticalGaps.length} critical compliance gaps. These represent the highest risk to your OT environment and regulatory obligations.`,
                },
                aescsfScore.notAssessed > 0 && {
                  priority: 'Short-term',
                  color: '#f97316',
                  text: `Complete assessment of ${aescsfScore.notAssessed} AESCSF controls. Unevaluated controls create unknown risk exposure.`,
                },
                sociScore.score < 80 && {
                  priority: 'Short-term',
                  color: '#8b5cf6',
                  text: `Improve SOCI Act compliance from ${sociScore.score}% to meet regulatory obligations. Focus on incident reporting and risk management program requirements.`,
                },
                asdScore.score < 70 && {
                  priority: 'Medium-term',
                  color: '#10b981',
                  text: `Improve ASD Fortify maturity level compliance to ${state.asdTargetMaturity}. Focus on OT-applicable Essential Eight controls first.`,
                },
                e8Score.score < 70 && {
                  priority: 'Medium-term',
                  color: '#f97316',
                  text: `Advance Essential Eight maturity. ${e8MaturitySummary.filter(s => ['ML0', 'ML1'].includes(s.achieved) && s.achieved < state.e8TargetMaturity).length} strategies have not reached ${state.e8TargetMaturity}. Prioritise ML1 controls across all strategies first.`,
                },
                {
                  priority: 'Ongoing',
                  color: '#3b82f6',
                  text: 'Review and update compliance assessments following any significant change, security incident, or annually at minimum.',
                },
              ].filter(Boolean).map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl border" style={{ backgroundColor: rec.color + '08', borderColor: rec.color + '30' }}>
                  <span className="text-xs font-bold px-2 py-1 rounded flex-shrink-0" style={{ backgroundColor: rec.color + '20', color: rec.color }}>
                    {rec.priority}
                  </span>
                  <p className="text-sm text-gray-800">{rec.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-6 text-xs text-gray-400 text-center">
            <p>Generated by OT Compliance Tracker · {reportDate}</p>
            <p className="mt-1">Frameworks: AESCSF v2.0 · SOCI Act 2018 (amended 2022) · ASD Fortify · ASD Essential Eight Maturity Model</p>
            <p className="mt-1">This report is for internal compliance tracking purposes. Consult a qualified cybersecurity professional for formal assessments.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
