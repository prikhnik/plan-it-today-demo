import { WEEKDAY_TITLES, formatMonthTitle, getMonthGrid, getMonthStart } from '@plan-it-today/shared-types';

function renderDay(date, { selected, today, min }) {
  if (!date) return '<span class="calendar__day calendar__day--empty"></span>';
  const modifiers = [date === today && 'today', date === selected && 'selected']
    .filter(Boolean)
    .map((modifier) => ` calendar__day--${modifier}`)
    .join('');
  return `<button class="calendar__day${modifiers}" type="button" data-action="calendarPick" data-date="${date}"${date < min ? ' disabled' : ''}>${Number(date.slice(8))}</button>`;
}

/**
 * Month picker in a modal. Days before `min` (today by default) are disabled.
 * Actions: calendarPrev, calendarNext, calendarPick (data-date), calendarClose.
 */
export function renderCalendar({ month, selected, today, min = today }) {
  const canGoBack = month > getMonthStart(min);
  const days = getMonthGrid(month).flat().map((date) => renderDay(date, { selected, today, min })).join('');
  const weekdays = WEEKDAY_TITLES.map((title) => `<span class="calendar__weekday">${title}</span>`).join('');

  return `
    <div class="modal">
      <button class="modal__backdrop" type="button" data-action="calendarClose" aria-label="Закрити календар"></button>
      <div class="modal__panel calendar" role="dialog" aria-modal="true" aria-label="Вибір дати">
        <div class="calendar__header">
          <button class="calendar__nav calendar__nav--prev" type="button" data-action="calendarPrev" aria-label="Попередній місяць"${canGoBack ? '' : ' disabled'}></button>
          <span class="calendar__title">${formatMonthTitle(month)}</span>
          <button class="calendar__nav" type="button" data-action="calendarNext" aria-label="Наступний місяць"></button>
        </div>
        <div class="calendar__weekdays">${weekdays}</div>
        <div class="calendar__grid">${days}</div>
      </div>
    </div>`;
}
