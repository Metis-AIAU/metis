import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  PenTool,
  Building2,
  UserCircle,
  LogOut,
  WifiOff,
  Sparkles,
  Users,
} from 'lucide-react';
import { useThreatContext } from '../context/ThreatContext';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';

const navigation = [
  { name: 'Dashboard',         href: '/',         icon: LayoutDashboard },
  { name: 'Executive View',    href: '/executive', icon: Building2 },
  { name: 'Projects',          href: '/projects',  icon: FolderKanban },
  { name: 'Diagram',           href: '/diagram',   icon: PenTool },
  { name: 'Advanced Analysis', href: '/advanced',  icon: Sparkles },
  { name: 'Threats',           href: '/threats',   icon: AlertTriangle },
  { name: 'Controls',          href: '/controls',  icon: Shield },
  { name: 'Risk Matrix',       href: '/risk-matrix', icon: BarChart3 },
  { name: 'Data Flows',        href: '/data-flows',  icon: Network },
  { name: 'Team',              href: '/team',      icon: Users },
  { name: 'Settings',          href: '/settings',  icon: Settings },
];

const complianceNavigation = [
  { name: 'Overview',        href: '/compliance',                    icon: ClipboardCheck },
  { name: 'AESCSF',          href: '/compliance/aescsf',             icon: Shield },
  { name: 'SOCI Act',        href: '/compliance/soci',               icon: FileText },
  { name: 'ASD Fortify',     href: '/compliance/asd-fortify',        icon: Zap },
  { name: 'Essential Eight', href: '/compliance/essential-eight',     icon: LayoutGrid },
  { name: 'Gap Analysis',    href: '/compliance/gap-analysis',        icon: AlertCircle },
  { name: 'Report',          href: '/compliance/report',             icon: PrinterCheck },
];

// Hex grid SVG pattern for sidebar background depth
function HexPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.025] pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="hexgrid" x="0" y="0" width="28" height="32" patternUnits="userSpaceOnUse">
          <polygon
            points="14,2 26,9 26,23 14,30 2,23 2,9"
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hexgrid)" />
    </svg>
  );
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { state } = useThreatContext();
  const { user, logout, isOffline } = useAuth();
  const { team } = useTeam();

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const NavItem = ({ item, isCompliance = false }) => {
    const active = isActive(item.href);
    const accentColor = isCompliance ? '#34d399' : '#22d3ee';
    const activeBg = isCompliance ? 'rgba(52,211,153,0.08)' : 'rgba(34,211,238,0.08)';

    return (
      <Link
        to={item.href}
        style={active ? {
          borderLeft: `2px solid ${accentColor}`,
          background: activeBg,
          color: accentColor,
        } : {
          borderLeft: '2px solid transparent',
        }}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-r-xl transition-all duration-150 group relative
          ${active ? '' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'}`}
      >
        <item.icon
          className="w-4 h-4 flex-shrink-0 transition-colors"
          style={active ? { color: accentColor } : {}}
        />
        {sidebarOpen && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-sm font-medium truncate ${active ? '' : ''}`}
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {item.name}
          </motion.span>
        )}
        {/* Tooltip when collapsed */}
        {!sidebarOpen && (
          <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)' }}>
            {item.name}
          </div>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: sidebarOpen ? 256 : 64 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="fixed left-0 top-0 h-screen z-40 flex flex-col overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #07091c 0%, #080b22 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <HexPattern />

        {/* Logo */}
        <div className="relative z-10 h-16 flex items-center px-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 min-w-0">
            {/* Shield icon with glow */}
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', boxShadow: '0 0 20px rgba(14,165,233,0.35)' }}>
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
            </div>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="min-w-0"
              >
                <h1 className="text-base font-bold text-white leading-none tracking-tight"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>
                  METIS
                </h1>
                <p className="text-[10px] font-medium tracking-widest mt-0.5"
                  style={{ color: '#22d3ee', fontFamily: 'var(--font-mono)', letterSpacing: '0.15em' }}>
                  OT SECURITY
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="relative z-10 flex-1 py-4 px-2 space-y-0.5 overflow-y-auto scrollbar-dark">
          {navigation.map(item => (
            <NavItem key={item.name} item={item} />
          ))}

          {/* Compliance divider */}
          <div className="py-3 px-2">
            {sidebarOpen ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <span className="text-[9px] font-bold tracking-[0.2em] uppercase"
                  style={{ color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                  Compliance
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>
            ) : (
              <div className="h-px mx-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
            )}
          </div>

          {complianceNavigation.map(item => (
            <NavItem key={item.name} item={item} isCompliance />
          ))}
        </nav>

        {/* Active project chip */}
        {state.currentProject && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 mx-3 mb-3"
          >
            <Link
              to={`/projects/${state.currentProject.id}`}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl group"
              style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22d3ee' }} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold tracking-widest uppercase mb-0.5"
                  style={{ color: '#64748b', fontFamily: 'var(--font-mono)' }}>Active Project</p>
                <p className="text-xs font-medium text-slate-200 truncate">{state.currentProject.name}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#22d3ee' }} />
            </Link>
          </motion.div>
        )}

        {/* User + collapse */}
        <div className="relative z-10 p-3 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5 mb-2.5 px-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.3), rgba(99,102,241,0.3))', border: '1px solid rgba(255,255,255,0.1)' }}>
                <UserCircle className="w-4.5 h-4.5 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-100 truncate leading-none"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                  {user?.username}
                </p>
                {team ? (
                  <p className="text-[10px] mt-0.5 truncate font-medium" style={{ color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                    {team.name}
                  </p>
                ) : user?.accountType === 'team' ? (
                  <p className="text-[10px] mt-0.5 text-slate-500" style={{ fontFamily: 'var(--font-mono)' }}>No team</p>
                ) : (
                  <p className="text-[10px] mt-0.5 text-slate-500" style={{ fontFamily: 'var(--font-mono)' }}>Individual</p>
                )}
                {isOffline && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <WifiOff className="w-3 h-3" style={{ color: '#f59e0b' }} />
                    <span className="text-[10px] font-medium" style={{ color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>OFFLINE</span>
                  </div>
                )}
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: '#475569' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent'; }}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 mb-2 group relative">
              <button
                onClick={logout}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#64748b' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              >
                <UserCircle className="w-4 h-4" />
              </button>
              <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)' }}>
                {user?.username} · Sign out
              </div>
              {isOffline && <WifiOff className="w-3 h-3" style={{ color: '#f59e0b' }} />}
            </div>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ color: '#334155', background: 'rgba(255,255,255,0.04)', fontFamily: 'var(--font-mono)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94a3b8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#334155'; }}
          >
            {sidebarOpen ? (
              <><X className="w-3.5 h-3.5" /> <span>Collapse</span></>
            ) : (
              <Menu className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </motion.aside>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main
        className="flex-1 transition-all duration-300 min-h-screen"
        style={{ marginLeft: sidebarOpen ? 256 : 64 }}
      >
        {children}
      </main>
    </div>
  );
}
