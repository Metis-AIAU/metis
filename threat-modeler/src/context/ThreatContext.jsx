import { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { sampleData } from '../data/sampleData';

const ThreatContext = createContext(null);

// STRIDE Categories
export const STRIDE_CATEGORIES = {
  S: { name: 'Spoofing', description: 'Pretending to be something or someone else', color: '#8b5cf6' },
  T: { name: 'Tampering', description: 'Modifying data or code', color: '#f59e0b' },
  R: { name: 'Repudiation', description: 'Claiming to have not performed an action', color: '#6366f1' },
  I: { name: 'Information Disclosure', description: 'Exposing information to unauthorized users', color: '#ef4444' },
  D: { name: 'Denial of Service', description: 'Denying or degrading service to users', color: '#ec4899' },
  E: { name: 'Elevation of Privilege', description: 'Gaining capabilities without authorization', color: '#14b8a6' },
};

// Risk levels
export const RISK_LEVELS = {
  CRITICAL: { label: 'Critical', value: 5, color: '#991b1b', bgColor: '#fee2e2' },
  HIGH: { label: 'High', value: 4, color: '#c2410c', bgColor: '#ffedd5' },
  MEDIUM: { label: 'Medium', value: 3, color: '#a16207', bgColor: '#fef3c7' },
  LOW: { label: 'Low', value: 2, color: '#15803d', bgColor: '#dcfce7' },
  MINIMAL: { label: 'Minimal', value: 1, color: '#0369a1', bgColor: '#e0f2fe' },
};

// Control statuses
export const CONTROL_STATUS = {
  NOT_STARTED: { label: 'Not Started', color: '#6b7280' },
  IN_PROGRESS: { label: 'In Progress', color: '#f59e0b' },
  IMPLEMENTED: { label: 'Implemented', color: '#22c55e' },
  VERIFIED: { label: 'Verified', color: '#3b82f6' },
};

// Initial state
const initialState = {
  projects: [],
  currentProject: null,
  threats: [],
  controls: [],
  assets: [],
  dataFlows: [],
  isLoading: true,
};

// Action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOAD_DATA: 'LOAD_DATA',
  SET_CURRENT_PROJECT: 'SET_CURRENT_PROJECT',
  ADD_PROJECT: 'ADD_PROJECT',
  ADD_PROJECT_WITH_ID: 'ADD_PROJECT_WITH_ID',
  UPDATE_PROJECT: 'UPDATE_PROJECT',
  DELETE_PROJECT: 'DELETE_PROJECT',
  ADD_THREAT: 'ADD_THREAT',
  UPDATE_THREAT: 'UPDATE_THREAT',
  DELETE_THREAT: 'DELETE_THREAT',
  ADD_CONTROL: 'ADD_CONTROL',
  UPDATE_CONTROL: 'UPDATE_CONTROL',
  DELETE_CONTROL: 'DELETE_CONTROL',
  ADD_ASSET: 'ADD_ASSET',
  UPDATE_ASSET: 'UPDATE_ASSET',
  DELETE_ASSET: 'DELETE_ASSET',
  ADD_DATA_FLOW: 'ADD_DATA_FLOW',
  UPDATE_DATA_FLOW: 'UPDATE_DATA_FLOW',
  DELETE_DATA_FLOW: 'DELETE_DATA_FLOW',
  LINK_CONTROL_TO_THREAT: 'LINK_CONTROL_TO_THREAT',
  UNLINK_CONTROL_FROM_THREAT: 'UNLINK_CONTROL_FROM_THREAT',
  IMPORT_AI_RESULTS: 'IMPORT_AI_RESULTS',
};

