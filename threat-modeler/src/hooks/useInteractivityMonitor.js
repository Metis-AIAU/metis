/**
 * useInteractivityMonitor
 *
 * Continuously scans all interactive elements in the DOM for responsiveness issues.
 * Detects: pointer-events blocked, zero-size, invisible overlays covering elements,
 * disabled states, off-viewport positioning, z-index stacking issues.
 * Auto-fixes CSS-based blockages where safe to do so.
 *
 * Only active in development mode (import.meta.env.DEV).
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Selector for anything a user should be able to click / interact with ──────
const INTERACTIVE_SELECTOR = [
  'button',
  'a[href]',
  '[role="button"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="checkbox"]',
  '[role="switch"]',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[onclick]',
  '[data-testid]',
].join(', ');

// Elements whose pointer-events:none is intentional (decoration / wrappers)
const INTENTIONALLY_INERT = new Set([
  'svg',
  'path',
  'circle',
  'rect',
  'line',
  'polyline',
  'polygon',
  'ellipse',
  'g',
  'defs',
  'clippath',
  'mask',
]);

function isInShadowOrHidden(el) {
  // Walk up and check display/visibility on ancestors
  let node = el;
  while (node && node !== document.body) {
    const cs = window.getComputedStyle(node);
    if (cs.display === 'none' || cs.visibility === 'hidden') return true;
    node = node.parentElement;
  }
  return false;
}

function isIntentionallyDisabled(el) {
  // Explicitly disabled elements are fine — they're supposed to be inert
  if (el.disabled) return true;
  if (el.getAttribute('aria-disabled') === 'true') return true;
  if (el.getAttribute('data-disabled') === 'true') return true;
  return false;
}

function isCoveredByOverlay(el) {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;

  // Sample multiple points across the element
  const cx = rect.left + rect.width  / 2;
  const cy = rect.top  + rect.height / 2;
  const points = [
    [cx, cy],
    [rect.left  + 4, rect.top    + 4],
    [rect.right - 4, rect.bottom - 4],
  ];

  let coveredCount = 0;
  for (const [px, py] of points) {
    const top = document.elementFromPoint(px, py);
    if (!top) continue;
    // If the topmost element is NOT the element itself or a descendant → covered
    if (top !== el && !el.contains(top)) {
      coveredCount++;
    }
  }
  return coveredCount >= 2; // must be covered at 2+ sample points
}

function computedPointerEvents(el) {
  return window.getComputedStyle(el).pointerEvents;
}

function computedOpacity(el) {
  return parseFloat(window.getComputedStyle(el).opacity);
}

// ── Core scan function ────────────────────────────────────────────────────────

export function scanInteractiveElements() {
  const issues = [];
  const fixes  = [];

  const elements = Array.from(document.querySelectorAll(INTERACTIVE_SELECTOR));

  for (const el of elements) {
    // Skip elements inside the monitor UI itself
    if (el.closest('[data-interactivity-monitor]')) continue;
    // Skip SVG internals
    if (INTENTIONALLY_INERT.has(el.tagName.toLowerCase())) continue;
    // Skip intentionally disabled
    if (isIntentionallyDisabled(el)) continue;
    // Skip elements not in the layout (display:none ancestors)
    if (isInShadowOrHidden(el)) continue;

    const rect = el.getBoundingClientRect();

    // ── Issue: zero-size element ────────────────────────────────────────────
    if (rect.width === 0 && rect.height === 0) {
      issues.push({
        el,
        id: elementId(el),
        type: 'zero-size',
        severity: 'warn',
        message: `${label(el)} has zero dimensions — may not be clickable`,
        fixable: false,
      });
      continue;
    }

    // ── Issue: pointer-events blocked ───────────────────────────────────────
    const pe = computedPointerEvents(el);
    if (pe === 'none') {
      const isInsideSVG = el.closest('svg') !== null;
      if (!isInsideSVG) {
        const issue = {
          el,
          id: elementId(el),
          type: 'pointer-events-none',
          severity: 'error',
          message: `${label(el)} has pointer-events:none — clicks will not register`,
          fixable: true,
          fix: () => {
            el.style.pointerEvents = 'auto';
            console.info(`[InteractivityMonitor] Fixed pointer-events on`, el);
          },
        };
        issues.push(issue);
        fixes.push(issue);
        continue;
      }
    }

    // ── Issue: near-zero opacity (invisible but still in layout) ───────────
    const opacity = computedOpacity(el);
    if (opacity < 0.05) {
      issues.push({
        el,
        id: elementId(el),
        type: 'invisible',
        severity: 'warn',
        message: `${label(el)} is effectively invisible (opacity ${opacity.toFixed(2)}) but still in the DOM`,
        fixable: false,
      });
      continue;
    }

    // ── Issue: covered by an overlay ────────────────────────────────────────
    if (isCoveredByOverlay(el)) {
      // Try to find the covering element
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const coveringEl = document.elementFromPoint(cx, cy);

      if (coveringEl && coveringEl !== el) {
        const coverCs = window.getComputedStyle(coveringEl);
        const coverPe = coverCs.pointerEvents;
        const coverBg = coverCs.backgroundColor;
        const isTransparentCover = coverBg === 'rgba(0, 0, 0, 0)' || coverBg === 'transparent';

        const issue = {
          el,
          id: elementId(el),
          type: 'covered',
          severity: isTransparentCover ? 'error' : 'warn',
          message: `${label(el)} is covered by <${coveringEl.tagName.toLowerCase()}${coveringEl.className ? ` class="${[...coveringEl.classList].slice(0,3).join(' ')}"` : ''}>${isTransparentCover ? ' (transparent overlay!)' : ''}`,
          fixable: isTransparentCover && coverPe !== 'none',
          fix: isTransparentCover ? () => {
            coveringEl.style.pointerEvents = 'none';
            console.info(`[InteractivityMonitor] Fixed transparent overlay`, coveringEl, '→ pointer-events:none');
          } : null,
          coveringEl,
        };
        issues.push(issue);
        if (issue.fixable) fixes.push(issue);
      }
    }
  }

  return { issues, fixes };
}

// ── Auto-fix all fixable issues ───────────────────────────────────────────────

export function autoFixAll(issues) {
  const fixed = [];
  for (const issue of issues) {
    if (issue.fixable && issue.fix) {
      try {
        issue.fix();
        fixed.push(issue);
      } catch (e) {
        console.warn('[InteractivityMonitor] Fix failed for', issue.el, e);
      }
    }
  }
  return fixed;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function label(el) {
  const tag  = el.tagName.toLowerCase();
  const text = (el.textContent || el.value || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().slice(0, 40);
  const id   = el.id ? `#${el.id}` : '';
  const cls  = el.className && typeof el.className === 'string'
    ? `.${[...el.classList].slice(0, 2).join('.')}`
    : '';
  return `<${tag}${id}${cls}>${text ? ` "${text}"` : ''}`;
}

function elementId(el) {
  // Stable key for React rendering
  return el.id || `${el.tagName}-${el.className}-${el.getBoundingClientRect().top.toFixed(0)}`;
}

// ── React hook ────────────────────────────────────────────────────────────────

/**
 * @param {object} options
 * @param {number} [options.intervalMs=3000]   How often to re-scan
 * @param {boolean} [options.autoFix=true]     Auto-fix fixable issues on each scan
 */
