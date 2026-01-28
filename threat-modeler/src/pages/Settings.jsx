import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2,
  RefreshCcw,
  Database,
  FileJson,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useThreatContext } from '../context/ThreatContext';

export default function Settings() {
  const { state, resetToSampleData } = useThreatContext();
  const [exportStatus, setExportStatus] = useState(null);
  const [importStatus, setImportStatus] = useState(null);

  const handleExport = () => {
    try {
      const { isLoading, ...dataToExport } = state;
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `threat-model-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportStatus({ type: 'success', message: 'Data exported successfully!' });
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      setExportStatus({ type: 'error', message: 'Failed to export data' });
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.projects && data.threats && data.controls) {
          localStorage.setItem('threatModelingData', JSON.stringify(data));
          setImportStatus({ type: 'success', message: 'Data imported successfully! Refreshing...' });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          throw new Error('Invalid data format');
        }
      } catch (error) {
        setImportStatus({ type: 'error', message: 'Invalid file format' });
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset to sample data? All your current data will be lost.')) {
      resetToSampleData();
      setExportStatus({ type: 'success', message: 'Data reset to sample data!' });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
      localStorage.removeItem('threatModelingData');
      setExportStatus({ type: 'success', message: 'All data cleared!' });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const stats = {
    projects: state.projects.length,
    threats: state.threats.length,
    controls: state.controls.length,
    assets: state.assets.length,
    dataFlows: state.dataFlows.length,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage application settings and data</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Data Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center gap-2 mb-6">
            <Database className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-900">Data Statistics</h2>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Projects', count: stats.projects, color: 'blue' },
              { label: 'Threats', count: stats.threats, color: 'red' },
              { label: 'Controls', count: stats.controls, color: 'green' },
              { label: 'Assets', count: stats.assets, color: 'purple' },
              { label: 'Data Flows', count: stats.dataFlows, color: 'orange' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-gray-600">{item.label}</span>
                <span className={`text-lg font-bold text-${item.color}-600`}>{item.count}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Total records: {Object.values(stats).reduce((a, b) => a + b, 0)}
            </p>
          </div>
        </motion.div>

        {/* Export/Import */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center gap-2 mb-6">
            <FileJson className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-900">Data Management</h2>
          </div>

          <div className="space-y-4">
            {/* Export */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Download className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Export Data</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Download all your threat modeling data as a JSON file
                  </p>
                  <button onClick={handleExport} className="btn-primary mt-3">
                    <Download className="w-4 h-4 mr-2" />
                    Export JSON
                  </button>
                </div>
              </div>
            </div>

            {/* Import */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Upload className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Import Data</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Load threat modeling data from a JSON file
                  </p>
                  <label className="btn-success mt-3 cursor-pointer inline-flex">
                    <Upload className="w-4 h-4 mr-2" />
                    Import JSON
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {(exportStatus || importStatus) && (
            <div
              className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                (exportStatus || importStatus)?.type === 'success'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {(exportStatus || importStatus)?.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
              <span className="text-sm">{(exportStatus || importStatus)?.message}</span>
            </div>
          )}
        </motion.div>

        {/* Reset Options */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card lg:col-span-2"
        >
          <div className="flex items-center gap-2 mb-6">
            <RefreshCcw className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-gray-900">Reset Options</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-orange-200 bg-orange-50 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <RefreshCcw className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Reset to Sample Data</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Replace all current data with the sample data set
                  </p>
                  <button onClick={handleReset} className="btn-warning mt-3">
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Reset to Sample
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border border-red-200 bg-red-50 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Clear All Data</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Permanently delete all data. This cannot be undone.
                  </p>
                  <button onClick={handleClearAll} className="btn-danger mt-3">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card lg:col-span-2"
        >
          <div className="flex items-center gap-2 mb-6">
            <Info className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-900">About ThreatModeler</h2>
          </div>

          <div className="prose prose-sm max-w-none text-gray-600">
            <p>
              ThreatModeler is a comprehensive threat modeling application designed to help security
              teams identify, analyze, and mitigate security threats in their systems and applications.
            </p>
            <h4 className="text-gray-900 mt-4">Key Features:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>STRIDE-based threat categorization</li>
              <li>Visual risk assessment matrix</li>
              <li>Control/mitigation tracking</li>
              <li>Data flow diagram visualization</li>
              <li>Project and asset management</li>
              <li>Export/import functionality</li>
            </ul>
            <h4 className="text-gray-900 mt-4">Methodology:</h4>
            <p>
              This tool implements the STRIDE threat modeling methodology, which categorizes threats
              into six categories: Spoofing, Tampering, Repudiation, Information Disclosure, Denial
              of Service, and Elevation of Privilege.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
