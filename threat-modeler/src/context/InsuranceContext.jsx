import { createContext, useContext, useReducer, useCallback } from 'react';

// ── Sample Data ───────────────────────────────────────────────────────────────

export const NIST_CONTROLS = [
  // GOVERN
  { id: 'gc-awareness',   name: 'Security Awareness Training', nistFunction: 'GOVERN',   status: 'partial',      coverage: 72, performance: 70, premiumImpact: 4,  policyRequired: true,  tool: 'KnowBe4',                     gap: 'Only 68% of staff completed annual training' },
  { id: 'gc-risk',        name: 'Security Risk Assessment',    nistFunction: 'GOVERN',   status: 'implemented',  coverage: 100,performance: 95, premiumImpact: 3,  policyRequired: true,  tool: 'Manual',                      gap: null },
  // IDENTIFY
  { id: 'id-threat',      name: 'Threat Intelligence',         nistFunction: 'IDENTIFY', status: 'partial',      coverage: 60, performance: 65, premiumImpact: 6,  policyRequired: false, tool: 'CrowdStrike Falcon',           gap: 'No automated feed integration' },
  { id: 'id-vuln',        name: 'Vulnerability Management',    nistFunction: 'IDENTIFY', status: 'implemented',  coverage: 83, performance: 80, premiumImpact: 12, policyRequired: true,  tool: 'Tenable.io',                   gap: 'Critical CVEs >30 days unpatched' },
  { id: 'id-asset',       name: 'Asset Inventory',             nistFunction: 'IDENTIFY', status: 'partial',      coverage: 74, performance: 72, premiumImpact: 6,  policyRequired: true,  tool: 'Tenable.io',                   gap: 'Cloud assets not fully catalogued' },
  // PROTECT
  { id: 'pr-av',          name: 'Anti-Malware / Antivirus',    nistFunction: 'PROTECT',  status: 'implemented',  coverage: 95, performance: 94, premiumImpact: 5,  policyRequired: true,  tool: 'Microsoft Defender',           gap: null },
  { id: 'pr-mfa',         name: 'Multi-Factor Authentication', nistFunction: 'PROTECT',  status: 'partial',      coverage: 85, performance: 85, premiumImpact: 18, policyRequired: true,  tool: 'Microsoft Entra ID',           gap: '15% of privileged accounts lack MFA' },
  { id: 'pr-zt',          name: 'Zero Trust / Network Seg.',   nistFunction: 'PROTECT',  status: 'partial',      coverage: 58, performance: 55, premiumImpact: 14, policyRequired: false, tool: 'Zscaler',                      gap: 'Zscaler degraded — lateral movement risk' },
  { id: 'pr-email',       name: 'Email Security',              nistFunction: 'PROTECT',  status: 'implemented',  coverage: 96, performance: 93, premiumImpact: 8,  policyRequired: true,  tool: 'Mimecast',                     gap: null },
  { id: 'pr-dlp',         name: 'Data Loss Prevention',        nistFunction: 'PROTECT',  status: 'missing',      coverage: 0,  performance: 0,  premiumImpact: 16, policyRequired: true,  tool: null,                           gap: 'No DLP solution deployed' },
  { id: 'pr-pam',         name: 'Privileged Access Mgmt.',     nistFunction: 'PROTECT',  status: 'partial',      coverage: 71, performance: 74, premiumImpact: 10, policyRequired: true,  tool: 'CyberArk',                     gap: 'Service accounts not fully vaulted' },
  // DETECT
  { id: 'de-edr',         name: 'Endpoint Detection & Response', nistFunction: 'DETECT', status: 'implemented',  coverage: 91, performance: 90, premiumImpact: 9,  policyRequired: true,  tool: 'Microsoft Defender / CrowdStrike', gap: null },
  { id: 'de-siem',        name: 'SIEM',                        nistFunction: 'DETECT',   status: 'implemented',  coverage: 76, performance: 80, premiumImpact: 7,  policyRequired: false, tool: 'Splunk',                       gap: 'Log ingestion coverage gaps in OT segment' },
  // RESPOND
  { id: 'rs-ir',          name: 'Incident Response',           nistFunction: 'RESPOND',  status: 'partial',      coverage: 70, performance: 68, premiumImpact: 11, policyRequired: true,  tool: 'Manual',                       gap: 'IR plan not tested in 18+ months' },
  // RECOVER
  { id: 'rc-backup',      name: 'Backup & Disaster Recovery',  nistFunction: 'RECOVER',  status: 'partial',      coverage: 80, performance: 82, premiumImpact: 17, policyRequired: true,  tool: 'Veeam',                        gap: 'Immutable backup not configured for all critical systems' },
];

