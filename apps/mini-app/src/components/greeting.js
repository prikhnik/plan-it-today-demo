import { escapeHtml } from '../core/html.js';
import { getTelegramUser } from '../core/telegram.js';

const PHRASE = 'Одна справа за раз.';

const ICONS = {
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>',
};

export function renderGreeting() {
  const name = getTelegramUser()?.first_name;
  const isDark = document.documentElement.classList.contains('theme-dark');

  return `
    <header class="greeting">
      <div class="greeting__text">
        <p class="greeting__hello">${name ? `Привіт, ${escapeHtml(name)}!` : 'Привіт!'}</p>
        <p class="greeting__phrase">${PHRASE}</p>
      </div>
      <button class="greeting__theme" type="button" data-action="toggleTheme"
        aria-label="${isDark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}">
        <svg class="greeting__icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[isDark ? 'sun' : 'moon']}</svg>
      </button>
    </header>`;
}
