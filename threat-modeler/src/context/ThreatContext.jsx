import { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { sampleData } from '../data/sampleData';
import { useAuth } from './AuthContext';
import { useOrg } from './OrgContext';
import { db } from '../firebase';

const ThreatContext = createContext(null);

// ── Constants ──────────────────────────────────────────────────────────────

export const STRIDE_CATEGORIES = {
  S: { name: 'Spoofing',               description: 'Pretending to be something or someone else',    color: '#8b5cf6' },
  T: { name: 'Tampering',              description: 'Modifying data or code',                         color: '#f59e0b' },
  R: { name: 'Repudiation',            description: 'Claiming to have not performed an action',       color: '#6366f1' },
  I: { name: 'Information Disclosure', description: 'Exposing information to unauthorized users',     color: '#ef4444' },
  D: { name: 'Denial of Service',      description: 'Denying or degrading service to users',          color: '#ec4899' },
  E: { name: 'Elevation of Privilege', description: 'Gaining capabilities without authorization',     color: '#14b8a6' },
};

export const RISK_LEVELS = {
  CRITICAL: { label: 'Critical', value: 5, color: '#991b1b', bgColor: '#fee2e2' },
  HIGH:     { label: 'High',     value: 4, color: '#c2410c', bgColor: '#ffedd5' },
  MEDIUM:   { label: 'Medium',   value: 3, color: '#a16207', bgColor: '#fef3c7' },
  LOW:      { label: 'Low',      value: 2, color: '#15803d', bgColor: '#dcfce7' },
  MINIMAL:  { label: 'Minimal',  value: 1, color: '#0369a1', bgColor: '#e0f2fe' },
};

export const CONTROL_STATUS = {
  NOT_STARTED: { label: 'Not Started', color: '#6b7280' },
  IN_PROGRESS: { label: 'In Progress', color: '#f59e0b' },
  IMPLEMENTED: { label: 'Implemented', color: '#22c55e' },
  VERIFIED:    { label: 'Verified',    color: '#3b82f6' },
};

// ── Action types ───────────────────────────────────────────────────────────

const ACTIONS = {
  SET_LOADING:                'SET_LOADING',
  LOAD_DATA:                  'LOAD_DATA',
  MERGE_TEAM_DATA:            'MERGE_TEAM_DATA',
  SET_CURRENT_PROJECT:        'SET_CURRENT_PROJECT',
  ADD_PROJECT:                'ADD_PROJECT',
  ADD_PROJECT_WITH_ID:        'ADD_PROJECT_WITH_ID',
  UPDATE_PROJECT:             'UPDATE_PROJECT',
  DELETE_PROJECT:             'DELETE_PROJECT',
  ADD_THREAT:                 'ADD_THREAT',
  UPDATE_THREAT:              'UPDATE_THREAT',
  DELETE_THREAT:              'DELETE_THREAT',
  ADD_CONTROL:                'ADD_CONTROL',
  UPDATE_CONTROL:             'UPDATE_CONTROL',
  DELETE_CONTROL:             'DELETE_CONTROL',
  ADD_ASSET:                  'ADD_ASSET',
  UPDATE_ASSET:               'UPDATE_ASSET',
  DELETE_ASSET:               'DELETE_ASSET',
  ADD_DATA_FLOW:              'ADD_DATA_FLOW',
  UPDATE_DATA_FLOW:           'UPDATE_DATA_FLOW',
  DELETE_DATA_FLOW:           'DELETE_DATA_FLOW',
  ADD_FLOW_PATTERN:           'ADD_FLOW_PATTERN',
  UPDATE_FLOW_PATTERN:        'UPDATE_FLOW_PATTERN',
  DELETE_FLOW_PATTERN:        'DELETE_FLOW_PATTERN',
  LINK_CONTROL_TO_THREAT:     'LINK_CONTROL_TO_THREAT',
  UNLINK_CONTROL_FROM_THREAT: 'UNLINK_CONTROL_FROM_THREAT',
  IMPORT_AI_RESULTS:          'IMPORT_AI_RESULTS',
};

// ── Initial state ──────────────────────────────────────────────────────────

const initialState = {
  projects:       [],
  currentProject: null,
  threats:        [],
  controls:       [],
  assets:         [],
  dataFlows:      [],
  flowPatterns:   [],
  isLoading:      true,
};

// ── Reducer ────────────────────────────────────────────────────────────────

function threatReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case ACTIONS.LOAD_DATA:
      return { ...state, ...action.payload, isLoading: false };

    case ACTIONS.MERGE_TEAM_DATA: {
      const { teamData, shareProjects, shareControls } = action.payload;
      return {
        ...state,
        ...(shareProjects ? {
          projects:  teamData.projects  || [],
          threats:   teamData.threats   || [],
          controls:  teamData.controls  || [],
          assets:    teamData.assets    || [],
          dataFlows: teamData.dataFlows || [],
        } : {}),
        ...(shareControls ? {
          customControlTemplates: teamData.customControlTemplates || [],
        } : {}),
      };
    }

    case ACTIONS.SET_CURRENT_PROJECT:
      return { ...state, currentProject: action.payload };

    case ACTIONS.ADD_PROJECT:
      return {
        ...state,
        projects: [...state.projects, { ...action.payload, id: uuidv4(), createdAt: new Date().toISOString() }],
      };

    case ACTIONS.ADD_PROJECT_WITH_ID:
      return {
        ...state,
        projects: [...state.projects, { ...action.payload, createdAt: new Date().toISOString() }],
      };

    case ACTIONS.UPDATE_PROJECT:
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload, updatedAt: new Date().toISOString() } : p
        ),
        currentProject:
          state.currentProject?.id === action.payload.id
            ? { ...state.currentProject, ...action.payload }
            : state.currentProject,
      };

    case ACTIONS.DELETE_PROJECT:
      return {
        ...state,
        projects:       state.projects.filter(p => p.id !== action.payload),
        currentProject: state.currentProject?.id === action.payload ? null : state.currentProject,
        threats:        state.threats.filter(t => t.projectId !== action.payload),
        controls:       state.controls.filter(c => c.projectId !== action.payload),
        assets:         state.assets.filter(a => a.projectId !== action.payload),
        dataFlows:      state.dataFlows.filter(d => d.projectId !== action.payload),
      };

    case ACTIONS.ADD_THREAT:
      return {
        ...state,
        threats: [...state.threats, { ...action.payload, id: uuidv4(), createdAt: new Date().toISOString() }],
      };

    case ACTIONS.UPDATE_THREAT:
      return {
        ...state,
        threats: state.threats.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload, updatedAt: new Date().toISOString() } : t
        ),
      };

    case ACTIONS.DELETE_THREAT:
      return {
        ...state,
        threats:  state.threats.filter(t => t.id !== action.payload),
        controls: state.controls.map(c => ({
          ...c,
          linkedThreats: c.linkedThreats?.filter(tid => tid !== action.payload) || [],
        })),
      };

    case ACTIONS.ADD_CONTROL:
      return {
        ...state,
        controls: [...state.controls, { ...action.payload, id: uuidv4(), createdAt: new Date().toISOString() }],
      };

    case ACTIONS.UPDATE_CONTROL:
      return {
        ...state,
        controls: state.controls.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload, updatedAt: new Date().toISOString() } : c
        ),
      };

    case ACTIONS.DELETE_CONTROL:
      return { ...state, controls: state.controls.filter(c => c.id !== action.payload) };

    case ACTIONS.ADD_ASSET:
      return {
        ...state,
        assets: [...state.assets, { ...action.payload, id: uuidv4(), createdAt: new Date().toISOString() }],
      };

    case ACTIONS.UPDATE_ASSET:
      return {
        ...state,
        assets: state.assets.map(a =>
          a.id === action.payload.id ? { ...a, ...action.payload, updatedAt: new Date().toISOString() } : a
        ),
      };

    case ACTIONS.DELETE_ASSET:
      return { ...state, assets: state.assets.filter(a => a.id !== action.payload) };

    case ACTIONS.ADD_DATA_FLOW:
      return {
        ...state,
        dataFlows: [...state.dataFlows, { ...action.payload, id: uuidv4(), createdAt: new Date().toISOString() }],
      };

    case ACTIONS.UPDATE_DATA_FLOW:
      return {
        ...state,
        dataFlows: state.dataFlows.map(d =>
          d.id === action.payload.id ? { ...d, ...action.payload, updatedAt: new Date().toISOString() } : d
        ),
      };

    case ACTIONS.DELETE_DATA_FLOW:
      return { ...state, dataFlows: state.dataFlows.filter(d => d.id !== action.payload) };

    case ACTIONS.ADD_FLOW_PATTERN:
      return {
        ...state,
        flowPatterns: [...(state.flowPatterns || []), { ...action.payload, id: uuidv4(), createdAt: new Date().toISOString() }],
      };

    case ACTIONS.UPDATE_FLOW_PATTERN:
      return {
        ...state,
        flowPatterns: (state.flowPatterns || []).map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload, updatedAt: new Date().toISOString() } : p
        ),
      };

    case ACTIONS.DELETE_FLOW_PATTERN:
      return { ...state, flowPatterns: (state.flowPatterns || []).filter(p => p.id !== action.payload) };

    case ACTIONS.LINK_CONTROL_TO_THREAT:
      return {
        ...state,
        controls: state.controls.map(c =>
          c.id === action.payload.controlId
            ? { ...c, linkedThreats: [...(c.linkedThreats || []), action.payload.threatId] }
            : c
        ),
      };

    case ACTIONS.UNLINK_CONTROL_FROM_THREAT:
      return {
        ...state,
        controls: state.controls.map(c =>
          c.id === action.payload.controlId
            ? { ...c, linkedThreats: (c.linkedThreats || []).filter(tid => tid !== action.payload.threatId) }
            : c
        ),
      };

    case ACTIONS.IMPORT_AI_RESULTS: {
      // Replace existing entries for the same project to prevent duplicates on re-run
      const incomingProjectIds = new Set([
        ...action.payload.threats.map(t => t.projectId),
        ...action.payload.controls.map(c => c.projectId),
        ...action.payload.assets.map(a => a.projectId),
      ].filter(Boolean));
      return {
        ...state,
        threats:   [...state.threats.filter(t => !incomingProjectIds.has(t.projectId)),   ...action.payload.threats],
        controls:  [...state.controls.filter(c => !incomingProjectIds.has(c.projectId)),  ...action.payload.controls],
        assets:    [...state.assets.filter(a => !incomingProjectIds.has(a.projectId)),    ...action.payload.assets],
        dataFlows: [...state.dataFlows.filter(d => !incomingProjectIds.has(d.projectId)), ...action.payload.dataFlows],
      };
    }

    default:
      return state;
  }
}

