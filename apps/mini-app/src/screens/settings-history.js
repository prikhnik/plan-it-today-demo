// @ts-check
import { formatDayLabel, getCardProgress, toIsoDate } from '@plan-it-today/shared-types';
import { renderBadge } from '../components/badge.js';
import { escapeHtml } from '../core/html.js';
import { navigate } from '../core/router.js';
import { store } from '../data/store.js';

export const settingsHistoryScreen = {
  chrome: 'nested',
  tab: 'settings',

  render() {
    const groups = new Map();
    for (const card of store.getHistoryCards()) {
      const day = card.completedAt ?? card.date;
      if (!groups.has(day)) groups.set(day, []);
      groups.get(day).push(card);
    }
    const steps = store.getSteps();
    const content = [...groups]
      .map(
        ([day, cards]) => `
      <section class="history__group">
        <h2 class="history__date">${formatDayLabel(day, toIsoDate())}</h2>
        <ul class="day-list">${cards
          .map((card) => {
            const progress = getCardProgress(card.id, steps);
            return `<li class="day-list__item">
            <button class="day-row" type="button" data-action="openCard" data-card-id="${escapeHtml(card.id)}">
              <span class="day-row__title">${escapeHtml(card.title)}</span>
              ${progress.total ? renderBadge(progress) : ''}
              <span class="day-row__chevron" aria-hidden="true"></span>
            </button>
          </li>`;
          })
          .join('')}</ul>
      </section>`,
      )
      .join('');
    return `<section class="screen history">
      <h1 class="screen__title">Історія справ</h1>
      ${content || '<p class="screen__text">Тут з’являться виконані справи.</p>'}
      <p class="screen__text">Історія зберігається лише на цьому пристрої в цьому браузері. Видалення всіх даних очистить її.</p>
    </section>`;
  },

  actions: {
    openCard: (el) => navigate('quest', { cardId: el.dataset.cardId, tab: 'settings' }),
  },
};
