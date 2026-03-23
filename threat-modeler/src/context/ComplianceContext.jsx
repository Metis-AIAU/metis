import { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { AESCSF_FUNCTIONS, COMPLIANCE_STATUS } from '../data/aescsf';
import { SOCI_OBLIGATIONS } from '../data/soci';
import { ASD_FORTIFY_STRATEGIES } from '../data/asdFortify';
import { E8_STRATEGIES, computeAchievedMaturity } from '../data/essentialEight';
import { useAuth } from './AuthContext';
import { apiGet, apiPut, apiPost, NetworkError } from '../services/api';

const ComplianceContext = createContext(null);

// Build initial state from framework data
function buildInitialAssessments() {
  const assessments = {};

  // AESCSF controls
  AESCSF_FUNCTIONS.forEach(fn => {
    fn.categories.forEach(cat => {
      cat.controls.forEach(ctrl => {
        assessments[ctrl.id] = {
          status: COMPLIANCE_STATUS.NOT_ASSESSED.id,
          evidence: '',
          notes: '',
          assignee: '',
          targetDate: '',
          lastUpdated: null,
          framework: 'AESCSF',
        };
      });
    });
  });

  // SOCI obligations
  SOCI_OBLIGATIONS.forEach(obl => {
    obl.controls.forEach(ctrl => {
      assessments[ctrl.id] = {
        status: COMPLIANCE_STATUS.NOT_ASSESSED.id,
        evidence: '',
        notes: '',
        assignee: '',
        targetDate: '',
        lastUpdated: null,
        framework: 'SOCI',
      };
    });
  });

  // ASD Fortify controls
  ASD_FORTIFY_STRATEGIES.forEach(strategy => {
    strategy.controls.forEach(ctrl => {
      assessments[ctrl.id] = {
        status: COMPLIANCE_STATUS.NOT_ASSESSED.id,
        evidence: '',
        notes: '',
        assignee: '',
        targetDate: '',
        lastUpdated: null,
        framework: 'ASD_FORTIFY',
      };
    });
  });

  // Essential Eight controls
  E8_STRATEGIES.forEach(strategy => {
    strategy.controls.forEach(ctrl => {
      assessments[ctrl.id] = {
        status: COMPLIANCE_STATUS.NOT_ASSESSED.id,
        evidence: '',
        notes: '',
        assignee: '',
        targetDate: '',
        lastUpdated: null,
        framework: 'ESSENTIAL_EIGHT',
      };
    });
  });

  return assessments;
}

const INITIAL_STATE = {
  aescsfProfile: 'SP1',
  asdTargetMaturity: 'ML2',
  // Target maturity level for Essential Eight (per-strategy overrides or global)
  e8TargetMaturity: 'ML2',
  isSoNS: false,
  organisation: {
    name: '',
    sector: '',
    abn: '',
    contactName: '',
    contactEmail: '',
  },
  assessments: buildInitialAssessments(),
  auditLog: [],
};

function complianceReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_ASSESSMENT': {
      const { controlId, updates } = action.payload;
      const existing = state.assessments[controlId] || {};
      const newAssessment = {
        ...existing,
        ...updates,
        lastUpdated: new Date().toISOString(),
      };
      const logEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        controlId,
        previousStatus: existing.status,
        newStatus: updates.status || existing.status,
        action: 'Assessment Updated',
      };
      return {
        ...state,
        assessments: {
          ...state.assessments,
          [controlId]: newAssessment,
        },
        auditLog: [logEntry, ...state.auditLog].slice(0, 200),
      };
    }
    case 'SET_AESCSF_PROFILE':
      return { ...state, aescsfProfile: action.payload };
    case 'SET_ASD_TARGET_MATURITY':
      return { ...state, asdTargetMaturity: action.payload };
    case 'SET_E8_TARGET_MATURITY':
      return { ...state, e8TargetMaturity: action.payload };
    case 'SET_SONS':
      return { ...state, isSoNS: action.payload };
    case 'UPDATE_ORGANISATION':
      return { ...state, organisation: { ...state.organisation, ...action.payload } };
    case 'BULK_UPDATE_ASSESSMENTS': {
      const updates = {};
      action.payload.forEach(({ controlId, assessment }) => {
        updates[controlId] = {
          ...state.assessments[controlId],
          ...assessment,
          lastUpdated: new Date().toISOString(),
        };
      });
      return { ...state, assessments: { ...state.assessments, ...updates } };
    }
    case 'RESET_FRAMEWORK': {
      const framework = action.payload;
      const reset = {};
      Object.keys(state.assessments).forEach(id => {
        if (state.assessments[id].framework === framework) {
          reset[id] = { ...state.assessments[id], status: COMPLIANCE_STATUS.NOT_ASSESSED.id };
        }
      });
      return { ...state, assessments: { ...state.assessments, ...reset } };
    }
    case 'LOAD_STATE':
      return { ...INITIAL_STATE, ...action.payload, assessments: { ...buildInitialAssessments(), ...action.payload.assessments } };
    default:
      return state;
  }
}

