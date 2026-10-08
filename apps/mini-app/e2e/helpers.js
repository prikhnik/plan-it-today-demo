// @ts-check
import { expect, test as base } from '@playwright/test';

export const ACCEPTED_PROFILE = { introSeen: true, termsAcceptedVersion: '1.1', theme: 'light' };

/**
 * Every test fails on a console error (CSP violations included).
 * The Telegram SDK is stubbed so tests do not depend on telegram.org; tests tagged @telegram load the real one.
 */
export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const errors = [];
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
    page.on('pageerror', (error) => errors.push(error.message));
    if (!testInfo.tags.includes('@telegram')) {
      await page.route('https://telegram.org/**', (route) =>
        route.fulfill({ contentType: 'application/javascript', body: '' }),
      );
    }
    await use(page);
    expect(errors, 'console errors').toEqual([]);
  },
});

export { expect };

/** @param {import('@playwright/test').Page} page */
export async function seedProfile(page, profile = ACCEPTED_PROFILE) {
  await page.addInitScript((value) => {
    if (!localStorage.getItem('pit:profile')) localStorage.setItem('pit:profile', JSON.stringify(value));
  }, profile);
}

/** @param {import('@playwright/test').Page} page */
export const noteTitles = (page) => page.locator('.note .note__title').allInnerTexts();

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} title
 */
export const note = (page, title) => page.locator('.note', { hasText: title });

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} title
 */
export async function openCard(page, title) {
  await note(page, title).click();
  await expect(page.locator('.quest__title')).toHaveText(title);
}

/**
 * Picks a day in the open calendar, moving to the next month when needed.
 * @param {import('@playwright/test').Page} page
 * @param {string} date ISO date.
 */
export async function pickDate(page, date) {
  const day = page.locator(`.calendar__day[data-date="${date}"]`);
  if (!(await day.count())) await page.locator('[data-action="calendarNext"]').click();
  await day.click();
}

/** @param {import('@playwright/test').Page} page */
export const getTomorrow = (page) =>
  page.evaluate(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
      .map((part) => String(part).padStart(2, '0'))
      .join('-');
  });

/** @param {import('@playwright/test').Page} page */
export const readStorage = (page, key) =>
  page.evaluate((name) => JSON.parse(localStorage.getItem(`pit:${name}`) ?? 'null'), key);
