import { escapeHtml } from '../core/html.js';
import { getTelegramUser } from '../core/telegram.js';

const PHRASE = 'Одна справа за раз.';

export function renderGreeting() {
  const name = getTelegramUser()?.first_name;
  return `
    <header class="greeting">
      <p class="greeting__hello">${name ? `Привіт, ${escapeHtml(name)}!` : 'Привіт!'}</p>
      <p class="greeting__phrase">${PHRASE}</p>
    </header>`;
}
