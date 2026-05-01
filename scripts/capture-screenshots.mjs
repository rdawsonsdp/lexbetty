#!/usr/bin/env node
/**
 * Capture full-page screenshots of all major routes in the LexBetty app.
 *
 * Usage: node scripts/capture-screenshots.mjs
 *
 * Requires: dev server running at http://localhost:3000
 */

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'bbq2026';
const OUT_DIR = path.resolve(process.cwd(), 'docs/screenshots');

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, isMobile: false },
  mobile: { width: 390, height: 844, isMobile: true },
};

const DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

// Public routes
const PUBLIC_ROUTES = [
  { key: 'home', path: '/' },
  { key: 'plan', path: '/plan' },
  { key: 'products', path: '/products' },
  { key: 'packages', path: '/packages' },
  { key: 'food-truck', path: '/food-truck' },
  { key: 'checkout', path: '/checkout' },
  { key: 'order-confirmation', path: '/order-confirmation' },
  { key: 'menu-engineering', path: '/menu-engineering' },
  { key: 'concierge', path: '/concierge' },
];

// Admin routes (require token in sessionStorage)
const ADMIN_ROUTES = [
  { key: 'admin-orders', path: '/admin/orders' },
  { key: 'admin-customers', path: '/admin/customers' },
  { key: 'admin-menu', path: '/admin/menu' },
  { key: 'admin-email', path: '/admin/email' },
  { key: 'admin-analytics', path: '/admin/analytics' },
  { key: 'admin-settings', path: '/admin/settings' },
  { key: 'admin-concierge-rules', path: '/admin/concierge-rules' },
];

const STABILIZE_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
  }
  html { scroll-behavior: auto !important; }
`;

async function getAdminToken() {
  const res = await fetch(`${BASE_URL}/api/admin/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`Admin auth failed: HTTP ${res.status}`);
  }
  const json = await res.json();
  if (!json.token) throw new Error('Admin auth: no token returned');
  return json.token;
}

async function getRecentOrderId(token) {
  try {
    const res = await fetch(
      `${BASE_URL}/api/admin/orders?status=all&limit=1&page=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const order = (json.orders || [])[0];
    return order ? order.id : null;
  } catch (e) {
    console.warn('  could not fetch recent order:', e.message);
    return null;
  }
}

async function captureRoute(browser, route, viewport, viewportKey, adminToken) {
  const url = `${BASE_URL}${route.path}`;
  const isMobile = viewport.isMobile;

  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: isMobile ? 2 : 1,
    isMobile,
    hasTouch: isMobile,
    userAgent: isMobile ? MOBILE_UA : DESKTOP_UA,
  });

  if (adminToken) {
    await context.addInitScript((tok) => {
      try {
        window.sessionStorage.setItem('admin_token', tok);
      } catch (e) {
        // ignore
      }
    }, adminToken);
  }

  const page = await context.newPage();

  // Suppress noisy console errors but keep them collectable
  const errors = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('requestfailed', (req) => {
    const url = req.url();
    // Ignore service worker and analytics noise
    if (url.endsWith('/sw.js') || url.includes('/api/analytics')) return;
    errors.push(`requestfailed: ${url} (${req.failure()?.errorText})`);
  });

  const outFile = path.join(OUT_DIR, `${route.key}-${viewportKey}.png`);
  let response = null;
  let status = 0;
  try {
    response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    status = response ? response.status() : 0;

    // Wait for network to settle, but cap it
    try {
      await page.waitForLoadState('networkidle', { timeout: 8000 });
    } catch {
      // ok if it doesn't fully idle
    }

    await page.addStyleTag({ content: STABILIZE_CSS }).catch(() => {});

    // Trigger lazy-load by scrolling to bottom and back to top
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let total = 0;
        const distance = 400;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          total += distance;
          if (total >= document.body.scrollHeight + 1000) {
            clearInterval(timer);
            window.scrollTo(0, 0);
            resolve();
          }
        }, 50);
      });
    });
    await page.waitForTimeout(800);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);

    await page.screenshot({ path: outFile, fullPage: true });

    return { ok: true, status, file: outFile, errors };
  } catch (err) {
    // Try to screenshot whatever we have
    try {
      await page.screenshot({ path: outFile, fullPage: true });
    } catch {
      // ignore
    }
    return {
      ok: false,
      status,
      file: existsSync(outFile) ? outFile : null,
      error: err.message,
      errors,
    };
  } finally {
    await context.close();
  }
}

async function main() {
  if (!existsSync(OUT_DIR)) {
    await mkdir(OUT_DIR, { recursive: true });
  }

  console.log(`Output: ${OUT_DIR}`);
  console.log(`Base URL: ${BASE_URL}`);

  // Authenticate as admin and find a recent order ID
  let adminToken = null;
  let recentOrderId = null;
  try {
    adminToken = await getAdminToken();
    console.log('Admin auth: ok');
    recentOrderId = await getRecentOrderId(adminToken);
    if (recentOrderId) {
      console.log(`Using order id for edit page: ${recentOrderId}`);
    } else {
      console.log('No orders in DB — skipping order-edit screenshot');
    }
  } catch (e) {
    console.warn(`Admin auth failed (admin pages will show login form): ${e.message}`);
  }

  // Build full route list (with optional order edit route)
  const routes = [
    ...PUBLIC_ROUTES.map((r) => ({ ...r, requiresAdmin: false })),
    ...ADMIN_ROUTES.map((r) => ({ ...r, requiresAdmin: true })),
  ];
  if (recentOrderId) {
    routes.push({
      key: 'admin-order-edit',
      path: `/admin/orders/${recentOrderId}/edit`,
      requiresAdmin: true,
    });
  }

  const browser = await chromium.launch({ headless: true });
  const summary = [];

  for (const route of routes) {
    for (const [vpKey, vp] of Object.entries(VIEWPORTS)) {
      const tag = `${route.key} [${vpKey}]`;
      process.stdout.write(`Capturing ${tag} ${route.path} ... `);
      const tokenForRoute = route.requiresAdmin ? adminToken : null;
      const result = await captureRoute(browser, route, vp, vpKey, tokenForRoute);
      if (result.ok) {
        console.log(`ok (HTTP ${result.status})`);
      } else {
        console.log(
          `FAILED (HTTP ${result.status}) — ${result.error || 'unknown'}`
        );
      }
      summary.push({
        route: route.path,
        key: route.key,
        viewport: vpKey,
        ok: result.ok,
        status: result.status,
        file: result.file,
        error: result.error,
      });
    }
  }

  await browser.close();

  // Print summary
  console.log('\n=== Summary ===');
  const total = summary.length;
  const okCount = summary.filter((s) => s.ok).length;
  const failed = summary.filter((s) => !s.ok);
  const non200 = summary.filter((s) => s.ok && s.status && s.status >= 400);
  console.log(`Captured: ${okCount}/${total}`);
  if (non200.length) {
    console.log('\nNon-2xx responses (still captured):');
    non200.forEach((s) =>
      console.log(`  - ${s.route} [${s.viewport}] -> HTTP ${s.status}`)
    );
  }
  if (failed.length) {
    console.log('\nFailed captures:');
    failed.forEach((s) =>
      console.log(`  - ${s.route} [${s.viewport}] -> ${s.error}`)
    );
  }
  console.log(`\nScreenshots saved to: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