// ── Doc-ref helpers ────────────────────────────────────────────────────────

function orgDocRef(orgId) {
  return doc(db, 'orgs', orgId, 'data', 'threatData');
}

// Migration fallback: read legacy user-scoped doc if org doc is empty
function legacyUserDocRef(uid) {
  return doc(db, 'users', uid, 'data', 'threatData');
}

// Firestore rejects `undefined` values; replace them with `null` recursively.
// Skip class instances (Firestore FieldValue sentinels, Dates, etc.).
function sanitizeForFirestore(value) {
  if (value === undefined) return null;
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sanitizeForFirestore);
  if (value.constructor !== Object) return value;
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, sanitizeForFirestore(v)])
  );
}

// ── Provider ───────────────────────────────────────────────────────────────

export function ThreatProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const { currentOrg, canWrite } = useOrg();

  const [state, dispatch] = useReducer(threatReducer, initialState);
  const [syncError, setSyncError] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const syncTimer      = useRef(null);
  const hasSynced      = useRef(false);
  const isRemoteUpdate = useRef(false);
  const lastOrgWrite   = useRef(0);

  // ── Real-time org data subscription ───────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      try {
        const saved = localStorage.getItem('threatModelingData');
        dispatch({ type: ACTIONS.LOAD_DATA, payload: saved ? JSON.parse(saved) : sampleData });
      } catch {
        dispatch({ type: ACTIONS.LOAD_DATA, payload: sampleData });
      }
      return;
    }

    if (!currentOrg?.id) return; // wait for OrgContext

    hasSynced.current = false;
    let migrationAttempted = false;

    const unsub = onSnapshot(
      orgDocRef(currentOrg.id),
      async (snap) => {
        // Skip echoes of our own writes (server confirmation of local write)
        if (hasSynced.current && Date.now() - lastOrgWrite.current < 2500) return;

        let baseData = null;

        if (snap.exists()) {
          const { _updatedAt, ...data } = snap.data();
          baseData = data;
        } else if (!migrationAttempted) {
          migrationAttempted = true;
          try {
            const legacySnap = await getDoc(legacyUserDocRef(user.id));
            if (legacySnap.exists()) {
              const { _updatedAt, ...legacyData } = legacySnap.data();
              baseData = legacyData;
              console.info('[ThreatContext] migrating from legacy user path to org path');
            }
          } catch { /* ignore */ }
        }

        if (!baseData) {
          try {
            const saved = localStorage.getItem('threatModelingData');
            baseData = saved ? JSON.parse(saved) : sampleData;
          } catch {
            baseData = sampleData;
          }
        }

        // Mark as remote update so the debounced write effect doesn't echo it back
        isRemoteUpdate.current = true;
        dispatch({ type: ACTIONS.LOAD_DATA, payload: baseData });
        hasSynced.current = true;
        setTimeout(() => { isRemoteUpdate.current = false; }, 100);
      },
      (err) => {
        console.warn('[ThreatContext] org snapshot error:', err.message);
        if (!hasSynced.current) {
          try {
            const saved = localStorage.getItem('threatModelingData');
            dispatch({ type: ACTIONS.LOAD_DATA, payload: saved ? JSON.parse(saved) : sampleData });
          } catch {
            dispatch({ type: ACTIONS.LOAD_DATA, payload: sampleData });
          }
          hasSynced.current = true;
        }
      }
    );

    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAuthenticated, currentOrg?.id]);

  // ── Debounced sync to Firestore ────────────────────────────────────────
  useEffect(() => {
    if (state.isLoading) return;

    const { isLoading, ...dataToSave } = state;
    try {
      localStorage.setItem('threatModelingData', JSON.stringify(dataToSave));
    } catch { /* ignore */ }

    if (!isAuthenticated || !user?.id || !hasSynced.current || !currentOrg?.id) {
      console.debug('[ThreatContext] sync skipped — isAuthenticated:', isAuthenticated, 'uid:', user?.id, 'hasSynced:', hasSynced.current, 'orgId:', currentOrg?.id);
      return;
    }
    if (isRemoteUpdate.current) return;

    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      setSyncStatus('syncing');
      const path = `orgs/${currentOrg.id}/data/threatData`;
      console.debug('[ThreatContext] writing to Firestore:', path);
      try {
        const { currentProject: _cp, ...firestorePayload } = dataToSave;
        lastOrgWrite.current = Date.now();
        await setDoc(
          orgDocRef(currentOrg.id),
          { ...sanitizeForFirestore(firestorePayload), _updatedAt: serverTimestamp() },
          { merge: false }
        );
        console.debug('[ThreatContext] Firestore write success:', path);
        setSyncError(null);
        setSyncStatus('synced');
      } catch (err) {
        console.error('[ThreatContext] Firestore write FAILED:', err.code, err.message);
        const msg = err.code === 'permission-denied'
          ? 'Firestore rules not deployed — run: firebase deploy --only firestore:rules --project metis-ai-1551'
          : err.message;
        setSyncError(msg);
        setSyncStatus('error');
      }

    }, 1500);

    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isAuthenticated, user?.id, currentOrg?.id]);

  // ── Exposed actions ────────────────────────────────────────────────────

  function requireWrite() {
    if (!canWrite) throw new Error('You have read-only access to this organisation.');
  }

  const actions = {
    setCurrentProject: (project) => dispatch({ type: ACTIONS.SET_CURRENT_PROJECT, payload: project }),

    addProject:       (project) => { requireWrite(); dispatch({ type: ACTIONS.ADD_PROJECT,         payload: project }); },
    addProjectWithId: (project) => { requireWrite(); dispatch({ type: ACTIONS.ADD_PROJECT_WITH_ID, payload: project }); },
    updateProject:    (project) => { requireWrite(); dispatch({ type: ACTIONS.UPDATE_PROJECT,      payload: project }); },
    deleteProject:    (id)      => { requireWrite(); dispatch({ type: ACTIONS.DELETE_PROJECT,      payload: id });      },

    addThreat:    (threat)  => { requireWrite(); dispatch({ type: ACTIONS.ADD_THREAT,    payload: threat });  },
    updateThreat: (threat)  => { requireWrite(); dispatch({ type: ACTIONS.UPDATE_THREAT, payload: threat });  },
    deleteThreat: (id)      => { requireWrite(); dispatch({ type: ACTIONS.DELETE_THREAT, payload: id });      },

    addControl:    (control) => { requireWrite(); dispatch({ type: ACTIONS.ADD_CONTROL,    payload: control }); },
    updateControl: (control) => { requireWrite(); dispatch({ type: ACTIONS.UPDATE_CONTROL, payload: control }); },
    deleteControl: (id)      => { requireWrite(); dispatch({ type: ACTIONS.DELETE_CONTROL, payload: id });      },

    addAsset:    (asset) => { requireWrite(); dispatch({ type: ACTIONS.ADD_ASSET,    payload: asset }); },
    updateAsset: (asset) => { requireWrite(); dispatch({ type: ACTIONS.UPDATE_ASSET, payload: asset }); },
    deleteAsset: (id)    => { requireWrite(); dispatch({ type: ACTIONS.DELETE_ASSET, payload: id });    },

    addDataFlow:    (dataFlow) => { requireWrite(); dispatch({ type: ACTIONS.ADD_DATA_FLOW,    payload: dataFlow }); },
    updateDataFlow: (dataFlow) => { requireWrite(); dispatch({ type: ACTIONS.UPDATE_DATA_FLOW, payload: dataFlow }); },
    deleteDataFlow: (id)       => { requireWrite(); dispatch({ type: ACTIONS.DELETE_DATA_FLOW, payload: id });       },

    addFlowPattern:    (pattern) => { requireWrite(); dispatch({ type: ACTIONS.ADD_FLOW_PATTERN,    payload: pattern }); },
    updateFlowPattern: (pattern) => { requireWrite(); dispatch({ type: ACTIONS.UPDATE_FLOW_PATTERN, payload: pattern }); },
    deleteFlowPattern: (id)      => { requireWrite(); dispatch({ type: ACTIONS.DELETE_FLOW_PATTERN, payload: id });      },

    linkControlToThreat: (controlId, threatId) => {
      requireWrite();
      dispatch({ type: ACTIONS.LINK_CONTROL_TO_THREAT, payload: { controlId, threatId } });
    },
    unlinkControlFromThreat: (controlId, threatId) => {
      requireWrite();
      dispatch({ type: ACTIONS.UNLINK_CONTROL_FROM_THREAT, payload: { controlId, threatId } });
    },

    importAIResults: (results) => {
      requireWrite();
      dispatch({
        type: ACTIONS.IMPORT_AI_RESULTS,
        payload: {
          threats:   results.threats   || [],
          controls:  results.controls  || [],
          assets:    results.assets    || [],
          dataFlows: results.dataFlows || [],
        },
      });
    },

    resetToSampleData: () => {
      requireWrite();
      localStorage.removeItem('threatModelingData');
      dispatch({ type: ACTIONS.LOAD_DATA, payload: sampleData });
    },
  };

  // ── Selectors ──────────────────────────────────────────────────────────

  const selectors = {
    getProjectThreats:   (projectId) => state.threats.filter(t => t.projectId === projectId),
    getProjectControls:  (projectId) => state.controls.filter(c => c.projectId === projectId),
    getProjectAssets:    (projectId) => state.assets.filter(a => a.projectId === projectId),
    getProjectDataFlows: (projectId) => state.dataFlows.filter(d => d.projectId === projectId),

    getThreatControls: (threatId)  => state.controls.filter(c => c.linkedThreats?.includes(threatId)),
    getControlThreats: (controlId) => {
      const control = state.controls.find(c => c.id === controlId);
      return state.threats.filter(t => control?.linkedThreats?.includes(t.id));
    },

    getThreatsByCategory: (projectId) => {
      const projectThreats = state.threats.filter(t => t.projectId === projectId);
      return Object.keys(STRIDE_CATEGORIES).reduce((acc, key) => {
        acc[key] = projectThreats.filter(t => t.strideCategory === key);
        return acc;
      }, {});
    },

    getRiskStats: (projectId) => {
      const t = state.threats.filter(t => t.projectId === projectId);
      return {
        critical: t.filter(x => x.riskLevel === 'CRITICAL').length,
        high:     t.filter(x => x.riskLevel === 'HIGH').length,
        medium:   t.filter(x => x.riskLevel === 'MEDIUM').length,
        low:      t.filter(x => x.riskLevel === 'LOW').length,
        minimal:  t.filter(x => x.riskLevel === 'MINIMAL').length,
        total:    t.length,
      };
    },

    getControlStats: (projectId) => {
      const c = state.controls.filter(c => c.projectId === projectId);
      return {
        notStarted:  c.filter(x => x.status === 'NOT_STARTED').length,
        inProgress:  c.filter(x => x.status === 'IN_PROGRESS').length,
        implemented: c.filter(x => x.status === 'IMPLEMENTED').length,
        verified:    c.filter(x => x.status === 'VERIFIED').length,
        total:       c.length,
      };
    },

    getMitigationProgress: (projectId) => {
      const projectThreats = state.threats.filter(t => t.projectId === projectId);
      if (projectThreats.length === 0) return 0;
      const mitigated = projectThreats.filter(threat => {
        const tControls = state.controls.filter(c => c.linkedThreats?.includes(threat.id));
        return tControls.some(c => c.status === 'IMPLEMENTED' || c.status === 'VERIFIED');
      });
      return Math.round((mitigated.length / projectThreats.length) * 100);
    },

    isThreatMitigated: (threatId) => {
      const customControls = state.controls.filter(
        (c) => !c.aiGenerated && c.linkedThreats?.includes(threatId)
      );
      return customControls.some((c) => c.status === 'IMPLEMENTED' || c.status === 'VERIFIED');
    },

    calculateRiskScore: (likelihood, impact) => likelihood * impact,

    getRiskColor: (score) => {
      if (score >= 20) return '#991b1b';
      if (score >= 15) return '#c2410c';
      if (score >= 10) return '#f59e0b';
      if (score >= 5)  return '#a3e635';
      return '#22c55e';
    },
  };

  return (
    <ThreatContext.Provider value={{ state, syncError, syncStatus, canWrite, ...actions, ...selectors }}>
      {children}
    </ThreatContext.Provider>
  );
}

export function useThreatContext() {
  const context = useContext(ThreatContext);
  if (!context) throw new Error('useThreatContext must be used within a ThreatProvider');
  return context;
}
