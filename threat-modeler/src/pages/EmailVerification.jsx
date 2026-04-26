import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function EmailVerification() {
  const { user, logout, resendVerification, checkEmailVerified } = useAuth();

  const [resendStatus, setResendStatus] = useState(''); // '' | 'sent' | 'error'
  const [checking, setChecking]         = useState(false);
  const [verified, setVerified]         = useState(false);

  async function handleResend() {
    setResendStatus('');
    try {
      await resendVerification();
      setResendStatus('sent');
    } catch {
      setResendStatus('error');
    }
  }

  async function handleCheck() {
    setChecking(true);
    try {
      const ok = await checkEmailVerified();
      if (ok) {
        setVerified(true);
        // AuthContext has already updated user.emailVerified → App re-renders automatically
      } else {
        setResendStatus('not-yet');
      }
    } finally {
      setChecking(false);
    }
  }

  if (verified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center"
      >
        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Mail className="w-7 h-7 text-blue-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h1>
        <p className="text-gray-500 text-sm mb-1">
          We sent a verification link to
        </p>
        <p className="font-semibold text-gray-800 text-sm mb-6">{user?.email}</p>

        <p className="text-xs text-gray-400 mb-6">
          Click the link in the email, then come back and press <strong>I've verified</strong>.
          Check your spam folder if you don't see it.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleCheck}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            {checking
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <RefreshCw className="w-4 h-4" />
            }
            I've verified — refresh
          </button>

          <button
            onClick={handleResend}
            className="w-full py-2.5 border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 font-medium text-sm rounded-xl transition-colors"
          >
            Resend verification email
          </button>
        </div>

        {resendStatus === 'sent' && (
          <p className="mt-4 text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">
            Verification email sent. Check your inbox.
          </p>
        )}
        {resendStatus === 'error' && (
          <p className="mt-4 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
            Failed to resend. Wait a moment and try again.
          </p>
        )}
        {resendStatus === 'not-yet' && (
          <p className="mt-4 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            Email not verified yet. Click the link in your inbox first.
          </p>
        )}

        <button
          onClick={logout}
          className="mt-6 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors mx-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </motion.div>
    </div>
  );
}
