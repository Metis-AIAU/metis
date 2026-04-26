import { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { AESCSF_FUNCTIONS, COMPLIANCE_STATUS } from '../data/aescsf';
import { SOCI_OBLIGATIONS } from '../data/soci';
import { ASD_FORTIFY_STRATEGIES } from '../data/asdFortify';
import { E8_STRATEGIES, computeAchievedMaturity } from '../data/essentialEight';
import { useAuth } from './AuthContext';
import { useOrg } from './OrgContext';
import { db } from '../firebase';

const ComplianceContext = createContext(null);

// ── Initial state helpers ──────────────────────────────────────────────────

function buildInitialAssessments() {
  const assessments = {};

  AESCSF_FUNCTIONS.forEach(fn => {
    fn.categories.forEach(cat => {
      cat.controls.forEach(ctrl => {
        assessments[ctrl.id] = {
          status: COMPLIANCE_STATUS.NOT_ASSESSED.id,
          evidence: '', notes: '', assignee: '', targetDate: '',
          lastUpdated: null, framework: 'AESCSF',
        };
      });
    });
  });

  SOCI_OBLIGATIONS.forEach(obl => {
    obl.controls.forEach(ctrl => {
      assessments[ctrl.id] = {
        status: COMPLIANCE_STATUS.NOT_ASSESSED.id,
        evidence: '', notes: '', assignee: '', targetDate: '',
        lastUpdated: null, framework: 'SOCI',
      };
    });
  });

  ASD_FORTIFY_STRATEGIES.forEach(strategy => {
    strategy.controls.forEach(ctrl => {
      assessments[ctrl.id] = {
        status: COMPLIANCE_STATUS.NOT_ASSESSED.id,
        evidence: '', notes: '', assignee: '', targetDate: '',
        lastUpdated: null, framework: 'ASD_FORTIFY',
      };
    });
  });

  E8_STRATEGIES.forEach(strategy => {
    strategy.controls.forEach(ctrl => {
      assessments[ctrl.id] = {
        status: COMPLIANCE_STATUS.NOT_ASSESSED.id,
        evidence: '', notes: '', assignee: '', targetDate: '',
        lastUpdated: null, framework: 'ESSENTIAL_EIGHT',
      };
    });
  });

  return assessments;
}

const INITIAL_STATE = {
  aescsfProfile:     'SP1',
  asdTargetMaturity: 'ML2',
  e8TargetMaturity:  'ML2',
  isSoNS:            false,
  organisation: { name: '', sector: '', abn: '', contactName: '', contactEmail: '' },
  assessments: buildInitialAssessments(),
  auditLog: [],
};

// ── Reducer ────────────────────────────────────────────────────────────────

function complianceReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_ASSESSMENT': {
      const { controlId, updates } = action.payload;
      const existing = state.assessments[controlId] || {};
      const newAssessment = { ...existing, ...updates, lastUpdated: new Date().toISOString() };
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
        assessments: { ...state.assessments, [controlId]: newAssessment },
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
          ...state.assessments[controlId], ...assessment,
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
      return {
        ...INITIAL_STATE,
        ...action.payload,
        assessments: { ...buildInitialAssessments(), ...(action.payload.assessments || {}) },
      };
    default:
      return state;
  }
}

// ── Local-storage cache key (offline fallback) ─────────────────────────────

const STORAGE_KEY = 'ot_compliance_tracker_state';

// ── Firestore document reference helper ───────────────────────────────────

function complianceDocRef(orgId) {
  return doc(db, 'orgs', orgId, 'data', 'complianceState');
}

function legacyComplianceDocRef(uid) {
  return doc(db, 'users', uid, 'data', 'complianceState');
}

// ── Provider ───────────────────────────────────────────────────────────────

