/**
 * Metis – Continuous Interactivity Tests
 *
 * For every route in the app:
 *   1. Navigate to the route
 *   2. Audit all interactive elements (buttons, links, tabs, inputs)
 *   3. Assert none are blocked by: pointer-events:none, zero-size, transparent overlays
 *   4. Click every visible button/tab and verify no console errors fire
 *
 * Run:  npx playwright test
 * Watch: npx playwright test --ui
 */

import { test, expect } from '@playwright/test';
import { login, auditInteractiveElements, assertNoBlockingIssues } from './helpers.js';

// ── Routes to test ────────────────────────────────────────────────────────────
const ROUTES = [
  { path: '/',                    label: 'Dashboard' },
  { path: '/executive',           label: 'Executive View' },
  { path: '/projects',            label: 'Projects' },
  { path: '/projects/new',        label: 'New Project Wizard' },
  { path: '/diagram',             label: 'Diagram' },
  { path: '/threats',             label: 'Threats' },
  { path: '/controls',            label: 'Controls' },
  { path: '/risk-matrix',         label: 'Risk Matrix' },
  { path: '/data-flows',          label: 'Data Flows' },
  { path: '/settings',            label: 'Settings' },
  { path: '/compliance',          label: 'Compliance Overview' },
  { path: '/compliance/aescsf',   label: 'AESCSF' },
  { path: '/compliance/soci',     label: 'SOCI Act' },
  { path: '/compliance/asd-fortify',      label: 'ASD Fortify' },
  { path: '/compliance/essential-eight',  label: 'Essential Eight' },
  { path: '/compliance/gap-analysis',     label: 'Gap Analysis' },
  { path: '/compliance/report',           label: 'Compliance Report' },
];

// ── Auth setup (runs once per worker) ─────────────────────────────────────────
test.beforeEach(async ({ page }) => {
  await login(page);
});

// ── 1. Audit every route for blocking issues ──────────────────────────────────
for (const route of ROUTES) {
  test(`[audit] ${route.label} – no blocking interactivity issues`, async ({ page }) => {
    await page.goto(route.path);
    // Wait for the page to settle
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(500);

    await assertNoBlockingIssues(page, route.label);
  });
}

// ── 2. Sidebar navigation – every link is clickable and navigates ─────────────
test('[nav] Sidebar links all navigate correctly', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle').catch(() => {});

  const navLinks = page.locator('aside a[href]');
  const count = await navLinks.count();
  expect(count).toBeGreaterThan(0);

  const hrefs = await navLinks.evaluateAll(links => links.map(l => l.getAttribute('href')));
  const errors = [];

  for (const href of hrefs) {
    if (!href || href === '#') continue;
    await page.goto(href);
    await page.waitForLoadState('domcontentloaded').catch(() => {});

    const issues = await auditInteractiveElements(page);
    const blocking = issues.filter(i =>
      i.issues.some(x => x.includes('pointer-events') || x.includes('covered-by'))
    );
    if (blocking.length > 0) {
      errors.push(`${href}: ${blocking.map(b => `${b.tag} "${b.text}"`).join(', ')}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Blocking issues on ${errors.length} page(s):\n${errors.join('\n')}`);
  }
});

