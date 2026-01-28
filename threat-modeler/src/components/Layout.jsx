import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  AlertTriangle,
  Shield,
  Network,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useThreatContext } from '../context/ThreatContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Threats', href: '/threats', icon: AlertTriangle },
  { name: 'Controls', href: '/controls', icon: Shield },
  { name: 'Risk Matrix', href: '/risk-matrix', icon: BarChart3 },
  { name: 'Data Flows', href: '/data-flows', icon: Network },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { state } = useThreatContext();

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        <motion.aside
          initial={{ width: sidebarOpen ? 280 : 80 }}
          animate={{ width: sidebarOpen ? 280 : 80 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-40 flex flex-col"
        >
          {/* Logo */}
          <div className="h-16 flex items-center px-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-lg font-bold text-gray-900">ThreatModeler</h1>
                  <p className="text-xs text-gray-500">Security Analysis</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                    active
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  />
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-medium"
                    >
                      {item.name}
                    </motion.span>
                  )}
                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute right-2 w-1.5 h-1.5 rounded-full bg-blue-600"
                    />
                  )}
                  {!sidebarOpen && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Current Project Indicator */}
          {state.currentProject && sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border-t border-gray-100"
            >
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Active Project</p>
                <p className="font-medium text-gray-900 truncate">{state.currentProject.name}</p>
                <Link
                  to={`/projects/${state.currentProject.id}`}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2"
                >
                  View details <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          )}

          {/* Toggle Button */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
            >
              {sidebarOpen ? (
                <>
                  <X className="w-4 h-4" />
                  <span className="text-sm">Collapse</span>
                </>
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </motion.aside>
      </AnimatePresence>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-[280px]' : 'ml-[80px]'
        }`}
      >
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  );
}