// Reducer
function threatReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case ACTIONS.LOAD_DATA:
      return {
        ...state,
        ...action.payload,
        isLoading: false,
      };

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
        projects: state.projects.map((p) =>
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
        projects: state.projects.filter((p) => p.id !== action.payload),
        currentProject: state.currentProject?.id === action.payload ? null : state.currentProject,
        threats: state.threats.filter((t) => t.projectId !== action.payload),
        controls: state.controls.filter((c) => c.projectId !== action.payload),
        assets: state.assets.filter((a) => a.projectId !== action.payload),
        dataFlows: state.dataFlows.filter((d) => d.projectId !== action.payload),
      };

    case ACTIONS.ADD_THREAT:
      return {
        ...state,
        threats: [...state.threats, { ...action.payload, id: uuidv4(), createdAt: new Date().toISOString() }],
      };

    case ACTIONS.UPDATE_THREAT:
      return {
        ...state,
        threats: state.threats.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload, updatedAt: new Date().toISOString() } : t
        ),
      };

    case ACTIONS.DELETE_THREAT:
      return {
        ...state,
        threats: state.threats.filter((t) => t.id !== action.payload),
        controls: state.controls.map((c) => ({
          ...c,
          linkedThreats: c.linkedThreats?.filter((tid) => tid !== action.payload) || [],
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
        controls: state.controls.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload, updatedAt: new Date().toISOString() } : c
        ),
      };

    case ACTIONS.DELETE_CONTROL:
      return {
        ...state,
        controls: state.controls.filter((c) => c.id !== action.payload),
      };

    case ACTIONS.ADD_ASSET:
      return {
        ...state,
        assets: [...state.assets, { ...action.payload, id: uuidv4(), createdAt: new Date().toISOString() }],
      };

    case ACTIONS.UPDATE_ASSET:
      return {
        ...state,
        assets: state.assets.map((a) =>
          a.id === action.payload.id ? { ...a, ...action.payload, updatedAt: new Date().toISOString() } : a
        ),
      };

    case ACTIONS.DELETE_ASSET:
      return {
        ...state,
        assets: state.assets.filter((a) => a.id !== action.payload),
      };

    case ACTIONS.ADD_DATA_FLOW:
      return {
        ...state,
        dataFlows: [...state.dataFlows, { ...action.payload, id: uuidv4(), createdAt: new Date().toISOString() }],
      };

    case ACTIONS.UPDATE_DATA_FLOW:
      return {
        ...state,
        dataFlows: state.dataFlows.map((d) =>
          d.id === action.payload.id ? { ...d, ...action.payload, updatedAt: new Date().toISOString() } : d
        ),
      };

    case ACTIONS.DELETE_DATA_FLOW:
      return {
        ...state,
        dataFlows: state.dataFlows.filter((d) => d.id !== action.payload),
      };

    case ACTIONS.LINK_CONTROL_TO_THREAT:
      return {
        ...state,
        controls: state.controls.map((c) =>
          c.id === action.payload.controlId
            ? { ...c, linkedThreats: [...(c.linkedThreats || []), action.payload.threatId] }
            : c
        ),
      };

    case ACTIONS.UNLINK_CONTROL_FROM_THREAT:
      return {
        ...state,
        controls: state.controls.map((c) =>
          c.id === action.payload.controlId
            ? { ...c, linkedThreats: (c.linkedThreats || []).filter((tid) => tid !== action.payload.threatId) }
            : c
        ),
      };

    case ACTIONS.IMPORT_AI_RESULTS:
      return {
        ...state,
        threats: [...state.threats, ...action.payload.threats],
        controls: [...state.controls, ...action.payload.controls],
        assets: [...state.assets, ...action.payload.assets],
        dataFlows: [...state.dataFlows, ...action.payload.dataFlows],
      };

    default:
      return state;
  }
}

