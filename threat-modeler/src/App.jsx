import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThreatProvider } from './context/ThreatContext';
import { ComplianceProvider } from './context/ComplianceContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrgProvider, useOrg } from './context/OrgContext';
import InteractivityMonitor from './components/InteractivityMonitor';
import Layout from './components/Layout';
import Login from './pages/Login';
import OrgOnboarding from './pages/OrgOnboarding';
import EmailVerification from './pages/EmailVerification';
import OrgSettings from './pages/OrgSettings';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import NewProject from './pages/NewProject';
import Threats from './pages/Threats';
import Controls from './pages/Controls';
import RiskMatrix from './pages/RiskMatrix';
import DataFlows from './pages/DataFlows';
import Settings from './pages/Settings';
import ExecutiveView from './pages/ExecutiveView';
import DiagramPage from './pages/Diagram';
import AdvancedAnalysis from './pages/AdvancedAnalysis';
import ComplianceDashboard from './pages/compliance/ComplianceDashboard';
import AESCSFPage from './pages/compliance/AESCSFPage';
import SOCIPage from './pages/compliance/SOCIPage';
import ASDFortifyPage from './pages/compliance/ASDFortifyPage';
import EssentialEightPage from './pages/compliance/EssentialEightPage';
import GapAnalysis from './pages/compliance/GapAnalysis';
import ComplianceReport from './pages/compliance/ComplianceReport';
import './index.css';

/** Shows email verification screen if the user hasn't verified their email yet. */
function EmailVerificationGate({ children }) {
  const { user } = useAuth();
  if (user && !user.emailVerified) return <EmailVerification />;
  return children;
}

/** Redirects to /login if not authenticated. */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/**
 * Shows OrgOnboarding when the user is authenticated but has no org yet.
 * OrgContext loading state is handled with a spinner.
 */
function OrgGate({ children }) {
  const { currentOrg, isLoading } = useOrg();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return children;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentOrg) {
    return <OrgOnboarding />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<Login />} />

      {/* All other routes require authentication + an org */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <EmailVerificationGate>
            <OrgGate>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/executive" element={<ExecutiveView />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/new" element={<NewProject />} />
                  <Route path="/projects/:projectId" element={<ProjectDetail />} />
                  <Route path="/diagram" element={<DiagramPage />} />
                  <Route path="/advanced" element={<AdvancedAnalysis />} />
                  <Route path="/threats" element={<Threats />} />
                  <Route path="/threats/:threatId" element={<Threats />} />
                  <Route path="/controls" element={<Controls />} />
                  <Route path="/risk-matrix" element={<RiskMatrix />} />
                  <Route path="/data-flows" element={<DataFlows />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/team" element={<Navigate to="/org" replace />} />
                  <Route path="/org" element={<OrgSettings />} />
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
            </OrgGate>
            </EmailVerificationGate>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <OrgProvider>
          <ThreatProvider>
            <ComplianceProvider>
              <BrowserRouter>
                <AppRoutes />
                <InteractivityMonitor />
              </BrowserRouter>
            </ComplianceProvider>
          </ThreatProvider>
      </OrgProvider>
    </AuthProvider>
  );
}

export default App;
