import { navigate } from '../core/router.js';
import { isTelegram } from '../core/telegram.js';
import { applyTheme } from '../core/theme.js';
import { store } from '../data/store.js';

const OPTIONS = [
  { value: 'system', label: 'Системна', hint: isTelegram ? 'як у Telegram' : 'як у системі' },
  { value: 'light', label: 'Світла' },
  { value: 'dark', label: 'Темна' },
];

export const settingsThemeScreen = {
  chrome: 'nested',
  tab: 'settings',

  render() {
    const current = store.getProfile().theme;
    const options = OPTIONS.map(({ value, label, hint }) => `
      <li>
        <button class="option${value === current ? ' option--selected' : ''}" type="button" role="radio"
          aria-checked="${value === current}" data-action="setTheme" data-value="${value}">
          <span class="option__box" aria-hidden="true"></span>
          <span class="option__label">${label}</span>
          ${hint ? `<span class="option__hint">${hint}</span>` : ''}
        </button>
      </li>`).join('');

    return `
      <section class="screen">
        <h1 class="screen__title">Тема</h1>
        <ul class="options" role="radiogroup" aria-label="Тема">${options}</ul>
      </section>`;
  },

  actions: {
    setTheme(el) {
      store.setTheme(el.dataset.value);
      applyTheme(el.dataset.value);
      navigate('settings-theme', {}, { replace: true });
    },
  },
};
