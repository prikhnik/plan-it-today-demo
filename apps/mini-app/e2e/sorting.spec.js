// @ts-check
import { expect, note, noteTitles, readStorage, seedCards, seedProfile, test } from './helpers.js';

/** @param {import('@playwright/test').Page} page @param {import('@playwright/test').Locator} from @param {import('@playwright/test').Locator} to */
async function dragMouse(page, from, to) {
  const a = await from.boundingBox();
  const b = await to.boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
  await page.mouse.up();
}

test('public app starts empty and keeps user progress after reload and reset', async ({ page }) => {
  await seedProfile(page);
  await page.goto('./');
  await expect(page.locator('.note')).toHaveCount(0);
  await page.locator('.quick-add__input').fill('Моя справа');
  await page.locator('.quick-add__input').press('Enter');
  await note(page, 'Моя справа').click();
  await page.locator('[data-action="showAddStep"]').click();
  await page.locator('.quest__add-input').fill('Мій крок');
  await page.locator('.quest__add-input').press('Enter');
  await page.locator('[data-action="toggleStep"]').click();
  await page.locator('[data-action="finish"]').click();
  await page.reload();
  await expect(note(page, 'Моя справа')).toHaveClass(/note--done/);
  await note(page, 'Моя справа').click();
  await expect(page.locator('.progress__label')).toHaveText('1 з 1');
  await page.locator('[data-nav="settings"]').click();
  await page.locator('[data-nav="settings-data"]').click();
  await page.locator('[data-action="askDelete"]').click();
  await page.locator('[data-action="deleteAll"]').click();
  expect(await readStorage(page, 'data')).toEqual({ cards: [], steps: [] });
});

test.describe('manual card order', () => {
  test.beforeEach(async ({ page }) => {
    await seedProfile(page);
    await seedCards(page);
    await page.goto('./');
  });

  test('mouse reorder persists, click is suppressed, important and completed boundaries remain', async ({ page }) => {
    const before = await noteTitles(page);
    await dragMouse(page, note(page, 'Забрати посилку'), note(page, 'Купити хліб'));
    await expect(page.locator('.planner')).toBeVisible();
    const after = await noteTitles(page);
    expect(after.indexOf('Забрати посилку')).toBe(after.indexOf('Купити хліб') + 1);
    expect(after).not.toEqual(before);
    await page.reload();
    expect(await noteTitles(page)).toEqual(after);
    await dragMouse(page, note(page, 'Забрати посилку'), page.locator('.note--priority').first());
    expect(await noteTitles(page)).toEqual(after);
    expect(await page.locator('.note--done[data-sort-group]').count()).toBe(0);
    await note(page, 'Купити хліб').click();
    await expect(page.locator('.quest')).toBeVisible();
  });

  test('keyboard sorting in a future day persists and leaves other dates unchanged', async ({ page }) => {
    await page.locator('.quick-add__input').fill('Перша завтра');
    await page.locator('.quick-add__input').press('Enter');
    await page.locator('.quick-add__input').fill('Друга завтра');
    await page.locator('.quick-add__input').press('Enter');
    await page.locator('[data-nav="future"]').click();
    const rows = page.locator('.day-row');
    const before = await rows.allInnerTexts();
    const dataBefore = await readStorage(page, 'data');
    await rows.first().focus();
    await page.keyboard.press('Alt+ArrowDown');
    const after = await rows.allInnerTexts();
    expect(after[0]).toBe(before[1]);
    expect(after[1]).toBe(before[0]);
    await page.reload();
    await page.locator('[data-nav="future"]').click();
    expect(await rows.allInnerTexts()).toEqual(after);
    const dataAfter = await readStorage(page, 'data');
    const tomorrow = dataBefore.cards.find((card) => card.title === 'Перша').date;
    expect(dataAfter.cards.filter((card) => card.date !== tomorrow)).toEqual(
      dataBefore.cards.filter((card) => card.date !== tomorrow),
    );
  });

  test('touch hold reorders while a swipe before the hold does not', async ({ page, context }) => {
    const session = await context.newCDPSession(page);
    const from = note(page, 'Забрати посилку');
    const to = note(page, 'Купити хліб');
    const a = await from.boundingBox();
    const b = await to.boundingBox();
    const touch = (rect) => [{ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }];
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touch(a) });
    await expect(from).toHaveClass(/sort-card--dragging/);
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: touch(b) });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(page.locator('.planner')).toBeVisible();
    const after = await noteTitles(page);
    expect(after.indexOf('Забрати посилку')).toBe(after.indexOf('Купити хліб') + 1);
    await page.reload();
    expect(await noteTitles(page)).toEqual(after);
    const current = await from.boundingBox();
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touch(current) });
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: current.x + current.width / 2, y: current.y + current.height / 2 - 60 }],
    });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    expect(await noteTitles(page)).toEqual(after);
  });

  test('mouse reorder works in a future day', async ({ page }) => {
    for (const title of ['Перша завтра', 'Друга завтра']) {
      await page.locator('.quick-add__input').fill(title);
      await page.locator('.quick-add__input').press('Enter');
    }
    await page.locator('[data-nav="future"]').click();
    const rows = page.locator('.day-row');
    const before = await rows.allInnerTexts();
    await dragMouse(page, rows.nth(0), rows.nth(1));
    await expect(page.locator('.future')).toBeVisible();
    const after = await rows.allInnerTexts();
    expect(after.slice(0, 2)).toEqual([before[1], before[0]]);
    await page.reload();
    await page.locator('[data-nav="future"]').click();
    expect(await rows.allInnerTexts()).toEqual(after);
  });

  test('dragging scrolls the planner near its edge', async ({ page }) => {
    await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('pit:data'));
      const template = data.cards.find(
        (card) => card.status === 'active' && !card.priority && card.date >= new Date().toISOString().slice(0, 10),
      );
      data.cards = Array.from({ length: 24 }, (_, index) => ({
        ...template,
        id: `scroll-${index}`,
        title: `Справа ${index}`,
        order: index,
      }));
      data.steps = [];
      localStorage.setItem('pit:data', JSON.stringify(data));
    });
    await page.reload();
    const first = await page.locator('.sort-card').first().boundingBox();
    const scroller = page.locator('.app__main');
    const bounds = await scroller.boundingBox();
    await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
    await page.mouse.down();
    await page.mouse.move(first.x + first.width / 2, bounds.y + bounds.height - 10, { steps: 8 });
    await expect.poll(() => scroller.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await page.keyboard.press('Escape');
    await page.mouse.up();
  });

  test('Escape cancels dragging and new cards appear first in their group', async ({ page }) => {
    const before = await noteTitles(page);
    const a = await note(page, 'Забрати посилку').boundingBox();
    const b = await note(page, 'Купити хліб').boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
    await page.keyboard.press('Escape');
    await page.mouse.up();
    expect(await noteTitles(page)).toEqual(before);
    await page.locator('.quick-add__input').fill('Нова справа');
    await page.locator('.quick-add__input').press('Enter');
    expect((await noteTitles(page)).slice(0, 2)).toEqual(['Подзвонити в банк', 'Нова справа']);
  });
});
