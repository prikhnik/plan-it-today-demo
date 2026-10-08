// @ts-check
import {
  expect,
  getTomorrow,
  note,
  noteTitles,
  openCard,
  pickDate,
  readStorage,
  seedProfile,
  test,
} from './helpers.js';

test('onboarding: intro and terms once, then the planner', async ({ page }) => {
  await page.goto('./');
  await page.locator('[data-action="continue"]').click();
  await expect(page.getByRole('heading', { name: 'Умови користування' })).toBeVisible();
  await page.locator('[data-action="accept"]').click();
  await expect(page.locator('.planner')).toBeVisible();

  await page.reload();
  await expect(page.locator('.planner')).toBeVisible();
  expect((await readStorage(page, 'profile')).termsAcceptedVersion).toBe('1.1');
});

test.describe('with accepted terms', () => {
  test.beforeEach(async ({ page }) => {
    await seedProfile(page);
    await page.goto('./');
    await expect(page.locator('.planner')).toBeVisible();
  });

  test('add a card from the quick field', async ({ page }) => {
    await page.locator('.quick-add__input').fill('Полити квіти');
    await page.locator('.quick-add__input').press('Enter');
    await expect(note(page, 'Полити квіти')).toBeVisible();
    // Priority cards stay on top, the new card goes right after them.
    const titles = await noteTitles(page);
    expect(titles.indexOf('Полити квіти')).toBe(1);
  });

  test('complete a quest step by step', async ({ page }) => {
    await openCard(page, 'Подзвонити в банк');
    const finish = page.locator('[data-action="finish"]');
    await expect(finish).toBeDisabled();
    const steps = page.locator('[data-action="toggleStep"]');
    for (let index = 0; index < 3; index += 1) await steps.nth(index).click();
    await expect(page.locator('.progress__label')).toHaveText('3 з 3');
    await finish.click();

    await expect(page.locator('.planner')).toBeVisible();
    const done = note(page, 'Подзвонити в банк');
    await expect(done).toHaveClass(/note--done/);
    await expect(done).not.toHaveClass(/note--priority/);
    // Completed cards sink below every active one.
    const states = await page
      .locator('.note')
      .evaluateAll((notes) => notes.map((element) => element.classList.contains('note--done')));
    expect(states.indexOf(true)).toBe(states.lastIndexOf(false) + 1);
  });

  test('move a card to «Майбутнє»', async ({ page }) => {
    const tomorrow = await getTomorrow(page);
    await openCard(page, 'Купити хліб');
    await page.locator('[data-action="editCard"]').click();
    await page.locator('.sheet [data-action="openCalendar"]').click();
    await pickDate(page, tomorrow);
    await page.getByRole('button', { name: 'Зберегти' }).click();
    await expect(page.locator('.quest__subtitle')).toHaveText(/^Квест на /);

    await page.locator('[data-nav="planner"]').click();
    await expect(note(page, 'Купити хліб')).toHaveCount(0);
    await page.locator('[data-nav="future"]').click();
    await expect(page.locator('.day-row', { hasText: 'Купити хліб' })).toBeVisible();
  });

  test('«Важливо»: on top, highlighted, kept in data', async ({ page }) => {
    await openCard(page, 'Купити хліб');
    await page.locator('[data-action="editCard"]').click();
    const chip = page.locator('[data-action="togglePriority"]');
    await expect(chip).toHaveAttribute('aria-pressed', 'false');
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Зберегти' }).click();
    await page.locator('[data-nav="planner"]').click();

    const titles = await noteTitles(page);
    expect(titles.slice(0, 2).sort()).toEqual(['Купити хліб', 'Подзвонити в банк']);
    await expect(note(page, 'Купити хліб')).toHaveClass(/note--priority/);
    await expect(page.locator('.note--priority')).toHaveCount(2);
    const { cards } = await readStorage(page, 'data');
    expect(cards.find((card) => card.title === 'Купити хліб').priority).toBe(true);

    await page.locator('[data-nav="future"]').click();
    await page.locator('.week__day').nth(2).click();
    await expect(page.locator('.day-row--priority', { hasText: 'Записатися до лікаря' })).toBeVisible();
  });

  test('theme switch: veil, dark theme, remembered on reload', async ({ page }) => {
    await page.locator('.greeting__theme').click();
    await expect(page.locator('html')).toHaveClass(/theme-dark/);
    await expect(page.locator('.theme-veil')).toHaveCount(0);
    await expect(page.locator('.greeting__theme')).toHaveAttribute('aria-label', 'Увімкнути світлу тему');
    expect((await readStorage(page, 'profile')).theme).toBe('dark');

    await page.reload();
    const firstClass = await page.evaluate(() => document.documentElement.className);
    expect(firstClass).toContain('theme-dark');
  });

  test('«Видалити всі дані» returns to the intro', async ({ page }) => {
    await page.locator('[data-nav="settings"]').click();
    await page.locator('[data-nav="settings-data"]').click();
    await page.locator('[data-action="askDelete"]').click();
    await page.locator('[data-action="deleteAll"]').click();
    await expect(page.locator('[data-action="continue"]')).toBeVisible();
    expect((await readStorage(page, 'profile'))?.introSeen ?? false).toBe(false);
    expect(await readStorage(page, 'phrase')).toBeNull();
  });

  test('modal focus: inside on open, Tab trapped, back to the pencil on Escape', async ({ page }) => {
    await openCard(page, 'Купити хліб');
    const pencil = page.locator('[data-action="editCard"]');
    await pencil.focus();
    await pencil.press('Enter');
    const panel = page.locator('.modal__panel');
    await expect(panel.locator('textarea')).toBeFocused();
    for (let index = 0; index < 6; index += 1) {
      await page.keyboard.press('Tab');
      expect(await panel.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(pencil).toBeFocused();
  });

  test('about screen shows version and build', async ({ page }) => {
    await page.locator('[data-nav="settings"]').click();
    await page.locator('[data-nav="settings-about"]').click();
    await expect(page.getByText(/Версія \d+\.\d+\.\d+ \(збірка \S+ від \d{2}\.\d{2}\.\d{4}\)/)).toBeVisible();
  });
});

test.describe('stored data', () => {
  test('no localStorage: the app still works in memory', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('Storage is disabled', 'SecurityError');
        },
      });
    });
    await page.goto('./');
    await page.locator('[data-action="continue"]').click();
    await page.locator('[data-action="accept"]').click();
    await page.locator('.quick-add__input').fill('Без сховища');
    await page.locator('.quick-add__input').press('Enter');
    await expect(note(page, 'Без сховища')).toBeVisible();
    await expect(page.locator('.greeting__phrase')).not.toBeEmpty();
  });

  test('broken JSON: reset screen instead of a blank page', async ({ page }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('pit:profile', JSON.stringify({ introSeen: true, termsAcceptedVersion: '1.1' }));
      localStorage.setItem('pit:data', '{"cards": [');
    });
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'Дані пошкоджені' })).toBeVisible();
    await page.getByRole('button', { name: 'Скинути дані' }).click();
    await expect(page.locator('[data-action="continue"]')).toBeVisible();
    expect((await readStorage(page, 'data')).cards.length).toBeGreaterThan(0);
  });

  test('old records without a schema version are migrated', async ({ page }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      const today = new Date();
      const date = [today.getFullYear(), today.getMonth() + 1, today.getDate()]
        .map((part) => String(part).padStart(2, '0'))
        .join('-');
      localStorage.setItem('pit:profile', JSON.stringify({ introSeen: true, termsAcceptedVersion: '1.1' }));
      localStorage.setItem(
        'pit:data',
        JSON.stringify({
          cards: [
            {
              id: 'a',
              title: 'Стара справа',
              date,
              status: 'active',
              source: 'manual',
              completedAt: null,
              createdAt: '2026-01-01T00:00:00.000Z',
              legacy: 1,
            },
          ],
          steps: [],
        }),
      );
    });
    await page.goto('./');
    await expect(note(page, 'Стара справа')).toBeVisible();
    expect(await readStorage(page, 'schemaVersion')).toBe(1);
    const { cards } = await readStorage(page, 'data');
    expect(cards[0]).toEqual(expect.objectContaining({ priority: false }));
    expect(cards[0]).not.toHaveProperty('legacy');
  });
});