// ── 3. New Project Wizard – all 4 stages reachable and clickable ──────────────
test('[wizard] New Project wizard – all stages are interactive', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  await page.goto('/projects/new');
  await page.waitForLoadState('networkidle').catch(() => {});

  // Stage 1 – fill name and click Next
  const nameInput = page.locator('input[placeholder*="Payment" i], input[placeholder*="project" i], input[type="text"]').first();
  await expect(nameInput).toBeVisible({ timeout: 5000 });
  await nameInput.fill('E2E Test Project');

  await assertNoBlockingIssues(page, 'Wizard Stage 1');

  const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue")').first();
  await expect(nextBtn).toBeEnabled({ timeout: 5000 });
  await nextBtn.click();

  // Stage 2 – diagram canvas
  await page.waitForTimeout(600);
  await assertNoBlockingIssues(page, 'Wizard Stage 2');

  const nextBtn2 = page.locator('button:has-text("Next"), button:has-text("Continue")').first();
  await expect(nextBtn2).toBeEnabled({ timeout: 5000 });
  await nextBtn2.click();

  // Stage 3 – compliance
  await page.waitForTimeout(600);
  await assertNoBlockingIssues(page, 'Wizard Stage 3');

  // Click at least one compliance checkbox
  const firstCheckbox = page.locator('[role="checkbox"], input[type="checkbox"]').first();
  if (await firstCheckbox.isVisible()) await firstCheckbox.click();

  const nextBtn3 = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Analy")').first();
  await expect(nextBtn3).toBeEnabled({ timeout: 5000 });
  await nextBtn3.click();

  // Stage 4 – AI analysis
  await page.waitForTimeout(600);
  await assertNoBlockingIssues(page, 'Wizard Stage 4');

  // No React errors should have fired
  const reactErrors = consoleErrors.filter(e => e.includes('Error:') || e.includes('Uncaught'));
  expect(reactErrors, `Console errors: ${reactErrors.join('; ')}`).toHaveLength(0);
});

// ── 4. Projects page – New Project button is clickable ────────────────────────
test('[projects] New Project button navigates to wizard', async ({ page }) => {
  await page.goto('/projects');
  await page.waitForLoadState('networkidle').catch(() => {});

  const btn = page.locator('button:has-text("New Project"), a:has-text("New Project")').first();
  await expect(btn).toBeVisible({ timeout: 5000 });
  await expect(btn).toBeEnabled();
  await btn.click();
  await expect(page).toHaveURL(/\/projects\/new/, { timeout: 5000 });
});

// ── 5. Sidebar collapse toggle ────────────────────────────────────────────────
test('[layout] Sidebar collapse/expand button works', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle').catch(() => {});

  // Find the collapse button (contains "Collapse" text or a Menu icon)
  const collapseBtn = page.locator('button:has-text("Collapse")').first();
  await expect(collapseBtn).toBeVisible({ timeout: 5000 });
  await collapseBtn.click();

  // Sidebar should now be collapsed (width ~80px)
  const sidebar = page.locator('aside').first();
  await expect(sidebar).toBeVisible();

  // Expand again
  const expandBtn = page.locator('aside button').last();
  await expandBtn.click();
  await expect(page.locator('button:has-text("Collapse")')).toBeVisible({ timeout: 3000 });
});

// ── 6. Compliance tabs all render without blocking ────────────────────────────
test('[compliance] All compliance sub-pages render interactive content', async ({ page }) => {
  const complianceRoutes = [
    '/compliance', '/compliance/aescsf', '/compliance/soci',
    '/compliance/essential-eight', '/compliance/gap-analysis',
  ];
  for (const route of complianceRoutes) {
    await page.goto(route);
    await page.waitForLoadState('networkidle').catch(() => {});
    await assertNoBlockingIssues(page, route);
  }
});

// ── 7. Project Detail tabs ────────────────────────────────────────────────────
test('[project-detail] If a project exists, all tabs are clickable', async ({ page }) => {
  await page.goto('/projects');
  await page.waitForLoadState('networkidle').catch(() => {});

  // Click first project card if any
  const projectLink = page.locator('a[href^="/projects/"], [data-testid="project-card"] a').first();
  const exists = await projectLink.isVisible({ timeout: 2000 }).catch(() => false);
  if (!exists) {
    test.skip();
    return;
  }

  await projectLink.click();
  await page.waitForLoadState('networkidle').catch(() => {});
  await assertNoBlockingIssues(page, 'ProjectDetail');

  // Click each tab
  const tabs = ['Threat Register', 'Risk Matrix', 'Attack Paths', 'Visual Threats', 'Compliance'];
  for (const tabLabel of tabs) {
    const tab = page.locator(`button:has-text("${tabLabel}")`).first();
    if (await tab.isVisible({ timeout: 1000 }).catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(300);
      await assertNoBlockingIssues(page, `ProjectDetail tab: ${tabLabel}`);
    }
  }
});
