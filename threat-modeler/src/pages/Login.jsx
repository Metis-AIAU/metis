import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, Users, User, UserPlus, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function friendlyError(err) {
  const code = err?.code || '';
  if (code === 'auth/invalid-email')            return 'Please enter a valid email address.';
  if (code === 'auth/user-not-found')            return 'No account found with that email.';
  if (code === 'auth/wrong-password')            return 'Incorrect password. Please try again.';
  if (code === 'auth/invalid-credential')        return 'Invalid email or password.';
  if (code === 'auth/email-already-in-use')      return 'An account with this email already exists.';
  if (code === 'auth/weak-password')             return 'Password must be at least 6 characters.';
  if (code === 'auth/too-many-requests')         return 'Too many attempts. Please wait a moment.';
  if (code === 'auth/network-request-failed')    return 'Network error — check your connection.';
  return err.message || 'Something went wrong. Please try again.';
}

// ── Animated network background ─────────────────────────────────────────────
const NODES = [
  { x: 12, y: 18, r: 2.5, delay: 0 },
  { x: 88, y: 12, r: 3,   delay: 1.2 },
  { x: 75, y: 78, r: 2,   delay: 0.6 },
  { x: 22, y: 82, r: 3.5, delay: 1.8 },
  { x: 50, y: 50, r: 4,   delay: 0.3 },
  { x: 35, y: 35, r: 2,   delay: 2.1 },
  { x: 65, y: 28, r: 2.5, delay: 0.9 },
  { x: 18, y: 55, r: 2,   delay: 1.5 },
  { x: 82, y: 55, r: 3,   delay: 0.4 },
  { x: 48, y: 88, r: 2,   delay: 1.1 },
  { x: 8,  y: 40, r: 1.5, delay: 2.4 },
  { x: 92, y: 72, r: 2,   delay: 0.7 },
];

const EDGES = [
  [0, 4], [1, 4], [2, 4], [3, 4], [5, 4],
  [6, 4], [7, 4], [8, 4], [9, 4],
  [0, 7], [1, 6], [2, 8], [3, 9],
  [5, 0], [6, 1], [10, 7], [11, 8],
];

function NetworkBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Deep gradient base */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 80% at 50% -10%, rgba(14,165,233,0.12) 0%, transparent 60%), linear-gradient(180deg, #050812 0%, #07091c 50%, #060a1a 100%)'
      }} />

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'linear-gradient(rgba(34,211,238,1) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Network SVG */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="0.4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {EDGES.map(([a, b], i) => (
          <motion.line
            key={i}
            x1={NODES[a].x} y1={NODES[a].y}
            x2={NODES[b].x} y2={NODES[b].y}
            stroke="rgba(34,211,238,0.18)"
            strokeWidth="0.15"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 0.4, 0.4, 0] }}
            transition={{
              duration: 6,
              delay: i * 0.35,
              repeat: Infinity,
              repeatDelay: 2,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Nodes */}
        {NODES.map((node, i) => (
          <motion.circle
            key={i}
            cx={node.x} cy={node.y} r={node.r}
            fill="rgba(34,211,238,0.6)"
            filter="url(#glow)"
            animate={{
              opacity: [0.3, 0.8, 0.3],
              r: [node.r * 0.9, node.r * 1.15, node.r * 0.9],
            }}
            transition={{
              duration: 3 + node.delay,
              delay: node.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </svg>

      {/* Scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.2), transparent)' }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// ── Login form ──────────────────────────────────────────────────────────────
export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState('individual');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === 'register';

  function toggleMode() {
    setMode(m => (m === 'login' ? 'register' : 'login'));
    setError('');
    setPassword('');
    setConfirmPassword('');
    setAccountType('individual');
    setInviteCode('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (isRegister) {
        if (accountType === 'join-team') {
          if (!inviteCode.trim()) { setError('Paste your invite code to join a team.'); setIsSubmitting(false); return; }
          sessionStorage.setItem('pending_invite', inviteCode.trim());
        }
        await register(email.trim(), password, displayName.trim(), accountType);
        navigate('/');
      } else {
        await login(email.trim(), password);
        navigate('/');
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.65rem 1rem',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#f1f5f9',
    fontFamily: 'var(--font-body)',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const focusStyle = {
    borderColor: 'rgba(34,211,238,0.5)',
    boxShadow: '0 0 0 3px rgba(34,211,238,0.1)',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: '0.4rem',
    fontFamily: 'var(--font-mono)',
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4"
      style={{ background: '#07091c' }}>
      <NetworkBackground />

      {/* Brand mark — top left */}
      <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', boxShadow: '0 0 16px rgba(14,165,233,0.4)' }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-4.5 h-4.5 text-white" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-none"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>METIS</p>
          <p className="text-[9px] font-medium tracking-[0.18em] mt-0.5"
            style={{ color: '#22d3ee', fontFamily: 'var(--font-mono)' }}>OT SECURITY</p>
        </div>
      </div>

      {/* Framework badges — bottom */}
      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4 z-10">
        {['AESCSF', 'SOCI', 'ASD FORTIFY', 'ESSENTIAL EIGHT'].map(f => (
          <span key={f} className="text-[9px] font-semibold tracking-widest"
            style={{ color: 'rgba(100,116,139,0.6)', fontFamily: 'var(--font-mono)' }}>
            {f}
          </span>
        ))}
      </div>

      {/* Auth card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        <div style={{
          background: 'rgba(10,14,35,0.9)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '2rem',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,211,238,0.05)',
        }}>

          {/* Heading */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-1"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.04em' }}>
              {isRegister ? 'Create Account' : 'Welcome back'}
            </h2>
            <p className="text-xs" style={{ color: '#475569', fontFamily: 'var(--font-mono)' }}>
              {isRegister ? 'Start securing your infrastructure' : 'Sign in to your workspace'}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-xl p-0.5 mb-6"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {['login', 'register'].map(m => (
              <button key={m} type="button" onClick={() => { setMode(m); setError(''); }}
                className="flex-1 py-2 rounded-[10px] text-xs font-semibold transition-all"
                style={mode === m
                  ? { background: 'rgba(255,255,255,0.08)', color: '#f1f5f9', fontFamily: 'var(--font-body)' }
                  : { color: '#475569', fontFamily: 'var(--font-body)' }}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required autoFocus autoComplete="email"
                style={inputStyle}
                onFocus={e => Object.assign(e.target.style, focusStyle)}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Display name — register only */}
            <AnimatePresence>
              {isRegister && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <label style={labelStyle}>Display Name</label>
                  <input
                    type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                    placeholder="Your name" autoComplete="name"
                    style={inputStyle}
                    onFocus={e => Object.assign(e.target.style, focusStyle)}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Password */}
            <div>
              <label style={labelStyle}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={isRegister ? 'At least 6 characters' : '••••••••'}
                  required autoComplete={isRegister ? 'new-password' : 'current-password'}
                  style={{ ...inputStyle, paddingRight: '2.75rem' }}
                  onFocus={e => Object.assign(e.target.style, { ...focusStyle, paddingRight: '2.75rem' })}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#475569' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#475569'}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password — register only */}
            <AnimatePresence>
              {isRegister && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <label style={labelStyle}>Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'} value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password" required={isRegister} autoComplete="new-password"
                    style={inputStyle}
                    onFocus={e => Object.assign(e.target.style, focusStyle)}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Account type — register only */}
            <AnimatePresence>
              {isRegister && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <label style={labelStyle}>Account Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 'individual', label: 'Individual', sub: 'Personal workspace', Icon: User,     color: '#22d3ee' },
                      { val: 'team',       label: 'Create Team', sub: 'New shared workspace', Icon: Users,    color: '#a78bfa' },
                      { val: 'join-team',  label: 'Join Team',   sub: 'Use invite code',    Icon: UserPlus, color: '#34d399' },
                    ].map(({ val, label, sub, Icon, color }) => (
                      <button key={val} type="button" onClick={() => setAccountType(val)}
                        className="flex flex-col items-start p-3 rounded-xl transition-all text-left"
                        style={accountType === val
                          ? { border: `1px solid ${color}40`, background: `${color}0d` }
                          : { border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                        <Icon className="w-4 h-4 mb-1.5" style={{ color: accountType === val ? color : '#475569' }} />
                        <p className="text-xs font-semibold"
                          style={{ color: accountType === val ? color : '#94a3b8', fontFamily: 'var(--font-display)' }}>
                          {label}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: '#475569', fontFamily: 'var(--font-mono)' }}>{sub}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Invite code — join-team only */}
            <AnimatePresence>
              {isRegister && accountType === 'join-team' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <label style={labelStyle}>Invite Code</label>
                  <input
                    type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value)}
                    placeholder="Paste invite code from team admin"
                    style={inputStyle}
                    onFocus={e => Object.assign(e.target.style, focusStyle)}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5 p-3 rounded-xl text-xs"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span style={{ fontFamily: 'var(--font-body)' }}>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit" disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                color: '#ffffff',
                fontFamily: 'var(--font-body)',
                boxShadow: '0 4px 20px rgba(14,165,233,0.3)',
              }}>
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
              ) : (
                <>
                  {isRegister ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Toggle */}
          <p className="text-center text-xs mt-5" style={{ color: '#475569', fontFamily: 'var(--font-body)' }}>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" onClick={toggleMode}
              className="font-semibold transition-colors"
              style={{ color: '#22d3ee' }}
              onMouseEnter={e => e.currentTarget.style.color = '#67e8f9'}
              onMouseLeave={e => e.currentTarget.style.color = '#22d3ee'}>
              {isRegister ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
