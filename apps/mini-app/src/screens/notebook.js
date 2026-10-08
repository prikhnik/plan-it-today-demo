import {
  addMonths,
  extractNoteDate,
  formatDateChip,
  formatDayLabel,
  getMonthStart,
  parseDateFromText,
  toIsoDate,
} from '@plan-it-today/shared-types';
import { renderCalendar } from '../components/calendar.js';
import { escapeHtml } from '../core/html.js';
import { back, navigate } from '../core/router.js';
import { showToast } from '../core/toast.js';
import { store } from '../data/store.js';

const state = { text: '', date: '', manualDate: false, recognized: false, month: '', resume: false };
let root = null;

function updateForm() {
  root.querySelector('.chip__label').textContent = formatDateChip(state.date, toIsoDate());
  root.querySelector('.notebook__fix').hidden = !state.recognized;
  root.querySelector('[data-action="add"]').disabled = state.text.trim() === '';
}

function openCalendar(month) {
  state.month = month;
  root.querySelector('.notebook__modal').innerHTML = renderCalendar({ month, selected: state.date, today: toIsoDate() });
}

function closeCalendar() {
  root.querySelector('.notebook__modal').innerHTML = '';
}

function handleInput(event) {
  state.text = event.target.value;
  if (!state.manualDate) {
    const today = toIsoDate();
    const found = parseDateFromText(state.text, today);
    state.date = found?.date ?? today;
    state.recognized = Boolean(found);
  }
  updateForm();
}

export const notebookScreen = {
  chrome: 'nested',
  tab: 'planner',

  render(params) {
    const today = toIsoDate();
    if (state.resume) state.resume = false;
    else Object.assign(state, { text: '', date: params.date ?? today, manualDate: Boolean(params.date), recognized: false });

    return `
      <section class="notebook">
        <div class="notebook__page">
          <h1 class="notebook__title">Нова справа</h1>
          <textarea class="notebook__input" rows="5" maxlength="500" aria-label="Текст справи"
            placeholder="аптека ввечері, ліки 600 грн, вітаміни 500">${escapeHtml(state.text)}</textarea>
          <div class="notebook__date">
            <button class="chip" type="button" data-action="openCalendar">
              <span class="chip__icon" aria-hidden="true"></span>
              <span class="chip__label">${formatDateChip(state.date, today)}</span>
            </button>
            <button class="notebook__fix" type="button" data-action="openCalendar"${state.recognized ? '' : ' hidden'}>виправити</button>
          </div>
          <p class="notebook__hint">Дату можна написати словами: «завтра», «у пт», «15.10».</p>
          <div class="notebook__actions">
            <button class="button button--primary" type="button" data-action="add"${state.text.trim() ? '' : ' disabled'}>Додати в планер</button>
            <button class="button button--compact" type="button" data-action="ai">
              <span class="button__icon button__icon--sparkle" aria-hidden="true"></span>
              <span class="tag">ШІ</span>
              Розписати в квест
            </button>
          </div>
          <p class="notebook__note">Без підписки: збери квест сам</p>
        </div>
        <div class="notebook__modal"></div>
      </section>`;
  },

  mount(main) {
    root = main;
    const input = root.querySelector('.notebook__input');
    input.addEventListener('input', handleInput);
    input.focus();
  },

  actions: {
    openCalendar: () => openCalendar(getMonthStart(state.date)),
    calendarPrev: () => openCalendar(addMonths(state.month, -1)),
    calendarNext: () => openCalendar(addMonths(state.month, 1)),
    calendarClose: closeCalendar,

    calendarPick(el) {
      Object.assign(state, { date: el.dataset.date, manualDate: true, recognized: false });
      closeCalendar();
      updateForm();
    },

    add() {
      if (!state.text.trim()) return;
      const today = toIsoDate();
      const title = state.recognized ? extractNoteDate(state.text, today).title : state.text.trim();
      store.addCard({ title, date: state.date });
      if (!back()) navigate('planner', {}, { reset: true });
      showToast(state.date === today ? 'Додано в планер' : `Додано на ${formatDayLabel(state.date, today)}`);
    },

    ai() {
      state.resume = true;
      navigate('ai-demo');
    },
  },
};
