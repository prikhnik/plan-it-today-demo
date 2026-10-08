import { formatDateChip, formatDayLabel, getCardProgress, isQuest, resolveNoteDate, toIsoDate } from '@plan-it-today/shared-types';
import { renderBadge } from '../components/badge.js';
import { renderEmpty } from '../components/empty.js';
import { escapeHtml } from '../core/html.js';
import { navigate } from '../core/router.js';
import { showToast } from '../core/toast.js';
import { store } from '../data/store.js';

const PAPERS = 3;
const TILTS = 4;

function renderNote(card, progress, index) {
  const modifiers = [`paper-${(index % PAPERS) + 1}`, `tilt-${(index % TILTS) + 1}`, card.status === 'done' && 'done']
    .filter(Boolean)
    .map((modifier) => ` note--${modifier}`)
    .join('');

  return `
    <li class="planner__item">
      <button class="note${modifiers}" type="button" data-toast="Скоро">
        <span class="note__title">${escapeHtml(card.title)}</span>
        ${isQuest(progress) ? renderBadge(progress) : ''}
      </button>
    </li>`;
}

function addFromQuickField(value) {
  const title = value.trim();
  if (!title) {
    navigate('notebook');
    return;
  }

  const today = toIsoDate();
  const date = resolveNoteDate(title, today);
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
};