export const SECURITY_TOOLS = [
  { id: 'defender',   name: 'Microsoft Defender for Endpoint', vendor: 'Microsoft',   category: 'EDR',                  status: 'active',    coverage: 91, performance: 90, metrics: { threatsBlocked: 1247, detectionRate: '98.2%' },  apiConnected: true },
  { id: 'crowdstrike',name: 'CrowdStrike Falcon',              vendor: 'CrowdStrike', category: 'EDR',                  status: 'active',    coverage: 88, performance: 92, metrics: { sensorIntegrity: '97%', deviceHealth: '94%' },       apiConnected: true },
  { id: 'splunk',     name: 'Splunk SIEM',                     vendor: 'Splunk',      category: 'SIEM',                 status: 'active',    coverage: 76, performance: 80, metrics: { eventsPerDay: '2.4M', alertFidelity: '87%' },        apiConnected: false },
  { id: 'entra',      name: 'Microsoft Entra ID',              vendor: 'Microsoft',   category: 'Identity & IAM',       status: 'active',    coverage: 85, performance: 88, metrics: { mfaEnabled: '85%', conditionalAccess: 12 },           apiConnected: true },
  { id: 'cyberark',   name: 'CyberArk',                        vendor: 'CyberArk',    category: 'Privileged Access',    status: 'active',    coverage: 71, performance: 74, metrics: { vaultedAccounts: 234, sessionRecordings: 89 },        apiConnected: false },
  { id: 'tenable',    name: 'Tenable.io',                      vendor: 'Tenable',     category: 'Vulnerability Mgmt',  status: 'active',    coverage: 83, performance: 80, metrics: { assetsScanned: 1842, criticalCVEs: 23 },               apiConnected: true },
  { id: 'mimecast',   name: 'Mimecast',                        vendor: 'Mimecast',    category: 'Email Security',       status: 'active',    coverage: 96, performance: 93, metrics: { emailsScanned: '48K/day', phishingBlocked: 312 },      apiConnected: false },
  { id: 'zscaler',    name: 'Zscaler Zero Trust',              vendor: 'Zscaler',     category: 'Zero Trust / ZTNA',   status: 'degraded',  coverage: 58, performance: 55, metrics: { tunnelsActive: 847, policyViolations: 14 },            apiConnected: true },
  { id: 'veeam',      name: 'Veeam Backup & Replication',      vendor: 'Veeam',       category: 'Backup & Recovery',   status: 'active',    coverage: 80, performance: 82, metrics: { backupJobs: 156, lastSuccessful: '2h ago' },            apiConnected: false },
  { id: 'knowbe4',    name: 'KnowBe4',                         vendor: 'KnowBe4',     category: 'Security Awareness',  status: 'active',    coverage: 72, performance: 70, metrics: { trainingCompletion: '68%', phishTestFail: '12%' },       apiConnected: false },
];

export const INSURANCE_ROADMAP = [
  { id: 1, action: 'Deploy DLP Solution',              effort: 'Major',    savings: 42000, timeline: '3–4 months', savingsPct: 33, controlId: 'pr-dlp' },
  { id: 2, action: 'Enforce Full MFA Coverage',        effort: 'Medium',   savings: 38000, timeline: '4–6 weeks',  savingsPct: 30, controlId: 'pr-mfa' },
  { id: 3, action: 'Immutable Backup Implementation',  effort: 'Medium',   savings: 22000, timeline: '6–8 weeks',  savingsPct: 17, controlId: 'rc-backup' },
  { id: 4, action: 'Patch Critical Vulnerabilities',   effort: 'Medium',   savings: 15000, timeline: '2–4 weeks',  savingsPct: 12, controlId: 'id-vuln' },
  { id: 5, action: 'IR Plan Tabletop Exercise',        effort: 'Quick Win',savings: 10000, timeline: '1–2 weeks',  savingsPct: 8,  controlId: 'rs-ir' },
];