export default function useInteractivityMonitor({ intervalMs = 3000, autoFix = true } = {}) {
  const [issues, setIssues] = useState([]);
  const [lastScan, setLastScan] = useState(null);
  const [fixCount, setFixCount] = useState(0);
  const timerRef = useRef(null);
  const observerRef = useRef(null);

  const runScan = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const { issues: found, fixes } = scanInteractiveElements();

      if (autoFix && fixes.length > 0) {
        const fixed = autoFixAll(fixes);
        if (fixed.length > 0) {
          setFixCount(n => n + fixed.length);
        }
      }

      setIssues(found);
      setLastScan(new Date());
    } catch (e) {
      console.warn('[InteractivityMonitor] Scan error:', e);
    }
  }, [autoFix]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    // Initial scan
    runScan();

    // Interval scan
    timerRef.current = setInterval(runScan, intervalMs);

    // Also scan on DOM mutations (new elements added)
    observerRef.current = new MutationObserver(() => {
      clearTimeout(observerRef.current._debounce);
      observerRef.current._debounce = setTimeout(runScan, 300);
    });
    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'disabled', 'aria-disabled'],
    });

    return () => {
      clearInterval(timerRef.current);
      observerRef.current?.disconnect();
    };
  }, [runScan, intervalMs]);

  return { issues, lastScan, fixCount, runScan };
}
