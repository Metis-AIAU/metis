import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThreatProvider } from './context/ThreatContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Threats from './pages/Threats';
import Controls from './pages/Controls';
import RiskMatrix from './pages/RiskMatrix';
import DataFlows from './pages/DataFlows';
import Settings from './pages/Settings';
import './index.css';

function App() {
  return (
    <ThreatProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:projectId" element={<ProjectDetail />} />
            <Route path="/threats" element={<Threats />} />
            <Route path="/threats/:threatId" element={<Threats />} />
            <Route path="/controls" element={<Controls />} />
            <Route path="/risk-matrix" element={<RiskMatrix />} />
            <Route path="/data-flows" element={<DataFlows />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThreatProvider>
  );
}

export default App;
