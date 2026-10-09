// @ts-check
import { expect, openCard, readStorage, seedProfile, seedCards, test } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await seedProfile(page);
  await seedCards(page);
  await page.goto('./');
});

test('text fields only focus after user interaction', async ({ page }) => {
  await expect(page.locator('.quick-add__input')).not.toBeFocused();
  await page.locator('.quick-add__submit').click();
  await expect(page.locator('.notebook__input')).not.toBeFocused();
  await page.locator('[data-nav="planner"]').click();
  await openCard(page, 'Купити хліб');
  await page.locator('[data-action="showAddStep"]').click();
  await expect(page.locator('.quest__add-input')).not.toBeFocused();
  await page.getByRole('button', { name: 'Редагувати', exact: true }).click();
  await expect(page.locator('.modal__panel')).toBeFocused();
  await expect(page.locator('[name="title"]')).not.toBeFocused();
});

test('history restores old completed progress, reopens and deletes cards with their steps', async ({ page }) => {
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('pit:data'));
    data.cards.push({
      id: 'old',
      title: 'Давня справа',
      date: '2026-01-01',
      status: 'done',
      completedAt: '2026-01-02',
      createdAt: '2026-01-01T12:00:00Z',
      source: 'manual',
      priority: false,
    });
    data.steps.push(
      { id: 'old-step', cardId: 'old', parentId: null, text: 'Перший крок', done: false, order: 0 },
      { id: 'old-child', cardId: 'old', parentId: 'old-step', text: 'Підпункт', done: false, order: 0 },
    );
    localStorage.setItem('pit:data', JSON.stringify(data));
  });
  await page.reload();
  await page.locator('[data-nav="settings"]').click();
  await page.locator('[data-nav="settings-history"]').click();
  await page.getByRole('button', { name: /Давня справа/ }).click();
  await expect(page.locator('.progress__label')).toHaveText('1 з 1');
  await expect(page.locator('.step__box--checked')).toHaveCount(2);
  await page.getByRole('button', { name: 'Повернути в план' }).click();
  await page.locator('[data-nav="settings"]').click();
  await page.locator('[data-nav="settings-history"]').click();
  await expect(page.getByRole('button', { name: /Давня справа/ })).toHaveCount(0);
  await page.locator('[data-nav="planner"]').click();
  await openCard(page, 'Давня справа');
  await page.getByRole('button', { name: 'Завершити квест' }).click();
  await page.locator('[data-nav="settings"]').click();
  await page.locator('[data-nav="settings-history"]').click();
  await page.getByRole('button', { name: /Давня справа/ }).click();
  await page.getByRole('button', { name: 'Видалити квест', exact: true }).click();
  await page.getByRole('button', { name: 'Ні, залишити' }).click();
  await expect(page.locator('.quest__title')).toHaveText('Давня справа');
  await page.getByRole('button', { name: 'Видалити квест', exact: true }).click();
  await page.getByRole('button', { name: 'Так, видалити' }).click();
  await expect(page.getByRole('button', { name: /Давня справа/ })).toHaveCount(0);
  const data = await readStorage(page, 'data');
  expect(data.cards.some((card) => card.id === 'old')).toBe(false);
  expect(data.steps.some((step) => step.cardId === 'old')).toBe(false);
});

for (const theme of ['light', 'dark']) {
  test(`long title expands the banner in ${theme}`, async ({ page }) => {
    const title = 'Дуже довга назва справи '.repeat(20).trim();
    await page.evaluate(
      ({ title, theme }) => {
        const profile = JSON.parse(localStorage.getItem('pit:profile'));
        localStorage.setItem('pit:profile', JSON.stringify({ ...profile, theme }));
        const data = JSON.parse(localStorage.getItem('pit:data'));
        data.cards[0].title = title;
        localStorage.setItem('pit:data', JSON.stringify(data));
      },
      { title, theme },
    );
    await page.reload();
    await page.locator('.note').filter({ hasText: title }).click();
    await expect(page.locator('.quest__title')).toHaveText(title);
    const geometry = await page.locator('.quest__title').evaluate((element) => ({
      text: element.getBoundingClientRect().height,
      banner: element.parentElement.getBoundingClientRect().height,
      scroll: element.scrollHeight,
      client: element.clientHeight,
      page: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(geometry.banner).toBeGreaterThan(96);
    expect(geometry.banner).toBeGreaterThan(geometry.text);
    expect(geometry.scroll).toBeLessThanOrEqual(geometry.client + 1);
    expect(geometry.page).toBeLessThanOrEqual(geometry.viewport);
    await page.screenshot({ path: test.info().outputPath(`long-title-${theme}.png`), fullPage: true });
  });
}