export function ComplianceProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const { currentOrg, canWrite } = useOrg();

  const [state, dispatch] = useReducer(complianceReducer, INITIAL_STATE, (initial) => {
    // Seed from localStorage while Firestore loads
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initial, ...parsed, assessments: { ...buildInitialAssessments(), ...(parsed.assessments || {}) } };
      }
    } catch { /* ignore */ }
    return initial;
  });

  const [hasPendingMigration, setHasPendingMigration] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const isRemoteUpdate = useRef(false);
  const lastWrite      = useRef(0);

  // ── Real-time org compliance subscription ─────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user?.id || !currentOrg?.id) return;

    let migrationAttempted = false;
    let hasSynced = false;

    const unsub = onSnapshot(
      complianceDocRef(currentOrg.id),
      async (snap) => {
        // Skip echoes of our own writes
        if (hasSynced && Date.now() - lastWrite.current < 2500) return;

        if (snap.exists()) {
          isRemoteUpdate.current = true;
          dispatch({ type: 'LOAD_STATE', payload: snap.data() });
          hasSynced = true;
          setTimeout(() => { isRemoteUpdate.current = false; }, 100);
        } else if (!migrationAttempted) {
          migrationAttempted = true;
          try {
            const legacySnap = await getDoc(legacyComplianceDocRef(user.id));
            if (legacySnap.exists()) {
              console.info('[ComplianceContext] migrating from legacy user path to org path');
              isRemoteUpdate.current = true;
              dispatch({ type: 'LOAD_STATE', payload: legacySnap.data() });
              hasSynced = true;
              setTimeout(() => { isRemoteUpdate.current = false; }, 100);
              return;
            }
          } catch { /* ignore */ }

          // Nothing in Firestore — check if localStorage has meaningful data to migrate
          try {
            const local = localStorage.getItem(STORAGE_KEY);
            if (local) {
              const parsed = JSON.parse(local);
              const hasData = parsed.assessments &&
                Object.values(parsed.assessments).some(a => a.status !== 'NOT_ASSESSED');
              if (hasData) setHasPendingMigration(true);
            }
          } catch { /* ignore */ }
          hasSynced = true;
        }
      },
      err => console.warn('[ComplianceContext] Firestore snapshot error:', err.message)
    );

    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAuthenticated, currentOrg?.id]);

  // ── Debounced sync: localStorage immediately, Firestore after 1 s idle ──
  const syncTimer = useRef(null);

  useEffect(() => {
    // Always persist to localStorage for offline resilience
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }

    if (!isAuthenticated || !user?.id || !currentOrg?.id) return;
    if (isRemoteUpdate.current) return; // don't echo remote updates back to Firestore

    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      try {
        setIsSyncing(true);
        lastWrite.current = Date.now();
        await setDoc(complianceDocRef(currentOrg.id), {
          ...state,
          _updatedAt: serverTimestamp(),
        }, { merge: false });
      } catch (err) {
        console.warn('[ComplianceContext] Firestore sync failed:', err.message);
      } finally {
        setIsSyncing(false);
      }
    }, 1000);

    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isAuthenticated, user?.id, currentOrg?.id]);

  /** Push local data to Firestore (migration flow) */
  async function importLocalData() {
    if (!currentOrg?.id) return;
    await setDoc(complianceDocRef(currentOrg.id), { ...state, _updatedAt: serverTimestamp() }, { merge: false });
    setHasPendingMigration(false);
  }

  // ── Dispatch wrapper — no extra endpoint call needed with Firestore ────
  function dispatchWithSync(action) {
    if (!canWrite) throw new Error('You have read-only access to this organisation.');
    dispatch(action);
    // Firestore sync happens automatically via the state-change useEffect above
  }

  // ── Computed helpers (unchanged from original) ────────────────────────

  function getFrameworkScore(framework) {
    const controls = Object.entries(state.assessments).filter(([, a]) => a.framework === framework);
    if (controls.length === 0)
      return { score: 0, compliant: 0, total: 0, partial: 0, nonCompliant: 0, notAssessed: 0, na: 0 };
    const compliant    = controls.filter(([, a]) => a.status === 'COMPLIANT').length;
    const partial      = controls.filter(([, a]) => a.status === 'PARTIALLY_COMPLIANT').length;
    const nonCompliant = controls.filter(([, a]) => a.status === 'NON_COMPLIANT').length;
    const notAssessed  = controls.filter(([, a]) => a.status === 'NOT_ASSESSED').length;
    const na           = controls.filter(([, a]) => a.status === 'NOT_APPLICABLE').length;
    const applicable   = controls.length - na;
    const score        = applicable > 0 ? Math.round(((compliant + partial * 0.5) / applicable) * 100) : 0;
    return { score, compliant, partial, nonCompliant, notAssessed, na, total: controls.length, applicable };
  }

  function getAescsfFunctionScore(functionId) {
    const fn = AESCSF_FUNCTIONS.find(f => f.id === functionId);
    if (!fn) return { score: 0, compliant: 0, total: 0 };
    const controls        = fn.categories.flatMap(c => c.controls);
    const profileControls = controls.filter(c => c[state.aescsfProfile.toLowerCase()]);
    const assessed        = profileControls.map(c => state.assessments[c.id]).filter(Boolean);
    const compliant       = assessed.filter(a => a.status === 'COMPLIANT').length;
    const partial         = assessed.filter(a => a.status === 'PARTIALLY_COMPLIANT').length;
    const na              = assessed.filter(a => a.status === 'NOT_APPLICABLE').length;
    const applicable      = assessed.length - na;
    const score           = applicable > 0 ? Math.round(((compliant + partial * 0.5) / applicable) * 100) : 0;
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
    const partial   = inScopeControls.filter(c => state.assessments[c.id]?.status === 'PARTIALLY_COMPLIANT').length;
    const score     = inScopeControls.length > 0
      ? Math.round(((compliant + partial * 0.5) / inScopeControls.length) * 100) : 0;
    return { score, compliant, partial, total: inScopeControls.length };
  }

  function getE8StrategyScore(strategyId) {
    const strategy = E8_STRATEGIES.find(s => s.id === strategyId);
    if (!strategy) return { score: 0, compliant: 0, total: 0, achievedMaturity: 'ML0' };
    const ML_ORDER    = ['ML1', 'ML2', 'ML3'];
    const targetIndex = ML_ORDER.indexOf(state.e8TargetMaturity);
    const inScope     = strategy.controls.filter(c => ML_ORDER.indexOf(c.maturity) <= targetIndex);
    const compliant   = inScope.filter(c => state.assessments[c.id]?.status === 'COMPLIANT').length;
    const partial     = inScope.filter(c => state.assessments[c.id]?.status === 'PARTIALLY_COMPLIANT').length;
    const na          = inScope.filter(c => state.assessments[c.id]?.status === 'NOT_APPLICABLE').length;
    const applicable  = inScope.length - na;
    const score       = applicable > 0 ? Math.round(((compliant + partial * 0.5) / applicable) * 100) : 0;
    const achievedMaturity = computeAchievedMaturity(strategy, state.assessments);
    return { score, compliant, partial, total: inScope.length, applicable, achievedMaturity };
  }

  function getOverallScore() {
    return Math.round(
      (getFrameworkScore('AESCSF').score + getFrameworkScore('SOCI').score +
       getFrameworkScore('ASD_FORTIFY').score + getFrameworkScore('ESSENTIAL_EIGHT').score) / 4
    );
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
      const ML_ORDER    = ['ML1', 'ML2', 'ML3'];
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
      isSyncing,
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
