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
  ClipboardCheck,
  FileText,
  Zap,
  AlertCircle,
  PrinterCheck,
  LayoutGrid,
  LayoutTemplate,
  PenTool,
  Building2,
  UserCircle,
  LogOut,
  WifiOff,
  Sparkles,
} from 'lucide-react';
import { useThreatContext } from '../context/ThreatContext';
import { useAuth } from '../context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Executive View', href: '/executive', icon: Building2 },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Diagram', href: '/diagram', icon: PenTool },
  { name: 'Advanced Analysis', href: '/advanced', icon: Sparkles },
  { name: 'Threats', href: '/threats', icon: AlertTriangle },
  { name: 'Controls', href: '/controls', icon: Shield },
  { name: 'Risk Matrix', href: '/risk-matrix', icon: BarChart3 },
  { name: 'Data Flows', href: '/data-flows', icon: Network },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const complianceNavigation = [
  { name: 'Compliance Overview', href: '/compliance', icon: ClipboardCheck },
  { name: 'AESCSF', href: '/compliance/aescsf', icon: Shield },
  { name: 'SOCI Act', href: '/compliance/soci', icon: FileText },
  { name: 'ASD Fortify', href: '/compliance/asd-fortify', icon: Zap },
  { name: 'Essential Eight', href: '/compliance/essential-eight', icon: LayoutGrid },
  { name: 'Gap Analysis', href: '/compliance/gap-analysis', icon: AlertCircle },
  { name: 'Report', href: '/compliance/report', icon: PrinterCheck },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { state } = useThreatContext();
  const { user, logout, isOffline } = useAuth();

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
                  <h1 className="text-lg font-bold text-gray-900">Metis</h1>
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

            {/* Compliance section divider */}
            {sidebarOpen && (
              <div className="pt-3 pb-1">
                <div className="flex items-center gap-2 px-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Compliance</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              </div>
            )}
            {!sidebarOpen && <div className="my-2 mx-2 h-px bg-gray-200" />}

            {complianceNavigation.map((item) => {
              const active = isActive(item.href);
              const isOverview = item.href === '/compliance';
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative ${
                    active
                      ? isOverview ? 'bg-emerald-50 text-emerald-700' : 'bg-teal-50 text-teal-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      active
                        ? isOverview ? 'text-emerald-600' : 'text-teal-600'
                        : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  />
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-medium text-sm"
                    >
                      {item.name}
                    </motion.span>
                  )}
                  {active && (
                    <motion.div
                      className={`absolute right-2 w-1.5 h-1.5 rounded-full ${isOverview ? 'bg-emerald-600' : 'bg-teal-600'}`}
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

          {/* User info + logout */}
          <div className="p-4 border-t border-gray-100">
            {sidebarOpen ? (
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <UserCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{user?.username}</p>
                  {isOffline && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <WifiOff className="w-3 h-3 text-amber-500" />
                      <span className="text-xs text-amber-600">Offline</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 mb-3 relative group">
                <button
                  onClick={logout}
                  className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 hover:bg-red-100 hover:text-red-500 transition-colors"
                >
                  <UserCircle className="w-5 h-5" />
                </button>
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {user?.username} · Sign out
                </div>
                {isOffline && (
                  <WifiOff className="w-3 h-3 text-amber-500" />
                )}
              </div>
            )}

            {/* Collapse toggle */}
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
