import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThreatProvider } from './context/ThreatContext';
import { ComplianceProvider } from './context/ComplianceContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TeamProvider } from './context/TeamContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ThreatModelingWorkspace from './pages/ThreatModelingWorkspace';
import Threats from './pages/Threats';
import Controls from './pages/Controls';
import RiskMatrix from './pages/RiskMatrix';
import DataFlows from './pages/DataFlows';
import Settings from './pages/Settings';
import ComplianceDashboard from './pages/compliance/ComplianceDashboard';
import AESCSFPage from './pages/compliance/AESCSFPage';
import SOCIPage from './pages/compliance/SOCIPage';
import ASDFortifyPage from './pages/compliance/ASDFortifyPage';
import EssentialEightPage from './pages/compliance/EssentialEightPage';
import GapAnalysis from './pages/compliance/GapAnalysis';
import ComplianceReport from './pages/compliance/ComplianceReport';
import { useThreatContext } from './context/ThreatContext';
import './index.css';

/** Redirects /workspace to the current project's workspace, or project list. */
function WorkspaceRedirect() {
  const { state } = useThreatContext();
  const projectId = state.currentProject?.id || state.projects[0]?.id;
  if (projectId) return <Navigate to={`/projects/${projectId}/workspace`} replace />;
  return <Navigate to="/projects" replace />;
}

/** Redirects to /login if the user is not authenticated. */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    // Show a minimal loading screen while validating the stored token
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<Login />} />

      {/* All other routes require authentication */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:projectId" element={<ProjectDetail />} />
                <Route path="/projects/:projectId/workspace" element={<ThreatModelingWorkspace />} />
                <Route path="/workspace" element={<WorkspaceRedirect />} />
                <Route path="/threats" element={<Threats />} />
                <Route path="/threats/:threatId" element={<Threats />} />
                <Route path="/controls" element={<Controls />} />
                <Route path="/risk-matrix" element={<RiskMatrix />} />
                <Route path="/data-flows" element={<DataFlows />} />
                <Route path="/settings" element={<Settings />} />
                {/* Compliance Tracker */}
                <Route path="/compliance" element={<ComplianceDashboard />} />
                <Route path="/compliance/aescsf" element={<AESCSFPage />} />
                <Route path="/compliance/soci" element={<SOCIPage />} />
                <Route path="/compliance/asd-fortify" element={<ASDFortifyPage />} />
                <Route path="/compliance/essential-eight" element={<EssentialEightPage />} />
                <Route path="/compliance/gap-analysis" element={<GapAnalysis />} />
                <Route path="/compliance/report" element={<ComplianceReport />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <TeamProvider>
        <ThreatProvider>
          <ComplianceProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ComplianceProvider>
        </ThreatProvider>
      </TeamProvider>
    </AuthProvider>
  );
}

export default App;
