import { useState } from 'react';
import { Sparkles, Send, Loader2, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { fetchWithAuth } from '../services/fetchWithAuth';

const FRAMEWORK_LABELS = {
  AESCSF:         'AESCSF',
  ESSENTIAL_EIGHT: 'Essential Eight',
  SOCI:           'SOCI Act',
  ASD_FORTIFY:    'ASD Fortify',
};

const FRAMEWORK_COLORS = {
  AESCSF:         '#3b82f6',
  ESSENTIAL_EIGHT: '#f97316',
  SOCI:           '#8b5cf6',
  ASD_FORTIFY:    '#10b981',
};

// ── Inline control citation chip ─────────────────────────────────────────────
function ControlChip({ control }) {
  const [open, setOpen] = useState(false);
  const color = FRAMEWORK_COLORS[control.framework] || '#6b7280';
  return (
    <div className="border rounded-lg overflow-hidden text-xs" style={{ borderColor: color + '40' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-gray-50"
      >
        <span className="flex items-center gap-2">
          <span className="font-mono font-bold" style={{ color }}>{control.controlId}</span>
          <span className="text-gray-500">{FRAMEWORK_LABELS[control.framework] || control.framework}</span>
        </span>
        {open ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
      </button>
      {open && (
        <div className="px-3 pb-3 text-gray-600 text-xs leading-relaxed border-t border-gray-100 pt-2 whitespace-pre-line">
          {control.text}
        </div>
      )}
    </div>
  );
}

// ── Main ask panel ────────────────────────────────────────────────────────────
export default function ComplianceAI({ framework, organisationContext, placeholder, className = '' }) {
  const [query,    setQuery]    = useState('');
  const [answer,   setAnswer]   = useState(null);
  const [controls, setControls] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  async function ask() {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    setControls([]);
    try {
      const r = await fetchWithAuth('/api/compliance/ask', {
        method: 'POST',
        body: JSON.stringify({ query, framework, organisationContext }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `Server error ${r.status}`);
      setAnswer(data.answer);
      setControls(data.relevantControls || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Compliance AI Assistant</p>
          <p className="text-xs text-gray-500">Powered by RAG — answers grounded in framework documentation</p>
        </div>
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask()}
          placeholder={placeholder || 'Ask about any compliance control, gap, or implementation guidance…'}
          className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        />
        <button
          onClick={ask}
          disabled={loading || !query.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-50 hover:bg-indigo-700 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Ask
        </button>
      </div>

      {/* Suggested questions */}
      {!answer && !loading && (
        <div className="flex flex-wrap gap-2 mt-3">
          {(framework
            ? SUGGESTED[framework] || SUGGESTED.ALL
            : SUGGESTED.ALL
          ).map(q => (
            <button
              key={q}
              onClick={() => { setQuery(q); }}
              className="text-xs px-2.5 py-1 rounded-full border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Answer */}
      {answer && (
        <div className="mt-4 space-y-4">
          <div className="bg-white rounded-xl border border-indigo-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Answer</span>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{answer}</p>
          </div>

          {controls.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {controls.length} relevant control{controls.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-1.5">
                {controls.map(c => <ControlChip key={c.controlId} control={c} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Per-control inline guidance button ───────────────────────────────────────
export function ControlGuidanceButton({ controlId, organisationContext }) {
  const [open,    setOpen]    = useState(false);
  const [answer,  setAnswer]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  async function loadGuidance() {
    if (answer || loading) { setOpen(o => !o); return; }
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const r = await fetchWithAuth('/api/compliance/guidance', {
        method: 'POST',
        body: JSON.stringify({ controlId, organisationContext }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `Server error ${r.status}`);
      setAnswer(data.answer);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={loadGuidance}
        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
      >
        <Sparkles className="w-3 h-3" />
        AI Guidance
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {open && (
        <div className="mt-2 p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-xs">
          {loading && (
            <div className="flex items-center gap-2 text-indigo-600">
              <Loader2 className="w-3 h-3 animate-spin" /> Fetching guidance…
            </div>
          )}
          {error  && <p className="text-red-600">{error}</p>}
          {answer && <p className="text-gray-800 leading-relaxed whitespace-pre-line">{answer}</p>}
        </div>
      )}
    </div>
  );
}

// ── Suggested questions per framework ─────────────────────────────────────────
const SUGGESTED = {
  ALL: [
    'What are the highest priority gaps to address first?',
    'What evidence is needed for Essential Eight ML2?',
    'How do AESCSF and Essential Eight controls overlap?',
  ],
  AESCSF: [
    'What OT-specific controls should I prioritise?',
    'How do I demonstrate compliance with ID.AM-7?',
    'What does SP2 require beyond SP1?',
  ],
  ESSENTIAL_EIGHT: [
    'What does ML2 require for patch management?',
    'How do I implement application control on OT workstations?',
    'What evidence proves ML3 for multi-factor authentication?',
  ],
  SOCI: [
    'What are mandatory SOCI registration obligations?',
    'What incident reporting timeframes apply?',
    'How does SOCI apply to cloud infrastructure?',
  ],
  ASD_FORTIFY: [
    'Which ASD Fortify controls apply to OT/ICS environments?',
    'How does ASD Fortify extend Essential Eight?',
    'What does ML2 require for network segmentation?',
  ],
};
