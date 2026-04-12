/**
 * Shared helpers for Metis interactivity E2E tests.
 */

/** Credentials stored in .env (falls back to dev defaults) */
export const TEST_USER = process.env.TEST_USER || 'admin';
export const TEST_PASS = process.env.TEST_PASS || 'password';

/**
 * Log in via the Login page and wait for the dashboard.
 * Skips if already authenticated (session cookie present).
 */
export async function login(page) {
  await page.goto('/login');
  // If already redirected away from login, we're good
  if (!page.url().includes('/login')) return;

  const userField = page.locator('input[type="text"], input[name="username"], input[placeholder*="user" i]').first();
  const passField = page.locator('input[type="password"]').first();

  await userField.fill(TEST_USER);
  await passField.fill(TEST_PASS);
  await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")').first().click();
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 8000 }).catch(() => {});
}

/**
 * Collect all interactive elements on the current page and return
 * an audit report: { el, tag, text, issue } for any unresponsive ones.
 */
export async function auditInteractiveElements(page) {
  return page.evaluate(() => {
    const SELECTOR = [
      'button:not([disabled])',
      'a[href]',
      '[role="button"]:not([aria-disabled="true"])',
      '[role="tab"]',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
    ].join(', ');

    const results = [];

    for (const el of document.querySelectorAll(SELECTOR)) {
      if (el.closest('[data-interactivity-monitor]')) continue;

      const rect = el.getBoundingClientRect();
      const cs   = window.getComputedStyle(el);
      const tag  = el.tagName.toLowerCase();
      const text = (el.textContent || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 60);

      const issues = [];

      if (rect.width === 0 || rect.height === 0) issues.push('zero-size');
      if (cs.pointerEvents === 'none') issues.push('pointer-events:none');
      if (parseFloat(cs.opacity) < 0.05) issues.push('invisible');

      // Covered check (sample center point)
      if (rect.width > 0 && rect.height > 0) {
        const cx = rect.left + rect.width  / 2;
        const cy = rect.top  + rect.height / 2;
        const top = document.elementFromPoint(cx, cy);
        if (top && top !== el && !el.contains(top)) {
          const topTag = top.tagName.toLowerCase();
          if (!['svg', 'path', 'g'].includes(topTag)) {
            issues.push(`covered-by:<${topTag}>`);
          }
        }
      }

      if (issues.length > 0) {
        results.push({ tag, text, issues });
      }
    }

    return results;
  });
}

/**
 * Assert there are no BLOCKING interactivity issues on the current page.
 * pointer-events:none and covered-by are blocking; zero-size on hidden items is warned.
 */
export async function assertNoBlockingIssues(page, routeLabel) {
  const issues = await auditInteractiveElements(page);
  const blocking = issues.filter(i =>
    i.issues.some(x => x.includes('pointer-events') || x.includes('covered-by'))
  );

  if (blocking.length > 0) {
    const detail = blocking.map(b => `  [${b.tag}] "${b.text}" → ${b.issues.join(', ')}`).join('\n');
    throw new Error(`${routeLabel}: ${blocking.length} blocking issue(s) found:\n${detail}`);
  }
}
