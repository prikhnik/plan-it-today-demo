import {
  addDays,
  addMonths,
  formatDayLabel,
  getCardProgress,
  getMonthStart,
  getUpcomingDays,
  getWeekdayTitle,
  isQuest,
  toIsoDate,
} from '@plan-it-today/shared-types';
import { renderBadge } from '../components/badge.js';
import { renderCalendar } from '../components/calendar.js';
import { renderEmpty } from '../components/empty.js';
import { escapeHtml } from '../core/html.js';
import { navigate } from '../core/router.js';
import { store } from '../data/store.js';

const state = { date: '', month: '' };
let root = null;

const getTomorrow = () => addDays(toIsoDate(), 1);

function renderWeek(selected) {
  const days = getUpcomingDays(toIsoDate()).map((date) => {
    const isSelected = date === selected;
    return `
      <li class="week__item">
        <button class="week__day${isSelected ? ' week__day--selected' : ''}" type="button"
          data-action="selectDay" data-date="${date}" aria-pressed="${isSelected}">
          <span class="week__weekday">${getWeekdayTitle(date)}</span>
          <span class="week__number">${Number(date.slice(8))}</span>
        </button>
      </li>`;
  }).join('');

  return `
    <div class="week">
      <ol class="week__days">${days}</ol>
      <button class="week__calendar" type="button" data-action="openCalendar" aria-label="Обрати дату в календарі"></button>
    </div>`;
}

function renderRow(card, steps) {
  const progress = getCardProgress(card.id, steps);
  return `
    <li class="day-list__item">
      <button class="day-row" type="button" data-action="openCard" data-card-id="${card.id}">
        <span class="day-row__title">${escapeHtml(card.title)}</span>
        ${isQuest(progress) ? renderBadge(progress) : ''}
        <span class="day-row__chevron" aria-hidden="true"></span>
      </button>
    </li>`;
}

function openCalendar(month) {
  state.month = month;
  root.querySelector('.future__modal').innerHTML = renderCalendar({
    month,
    selected: state.date,
    today: toIsoDate(),
    min: getTomorrow(),
  });
}

const selectDate = (date) => navigate('future', { date }, { replace: true });

export const futureScreen = {
  chrome: 'tab',
  tab: 'future',

  render(params) {
    const tomorrow = getTomorrow();
    state.date = params.date && params.date >= tomorrow ? params.date : tomorrow;
    const cards = store.getDayCards(state.date);
    const steps = store.getSteps();
    const list = cards.length
      ? `<ul class="day-list">${cards.map((card) => renderRow(card, steps)).join('')}</ul>`
      : renderEmpty('future', 'На цей день справ немає');

    return `
      <section class="future">
        ${renderWeek(state.date)}
        <h1 class="future__title">План на ${formatDayLabel(state.date, toIsoDate())}</h1>
        ${list}
        <button class="add-row" type="button" data-action="addCard">+ Додати справу</button>
        <p class="future__note">Плануй лише сьогодні. Решта почекає.</p>
        <div class="future__modal"></div>
      </section>`;
  },

  mount(main) {
    root = main;
  },

  actions: {
    selectDay: (el) => selectDate(el.dataset.date),
    openCard: (el) => navigate('quest', { cardId: el.dataset.cardId, tab: 'future' }),
    addCard: () => navigate('notebook', { date: state.date, tab: 'future' }),
    openCalendar: () => openCalendar(getMonthStart(state.date)),
    calendarPrev: () => openCalendar(addMonths(state.month, -1)),
    calendarNext: () => openCalendar(addMonths(state.month, 1)),
    calendarClose: () => {
      root.querySelector('.future__modal').innerHTML = '';
    },
    calendarPick: (el) => selectDate(el.dataset.date),
  },
};