// Provider component
export function ThreatProvider({ children }) {
  const [state, dispatch] = useReducer(threatReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      try {
        const savedData = localStorage.getItem('threatModelingData');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          dispatch({ type: ACTIONS.LOAD_DATA, payload: parsed });
        } else {
          // Load sample data for demo
          dispatch({ type: ACTIONS.LOAD_DATA, payload: sampleData });
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        dispatch({ type: ACTIONS.LOAD_DATA, payload: sampleData });
      }
    };
    loadData();
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (!state.isLoading) {
      const { isLoading, ...dataToSave } = state;
      localStorage.setItem('threatModelingData', JSON.stringify(dataToSave));
    }
  }, [state]);

  // Actions
  const actions = {
    setCurrentProject: (project) => dispatch({ type: ACTIONS.SET_CURRENT_PROJECT, payload: project }),

    addProject: (project) => dispatch({ type: ACTIONS.ADD_PROJECT, payload: project }),
    addProjectWithId: (project) => dispatch({ type: ACTIONS.ADD_PROJECT_WITH_ID, payload: project }),
    updateProject: (project) => dispatch({ type: ACTIONS.UPDATE_PROJECT, payload: project }),
    deleteProject: (id) => dispatch({ type: ACTIONS.DELETE_PROJECT, payload: id }),

    addThreat: (threat) => dispatch({ type: ACTIONS.ADD_THREAT, payload: threat }),
    updateThreat: (threat) => dispatch({ type: ACTIONS.UPDATE_THREAT, payload: threat }),
    deleteThreat: (id) => dispatch({ type: ACTIONS.DELETE_THREAT, payload: id }),

    addControl: (control) => dispatch({ type: ACTIONS.ADD_CONTROL, payload: control }),
    updateControl: (control) => dispatch({ type: ACTIONS.UPDATE_CONTROL, payload: control }),
    deleteControl: (id) => dispatch({ type: ACTIONS.DELETE_CONTROL, payload: id }),

    addAsset: (asset) => dispatch({ type: ACTIONS.ADD_ASSET, payload: asset }),
    updateAsset: (asset) => dispatch({ type: ACTIONS.UPDATE_ASSET, payload: asset }),
    deleteAsset: (id) => dispatch({ type: ACTIONS.DELETE_ASSET, payload: id }),

    addDataFlow: (dataFlow) => dispatch({ type: ACTIONS.ADD_DATA_FLOW, payload: dataFlow }),
    updateDataFlow: (dataFlow) => dispatch({ type: ACTIONS.UPDATE_DATA_FLOW, payload: dataFlow }),
    deleteDataFlow: (id) => dispatch({ type: ACTIONS.DELETE_DATA_FLOW, payload: id }),

    linkControlToThreat: (controlId, threatId) =>
      dispatch({ type: ACTIONS.LINK_CONTROL_TO_THREAT, payload: { controlId, threatId } }),
    unlinkControlFromThreat: (controlId, threatId) =>
      dispatch({ type: ACTIONS.UNLINK_CONTROL_FROM_THREAT, payload: { controlId, threatId } }),

    importAIResults: (results) =>
      dispatch({
        type: ACTIONS.IMPORT_AI_RESULTS,
        payload: {
          threats: results.threats || [],
          controls: results.controls || [],
          assets: results.assets || [],
          dataFlows: results.dataFlows || [],
        },
      }),

    resetToSampleData: () => {
      localStorage.removeItem('threatModelingData');
      dispatch({ type: ACTIONS.LOAD_DATA, payload: sampleData });
    },
  };

  // Computed values / selectors
  const selectors = {
    getProjectThreats: (projectId) => state.threats.filter((t) => t.projectId === projectId),
    getProjectControls: (projectId) => state.controls.filter((c) => c.projectId === projectId),
    getProjectAssets: (projectId) => state.assets.filter((a) => a.projectId === projectId),
    getProjectDataFlows: (projectId) => state.dataFlows.filter((d) => d.projectId === projectId),

    getThreatControls: (threatId) =>
      state.controls.filter((c) => c.linkedThreats?.includes(threatId)),

    getControlThreats: (controlId) => {
      const control = state.controls.find((c) => c.id === controlId);
      return state.threats.filter((t) => control?.linkedThreats?.includes(t.id));
    },

    getThreatsByCategory: (projectId) => {
      const projectThreats = state.threats.filter((t) => t.projectId === projectId);
      return Object.keys(STRIDE_CATEGORIES).reduce((acc, key) => {
        acc[key] = projectThreats.filter((t) => t.strideCategory === key);
        return acc;
      }, {});
    },

    getRiskStats: (projectId) => {
      const projectThreats = state.threats.filter((t) => t.projectId === projectId);
      return {
        critical: projectThreats.filter((t) => t.riskLevel === 'CRITICAL').length,
        high: projectThreats.filter((t) => t.riskLevel === 'HIGH').length,
        medium: projectThreats.filter((t) => t.riskLevel === 'MEDIUM').length,
        low: projectThreats.filter((t) => t.riskLevel === 'LOW').length,
        minimal: projectThreats.filter((t) => t.riskLevel === 'MINIMAL').length,
        total: projectThreats.length,
      };
    },

    getControlStats: (projectId) => {
      const projectControls = state.controls.filter((c) => c.projectId === projectId);
      return {
        notStarted: projectControls.filter((c) => c.status === 'NOT_STARTED').length,
        inProgress: projectControls.filter((c) => c.status === 'IN_PROGRESS').length,
        implemented: projectControls.filter((c) => c.status === 'IMPLEMENTED').length,
        verified: projectControls.filter((c) => c.status === 'VERIFIED').length,
        total: projectControls.length,
      };
    },

    getMitigationProgress: (projectId) => {
      const projectThreats = state.threats.filter((t) => t.projectId === projectId);
      if (projectThreats.length === 0) return 0;

      const mitigatedThreats = projectThreats.filter((threat) => {
        const threatControls = state.controls.filter((c) => c.linkedThreats?.includes(threat.id));
        return threatControls.some((c) => c.status === 'IMPLEMENTED' || c.status === 'VERIFIED');
      });

      return Math.round((mitigatedThreats.length / projectThreats.length) * 100);
    },

    calculateRiskScore: (likelihood, impact) => likelihood * impact,

    getRiskColor: (score) => {
      if (score >= 20) return '#991b1b';
      if (score >= 15) return '#c2410c';
      if (score >= 10) return '#f59e0b';
      if (score >= 5) return '#a3e635';
      return '#22c55e';
    },
  };

  return (
    <ThreatContext.Provider value={{ state, ...actions, ...selectors }}>
      {children}
    </ThreatContext.Provider>
  );
}

// Hook to use the context
export function useThreatContext() {
  const context = useContext(ThreatContext);
  if (!context) {
    throw new Error('useThreatContext must be used within a ThreatProvider');
  }
  return context;
}
