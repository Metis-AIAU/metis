import { useState } from 'react';
import { motion } from 'framer-motion';
import { useOrg } from '../context/OrgContext';
import { useAuth } from '../context/AuthContext';

const SECTORS = [
  'Energy', 'Water', 'Transport', 'Health', 'Communications',
  'Banking & Finance', 'Defence', 'Education', 'Government', 'Other',
];

/**
 * Shown after login when the user has no org yet.
 * Creates a personal or team org, then the app boots normally.
 */
export default function OrgOnboarding() {
  const { createOrg } = useOrg();
  const { logout } = useAuth();

  const [name, setName]       = useState('');
  const [sector, setSector]   = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Organisation name is required'); return; }
    setIsLoading(true);
    setError('');
    try {
      await createOrg({ name: name.trim(), sector });
      // OrgContext will update currentOrg via onSnapshot → app unmounts this screen
    } catch (err) {
      setError(err.message || 'Failed to create organisation');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        {/* Logo / brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your organisation</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Your workspace for threat modelling and compliance.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organisation name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Acme Corp"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sector <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              value={sector}
              onChange={e => setSector(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
            >
              <option value="">Select sector…</option>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            {isLoading ? 'Creating…' : 'Create organisation'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={logout}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </motion.div>
    </div>
  );
}
