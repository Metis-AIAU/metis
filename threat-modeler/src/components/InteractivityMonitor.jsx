/**
 * InteractivityMonitor (Dev-only overlay)
 *
 * Renders a floating HUD in bottom-right corner showing:
 *  - Live count of interactivity issues found
 *  - List of each issue with type/severity/element
 *  - "Fix All" button to auto-apply all safe fixes
 *  - Last scan timestamp
 *
 * Only renders in import.meta.env.DEV. In production it returns null.
 */

import { useState } from 'react';
import useInteractivityMonitor, { autoFixAll } from '../hooks/useInteractivityMonitor';

const SEVERITY_STYLES = {
  error: { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444', label: 'ERROR' },
  warn:  { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b', label: 'WARN'  },
  info:  { bg: '#eff6ff', text: '#1e40af', dot: '#3b82f6', label: 'INFO'  },
};

export default function InteractivityMonitor() {
  if (!import.meta.env.DEV) return null;

  return <MonitorUI />;
}

function MonitorUI() {
  const { issues, lastScan, fixCount, runScan } = useInteractivityMonitor({
    intervalMs: 3000,
    autoFix: true,
  });
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(null);

  const errors = issues.filter(i => i.severity === 'error');
  const warns  = issues.filter(i => i.severity === 'warn');
  const fixable = issues.filter(i => i.fixable);

  const badgeColor = errors.length > 0 ? '#dc2626'
    : warns.length  > 0 ? '#d97706'
    : '#16a34a';

  function handleFixAll() {
    autoFixAll(fixable);
    setTimeout(runScan, 100);
  }

  function handleHighlight(issue) {
    // Scroll the element into view and flash it
    try {
      issue.el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlight(issue.id);
      issue.el?.setAttribute('data-monitor-highlight', 'true');
      setTimeout(() => {
        issue.el?.removeAttribute('data-monitor-highlight');
        setHighlight(null);
      }, 2000);
    } catch {}
  }

  return (
    <>
      {/* Flash highlight style */}
      <style>{`
        [data-monitor-highlight="true"] {
          outline: 3px solid #ef4444 !important;
          outline-offset: 2px !important;
          animation: monitor-pulse 0.5s ease-in-out 3 !important;
        }
        @keyframes monitor-pulse {
          0%, 100% { outline-color: #ef4444; }
          50%       { outline-color: #fbbf24; }
        }
      `}</style>

      {/* Floating badge */}
      <div
        data-interactivity-monitor
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          zIndex: 99999,
          fontFamily: 'monospace',
          fontSize: '12px',
          userSelect: 'none',
        }}
      >
        {/* Collapsed badge */}
        {!open && (
          <button
            onClick={() => setOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: badgeColor,
              color: '#fff',
              border: 'none',
              borderRadius: '999px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              fontFamily: 'monospace',
              fontSize: '11px',
              fontWeight: 'bold',
            }}
          >
            <span style={{ fontSize: '14px' }}>🔍</span>
            <span>
              {issues.length === 0
                ? 'All OK'
                : `${errors.length} err · ${warns.length} warn`}
            </span>
            {fixCount > 0 && (
              <span style={{ opacity: 0.8 }}>· {fixCount} fixed</span>
            )}
          </button>
        )}

        {/* Expanded panel */}
        {open && (
          <div style={{
            width: '380px',
            maxHeight: '500px',
            backgroundColor: '#1e1e1e',
            color: '#e5e7eb',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{
              padding: '10px 14px',
              backgroundColor: '#111',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #333',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🔍</span>
                <span style={{ fontWeight: 'bold', color: '#fff' }}>
                  Interactivity Monitor
                </span>
                <span style={{
                  padding: '1px 7px',
                  backgroundColor: badgeColor,
                  borderRadius: '999px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#fff',
                }}>
                  {issues.length} issue{issues.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {fixable.length > 0 && (
                  <button onClick={handleFixAll} style={{
                    padding: '3px 10px',
                    backgroundColor: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}>
                    Fix All ({fixable.length})
                  </button>
                )}
                <button onClick={runScan} style={{
                  padding: '3px 8px',
                  backgroundColor: '#374151',
                  color: '#9ca3af',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}>
                  ↻
                </button>
                <button onClick={() => setOpen(false)} style={{
                  padding: '3px 8px',
                  backgroundColor: '#374151',
                  color: '#9ca3af',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}>
                  ✕
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div style={{
              display: 'flex',
              gap: '1px',
              backgroundColor: '#333',
              borderBottom: '1px solid #333',
            }}>
              {[
                { label: 'Errors',  value: errors.length,  color: '#ef4444' },
                { label: 'Warnings', value: warns.length,   color: '#f59e0b' },
                { label: 'Fixed',   value: fixCount,        color: '#22c55e' },
              ].map(s => (
                <div key={s.label} style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#1a1a1a',
                  textAlign: 'center',
                }}>
                  <div style={{ color: s.color, fontWeight: 'bold', fontSize: '16px' }}>
                    {s.value}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '10px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Issue list */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {issues.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#22c55e' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>✓</div>
                  <div>All interactive elements are responsive</div>
                  <div style={{ color: '#6b7280', fontSize: '10px', marginTop: '4px' }}>
                    {lastScan ? `Last scan: ${lastScan.toLocaleTimeString()}` : 'Scanning…'}
                  </div>
                </div>
              ) : (
                issues.map((issue, i) => {
                  const sev = SEVERITY_STYLES[issue.severity] || SEVERITY_STYLES.info;
                  const isHighlighted = highlight === issue.id;
                  return (
                    <div
                      key={`${issue.id}-${i}`}
                      onClick={() => handleHighlight(issue)}
                      style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid #2a2a2a',
                        cursor: 'pointer',
                        backgroundColor: isHighlighted ? '#2a2a2a' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{
                          flexShrink: 0,
                          padding: '1px 5px',
                          backgroundColor: sev.bg,
                          color: sev.text,
                          borderRadius: '4px',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          marginTop: '1px',
                        }}>
                          {sev.label}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#e5e7eb', fontSize: '11px', lineHeight: 1.4 }}>
                            {issue.message}
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '3px',
                          }}>
                            <span style={{
                              color: '#6b7280',
                              fontSize: '10px',
                              fontFamily: 'monospace',
                            }}>
                              {issue.type}
                            </span>
                            {issue.fixable && (
                              <button
                                onClick={(e) => { e.stopPropagation(); issue.fix?.(); setTimeout(runScan, 100); }}
                                style={{
                                  padding: '1px 6px',
                                  backgroundColor: '#166534',
                                  color: '#86efac',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '10px',
                                }}
                              >
                                Auto-fix
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '6px 12px',
              backgroundColor: '#111',
              borderTop: '1px solid #333',
              color: '#4b5563',
              fontSize: '10px',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span>Scans every 3s · click issue to highlight element</span>
              <span>{lastScan ? lastScan.toLocaleTimeString() : '—'}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