const STORAGE_KEY = 'ot_compliance_tracker_state';

export function ComplianceProvider({ children }) {
  const { isAuthenticated, isOffline } = useAuth();

  const [state, dispatch] = useReducer(complianceReducer, INITIAL_STATE, (initial) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initial, ...parsed, assessments: { ...buildInitialAssessments(), ...(parsed.assessments || {}) } };
      }
    } catch {
      // ignore
    }
    return initial;
  });

  // Migration flag: true when server has no state but localStorage does
  const [hasPendingMigration, setHasPendingMigration] = useState(false);

  // On mount (after auth is ready): load state from server
  useEffect(() => {
    if (!isAuthenticated || isOffline) return;

    apiGet('/api/state')
      .then(serverState => {
        const isEmpty = !serverState || Object.keys(serverState).length === 0;
        if (isEmpty) {
          // Check if localStorage has meaningful data to migrate
          try {
            const local = localStorage.getItem(STORAGE_KEY);
            if (local) {
              const parsed = JSON.parse(local);
              const hasData = parsed.assessments &&
                Object.values(parsed.assessments).some(a => a.status !== 'NOT_ASSESSED');
              if (hasData) setHasPendingMigration(true);
            }
          } catch { /* ignore */ }
        } else {
          // Hydrate from server — merges over INITIAL_STATE to fill any new controls
          dispatch({ type: 'LOAD_STATE', payload: serverState });
        }
      })
      .catch(err => {
        if (!(err instanceof NetworkError)) {
          console.warn('[ComplianceContext] Could not load server state:', err.message);
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isOffline]);

  // Debounced sync: write to localStorage immediately, sync to server after 1s idle
  const syncTimer = useRef(null);

  useEffect(() => {
    // Always keep localStorage up to date
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }

    // Sync to server if authenticated and online
    if (!isAuthenticated || isOffline) return;

    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      apiPut('/api/state', state).catch(err => {
        if (!(err instanceof NetworkError)) {
          console.warn('[ComplianceContext] Server sync failed:', err.message);
        }
      });
    }, 1000);

    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [state, isAuthenticated, isOffline]);

  /** Import local compliance data to the server account (migration flow) */
  async function importLocalData() {
    try {
      await apiPut('/api/state', state);
      setHasPendingMigration(false);
    } catch (err) {
      console.warn('[ComplianceContext] Migration failed:', err.message);
      throw err;
    }
  }

  /** Wrap dispatch so individual assessment updates also hit the fast /assessment endpoint */
  function dispatchWithSync(action) {
    dispatch(action);
    if (action.type === 'UPDATE_ASSESSMENT' && isAuthenticated && !isOffline) {
      const { controlId, updates } = action.payload;
      apiPost('/api/state/assessment', { controlId, updates }).catch(() => {
        // Silent fail — the debounced full sync will cover it
      });
    }
  }

  // ── Computed helpers ──────────────────────────────────────────────

  function getFrameworkScore(framework) {
    const controls = Object.entries(state.assessments).filter(([, a]) => a.framework === framework);
    if (controls.length === 0) return { score: 0, compliant: 0, total: 0, partial: 0, nonCompliant: 0, notAssessed: 0, na: 0 };
    const compliant = controls.filter(([, a]) => a.status === 'COMPLIANT').length;
    const partial = controls.filter(([, a]) => a.status === 'PARTIALLY_COMPLIANT').length;
    const nonCompliant = controls.filter(([, a]) => a.status === 'NON_COMPLIANT').length;
    const notAssessed = controls.filter(([, a]) => a.status === 'NOT_ASSESSED').length;
    const na = controls.filter(([, a]) => a.status === 'NOT_APPLICABLE').length;
    const applicable = controls.length - na;
    const score = applicable > 0 ? Math.round(((compliant + partial * 0.5) / applicable) * 100) : 0;
    return { score, compliant, partial, nonCompliant, notAssessed, na, total: controls.length, applicable };
  }

  function getAescsfFunctionScore(functionId) {
    const fn = AESCSF_FUNCTIONS.find(f => f.id === functionId);
    if (!fn) return { score: 0, compliant: 0, total: 0 };
    const controls = fn.categories.flatMap(c => c.controls);
    const profileControls = controls.filter(c => c[state.aescsfProfile.toLowerCase()]);
    const assessed = profileControls.map(c => state.assessments[c.id]).filter(Boolean);
    const compliant = assessed.filter(a => a.status === 'COMPLIANT').length;
    const partial = assessed.filter(a => a.status === 'PARTIALLY_COMPLIANT').length;
    const na = assessed.filter(a => a.status === 'NOT_APPLICABLE').length;
    const applicable = assessed.length - na;
    const score = applicable > 0 ? Math.round(((compliant + partial * 0.5) / applicable) * 100) : 0;
    return { score, compliant, partial, total: profileControls.length, applicable };
  }

  function getAsdStrategyScore(strategyId) {
    const strategy = ASD_FORTIFY_STRATEGIES.find(s => s.id === strategyId);
    if (!strategy) return { score: 0, achieved: 0, total: 0 };
    const targetIndex = ['ML0', 'ML1', 'ML2', 'ML3'].indexOf(state.asdTargetMaturity);
    const inScopeControls = strategy.controls.filter(c => {
      const ctrlIndex = ['ML0', 'ML1', 'ML2', 'ML3'].indexOf(c.maturityLevel);
      return ctrlIndex <= targetIndex;
    });
    const compliant = inScopeControls.filter(c => state.assessments[c.id]?.status === 'COMPLIANT').length;
    const partial = inScopeControls.filter(c => state.assessments[c.id]?.status === 'PARTIALLY_COMPLIANT').length;
    const score = inScopeControls.length > 0 ? Math.round(((compliant + partial * 0.5) / inScopeControls.length) * 100) : 0;
    return { score, compliant, partial, total: inScopeControls.length };
  }

  /** Score for one E8 strategy within the target maturity level */
  function getE8StrategyScore(strategyId) {
    const strategy = E8_STRATEGIES.find(s => s.id === strategyId);
    if (!strategy) return { score: 0, compliant: 0, total: 0, achievedMaturity: 'ML0' };
    const ML_ORDER = ['ML1', 'ML2', 'ML3'];
    const targetIndex = ML_ORDER.indexOf(state.e8TargetMaturity);
    const inScope = strategy.controls.filter(c => ML_ORDER.indexOf(c.maturity) <= targetIndex);
    const compliant = inScope.filter(c => state.assessments[c.id]?.status === 'COMPLIANT').length;
    const partial = inScope.filter(c => state.assessments[c.id]?.status === 'PARTIALLY_COMPLIANT').length;
    const na = inScope.filter(c => state.assessments[c.id]?.status === 'NOT_APPLICABLE').length;
    const applicable = inScope.length - na;
    const score = applicable > 0 ? Math.round(((compliant + partial * 0.5) / applicable) * 100) : 0;
    const achievedMaturity = computeAchievedMaturity(strategy, state.assessments);
    return { score, compliant, partial, total: inScope.length, applicable, achievedMaturity };
  }

  function getOverallScore() {
    const aescsf = getFrameworkScore('AESCSF');
    const soci = getFrameworkScore('SOCI');
    const asd = getFrameworkScore('ASD_FORTIFY');
    const e8 = getFrameworkScore('ESSENTIAL_EIGHT');
    return Math.round((aescsf.score + soci.score + asd.score + e8.score) / 4);
  }

  function getGaps(framework) {
    let controls = [];
    if (framework === 'AESCSF') {
      AESCSF_FUNCTIONS.forEach(fn => {
        fn.categories.forEach(cat => {
          cat.controls.forEach(ctrl => {
            if (ctrl[state.aescsfProfile.toLowerCase()]) {
              const assessment = state.assessments[ctrl.id];
              if (assessment && (assessment.status === 'NON_COMPLIANT' || assessment.status === 'NOT_ASSESSED')) {
                controls.push({ ...ctrl, functionId: fn.id, functionName: fn.name, categoryName: cat.name, assessment, framework: 'AESCSF' });
              }
            }
          });
        });
      });
    } else if (framework === 'SOCI') {
      SOCI_OBLIGATIONS.forEach(obl => {
        obl.controls.forEach(ctrl => {
          const assessment = state.assessments[ctrl.id];
          if (assessment && (assessment.status === 'NON_COMPLIANT' || assessment.status === 'NOT_ASSESSED')) {
            controls.push({ ...ctrl, categoryName: obl.name, assessment, framework: 'SOCI' });
          }
        });
      });
    } else if (framework === 'ASD_FORTIFY') {
      ASD_FORTIFY_STRATEGIES.forEach(strategy => {
        strategy.controls.forEach(ctrl => {
          const assessment = state.assessments[ctrl.id];
          if (assessment && (assessment.status === 'NON_COMPLIANT' || assessment.status === 'NOT_ASSESSED')) {
            controls.push({ ...ctrl, categoryName: strategy.name, assessment, framework: 'ASD_FORTIFY' });
          }
        });
      });
    } else if (framework === 'ESSENTIAL_EIGHT') {
      const ML_ORDER = ['ML1', 'ML2', 'ML3'];
      const targetIndex = ML_ORDER.indexOf(state.e8TargetMaturity);
      E8_STRATEGIES.forEach(strategy => {
        strategy.controls
          .filter(c => ML_ORDER.indexOf(c.maturity) <= targetIndex)
          .forEach(ctrl => {
            const assessment = state.assessments[ctrl.id];
            if (assessment && (assessment.status === 'NON_COMPLIANT' || assessment.status === 'NOT_ASSESSED')) {
              controls.push({
                ...ctrl,
                priority: ctrl.maturity === 'ML1' ? 'critical' : ctrl.maturity === 'ML2' ? 'high' : 'medium',
                categoryName: strategy.name,
                assessment,
                framework: 'ESSENTIAL_EIGHT',
              });
            }
          });
      });
    }
    return controls.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    });
  }

  return (
    <ComplianceContext.Provider value={{
      state,
      dispatch: dispatchWithSync,
      hasPendingMigration,
      importLocalData,
      dismissMigration: () => setHasPendingMigration(false),
      getFrameworkScore, getAescsfFunctionScore, getAsdStrategyScore,
      getE8StrategyScore, getOverallScore, getGaps,
    }}>
      {children}
    </ComplianceContext.Provider>
  );
}

export function useCompliance() {
  const ctx = useContext(ComplianceContext);
  if (!ctx) throw new Error('useCompliance must be used within ComplianceProvider');
  return ctx;
}