const INITIAL_STATE = {
  assessment: {
    lastAssessmentDate: '2026-04-28',
    riskScore: 62,
    riskLevel: 'High',
    currentPremium: 485000,
    potentialSavings: 127000,
    sumInsured: 10000000,
    controlsCovered: 14,
    totalControls: 15,
    policyCompliance: 25,
    criticalGaps: 4,
    controlsImplemented: 6,
    controlsPartial: 8,
    controlsMissing: 1,
  },
  policyRequirements: [],
  policyAnalysisLoading: false,
  policyAnalysisError: null,
  manualAssessmentData: null,
  manualAssessmentLoading: false,
  integrationStatus: {
    entra: false,
    defender: false,
    crowdstrike: false,
    tenable: false,
  },
};

// ── Reducer ───────────────────────────────────────────────────────────────────

function insuranceReducer(state, action) {
  switch (action.type) {
    case 'SET_POLICY_LOADING':
      return { ...state, policyAnalysisLoading: action.payload, policyAnalysisError: null };
    case 'SET_POLICY_REQUIREMENTS':
      return { ...state, policyRequirements: action.payload, policyAnalysisLoading: false, policyAnalysisError: null };
    case 'SET_POLICY_ERROR':
      return { ...state, policyAnalysisLoading: false, policyAnalysisError: action.payload };
    case 'SET_MANUAL_LOADING':
      return { ...state, manualAssessmentLoading: action.payload };
    case 'SET_MANUAL_RESULT':
      return { ...state, manualAssessmentData: action.payload, manualAssessmentLoading: false, assessment: { ...state.assessment, ...action.payload.assessment } };
    case 'SET_INTEGRATION':
      return { ...state, integrationStatus: { ...state.integrationStatus, [action.payload.key]: action.payload.connected } };
    case 'CLEAR_POLICY':
      return { ...state, policyRequirements: [], policyAnalysisError: null };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const InsuranceContext = createContext(null);

export function InsuranceProvider({ children }) {
  const [state, dispatch] = useReducer(insuranceReducer, INITIAL_STATE);

  const setPolicyRequirements = useCallback((reqs) =>
    dispatch({ type: 'SET_POLICY_REQUIREMENTS', payload: reqs }), []);

  const setPolicyLoading = useCallback((v) =>
    dispatch({ type: 'SET_POLICY_LOADING', payload: v }), []);

  const setPolicyError = useCallback((err) =>
    dispatch({ type: 'SET_POLICY_ERROR', payload: err }), []);

  const setManualResult = useCallback((result) =>
    dispatch({ type: 'SET_MANUAL_RESULT', payload: result }), []);

  const setManualLoading = useCallback((v) =>
    dispatch({ type: 'SET_MANUAL_LOADING', payload: v }), []);

  const setIntegration = useCallback((key, connected) =>
    dispatch({ type: 'SET_INTEGRATION', payload: { key, connected } }), []);

  const clearPolicy = useCallback(() =>
    dispatch({ type: 'CLEAR_POLICY' }), []);

  const getNistFunctionScore = useCallback((fn) => {
    const controls = NIST_CONTROLS.filter(c => c.nistFunction === fn);
    if (!controls.length) return 0;
    return Math.round(controls.reduce((s, c) => s + c.coverage, 0) / controls.length);
  }, []);

  return (
    <InsuranceContext.Provider value={{
      state,
      setPolicyRequirements,
      setPolicyLoading,
      setPolicyError,
      setManualResult,
      setManualLoading,
      setIntegration,
      clearPolicy,
      getNistFunctionScore,
      controls: NIST_CONTROLS,
      tools: SECURITY_TOOLS,
      roadmap: INSURANCE_ROADMAP,
    }}>
      {children}
    </InsuranceContext.Provider>
  );
}

export function useInsurance() {
  const ctx = useContext(InsuranceContext);
  if (!ctx) throw new Error('useInsurance must be used within InsuranceProvider');
  return ctx;
}
