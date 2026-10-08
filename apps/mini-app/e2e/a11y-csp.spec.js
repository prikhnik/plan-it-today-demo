// @ts-check
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, openCard, seedProfile, test } from './helpers.js';

const BLOCKING = ['critical', 'serious'];

/** @typedef {{ id: string, impact: string, help: string, nodes: number }} Finding */
/** @type {Record<string, { passes: number, violations: Finding[], incomplete: Finding[] }>} */
const report = {};

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} name
 */
async function audit(page, name) {
  const { passes, violations, incomplete } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  /** @param {{ id: string, impact?: string, help: string, nodes: unknown[] }} result */
  const toFinding = ({ id, impact, help, nodes }) => ({ id, impact, help, nodes: nodes.length });
  report[name] = {
    passes: passes.length,
    violations: violations.map(toFinding),
    incomplete: incomplete.map(toFinding),
  };
  expect(
    violations
      .filter((violation) => BLOCKING.includes(violation.impact))
      .map(({ id, nodes }) => `${id}: ${nodes[0].target}`),
    `${name}: critical and serious violations`,
  ).toEqual([]);
}

test.describe('accessibility (axe-core)', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async () => {
    const dir = test.info().project.outputDir;
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'axe-report.json'), JSON.stringify(report, null, 2));
  });

  for (const theme of ['light', 'dark']) {
    test(`key screens, ${theme} theme`, async ({ page }) => {
      await page.goto('./');
      await expect(page.locator('[data-action="continue"]')).toBeVisible();
      await page.evaluate((value) => {
        localStorage.setItem('pit:profile', JSON.stringify({ introSeen: false, theme: value }));
      }, theme);
      await page.reload();
      await audit(page, `${theme}: intro`);
      await page.locator('[data-action="continue"]').click();
      await expect(page.locator('[data-action="accept"]')).toBeVisible();
      await audit(page, `${theme}: terms`);
      await page.locator('[data-action="accept"]').click();

      await expect(page.locator('.planner')).toBeVisible();
      await audit(page, `${theme}: planner`);
      await openCard(page, 'Аптека ввечері');
      await audit(page, `${theme}: quest`);
      await page.locator('.quest__edit').click();
      await audit(page, `${theme}: card editor`);
      await page.keyboard.press('Escape');
      await page.locator('[data-nav="future"]').click();
      await expect(page.locator('.future')).toBeVisible();
      await audit(page, `${theme}: future`);
      await page.locator('[data-nav="settings"]').click();
      await audit(page, `${theme}: settings`);
    });
  }
});

test.describe('CSP with the real Telegram SDK', () => {
  test('no CSP violations on the main flows', { tag: '@telegram' }, async ({ page }) => {
    const sdk = await page.request.get('https://telegram.org/js/telegram-web-app.js').catch(() => null);
    test.skip(!sdk?.ok(), 'telegram.org is not reachable');

    const violations = [];
    await page.exposeFunction('reportViolation', (text) => violations.push(text));
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (event) =>
        window['reportViolation'](`${event.violatedDirective} ${event.blockedURI}`),
      );
    });
    await seedProfile(page);
    const response = await page.goto('./');
    expect(response.headers()['content-security-policy']).toContain("script-src 'self' https://telegram.org");
    expect(response.headers()['x-content-type-options']).toBe('nosniff');

    await openCard(page, 'Аптека ввечері');
    await page.locator('[data-nav="settings"]').click();
    await page.locator('[data-nav="ai-demo"]').click();
    await expect(page.locator('.ai-demo')).toBeVisible();
    await page.locator('.greeting__theme, [data-nav="settings"]').first().isVisible();
    expect(violations).toEqual([]);
  });
});
