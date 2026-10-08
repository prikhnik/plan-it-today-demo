// @ts-check
import {
  extractNoteDate,
  formatDateChip,
  formatDayLabel,
  getCardProgress,
  isPriorityShown,
  isQuest,
  toIsoDate,
} from '@plan-it-today/shared-types';
import { renderBadge } from '../components/badge.js';
import { renderEmpty } from '../components/empty.js';
import { escapeHtml } from '../core/html.js';
import { navigate } from '../core/router.js';
import { showToast } from '../core/toast.js';
import { getDecoIcon } from '../data/deco.js';
import { store } from '../data/store.js';

const PAPERS = 3;

function renderNote(card, progress, index) {
  const deco = getDecoIcon(card.title);
  const modifiers = [
    `paper-${(index % PAPERS) + 1}`,
    card.status === 'done' && 'done',
    isPriorityShown(card) && 'priority',
  ]
    .filter(Boolean)
    .map((modifier) => ` note--${modifier}`)
    .join('');

  return `
    <li class="planner__item">
      <button class="note${modifiers}" type="button" data-action="openCard" data-card-id="${card.id}">
        <span class="note__title">${escapeHtml(card.title)}</span>
        ${isQuest(progress) ? renderBadge(progress) : ''}
        ${deco ? `<span class="note__deco note__deco--${deco}" aria-hidden="true"></span>` : ''}
      </button>
    </li>`;
}

function addFromQuickField(value) {
  if (!value.trim()) {
    navigate('notebook');
    return;
  }

  const today = toIsoDate();
  const { title, date } = extractNoteDate(value, today);
  store.addCard({ title, date });
  navigate('planner', { focus: true }, { replace: true });
  if (date !== today) showToast(`Додано на ${formatDayLabel(date, today)}`);
}

export const plannerScreen = {
  chrome: 'tab',
  tab: 'planner',

  render() {
    const today = toIsoDate();
    const steps = store.getSteps();
    const cards = store.getPlannerCards(today);
    const notes = cards.map((card, index) => renderNote(card, getCardProgress(card.id, steps), index)).join('');

    return `
      <section class="planner">
        <form class="quick-add" novalidate>
          <label class="quick-add__field">
            <span class="quick-add__icon" aria-hidden="true"></span>
            <input class="quick-add__input" name="text" type="text" placeholder="Що треба зробити?"
              aria-label="Що треба зробити?" autocomplete="off" enterkeyhint="done" maxlength="500">
          </label>
          <button class="quick-add__submit" type="submit" aria-label="Додати справу"></button>
        </form>
        <h1 class="planner__day">${formatDateChip(today, today)}</h1>
        ${cards.length ? `<ul class="planner__grid">${notes}</ul>` : renderEmpty('planner', 'Тут буде твоя перша справа')}
      </section>`;
  },

  mount(root, params) {
    const form = root.querySelector('.quick-add');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      addFromQuickField(form.elements.text.value);
    });
    if (params.focus) form.elements.text.focus();
  },

  actions: {
    openCard: (el) => navigate('quest', { cardId: el.dataset.cardId }),
  },
};
