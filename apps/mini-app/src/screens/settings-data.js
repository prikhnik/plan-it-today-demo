import { formatDayLabel, toIsoDate } from '@plan-it-today/shared-types';
import { escapeHtml } from '../core/html.js';
import { navigate } from '../core/router.js';
import { getTelegramUser } from '../core/telegram.js';
import { applyTheme } from '../core/theme.js';
import { showToast } from '../core/toast.js';
import { store } from '../data/store.js';

const THEME_LABELS = { system: 'Системна', light: 'Світла', dark: 'Темна' };
const NOT_IN_TELEGRAM = 'немає (відкрито не в Telegram)';

function getFacts() {
  const user = getTelegramUser();
  const profile = store.getProfile();
  const counts = store.getCounts();
  const accepted = profile.termsAcceptedAt
    ? `версія ${profile.termsAcceptedVersion}, ${formatDayLabel(toIsoDate(new Date(profile.termsAcceptedAt)))}`
    : 'ще ні';

  return [
    ['Telegram ID', user ? String(user.id) : NOT_IN_TELEGRAM],
    ['Імʼя', user ? [user.first_name, user.last_name].filter(Boolean).join(' ') : NOT_IN_TELEGRAM],
    ['Умови прийнято', accepted],
    ['Тема', THEME_LABELS[profile.theme]],
    ['Картки', String(counts.cards)],
    ['Кроки', String(counts.steps)],
  ];
}

export const settingsDataScreen = {
  chrome: 'nested',
  tab: 'settings',

  render(params) {
    const facts = getFacts().map(([term, value]) => `
      <div class="facts__row">
        <dt class="facts__term">${term}</dt>
        <dd class="facts__value">${escapeHtml(value)}</dd>
      </div>`).join('');

    const actions = params.confirm
      ? `
        <p class="screen__text">Видалити всі картки, кроки й налаштування з цього пристрою?</p>
        <button class="button" type="button" data-action="deleteAll">Так, видалити</button>
        <button class="screen__link" type="button" data-action="cancel">Ні, залишити</button>`
      : '<button class="button" type="button" data-action="askDelete">Видалити всі дані</button>';

    return `
      <section class="screen">
        <h1 class="screen__title">Дані користувача</h1>
        <p class="screen__text">У демо все зберігається лише на цьому пристрої, і бачиш це тільки ти.</p>
        <dl class="facts">${facts}</dl>
        ${actions}
      </section>`;
  },

  actions: {
    askDelete: () => navigate('settings-data', { confirm: true }, { replace: true }),
    cancel: () => navigate('settings-data', {}, { replace: true }),
    deleteAll() {
      store.deleteAllData();
      applyTheme('system');
      navigate('intro', {}, { reset: true });
      showToast('Дані видалено');
    },
  },
};
