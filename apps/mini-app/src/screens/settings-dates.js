import { formatDayLabel, resolveNoteDate, toIsoDate } from '@plan-it-today/shared-types';

const EXAMPLES = ['завтра', 'післязавтра', 'у пт', 'в понеділок', '15 жовтня', '15.10', 'через 3 дні'];

export const settingsDatesScreen = {
  chrome: 'nested',
  tab: 'settings',

  render() {
    const today = toIsoDate();
    const rows = EXAMPLES.map((phrase) => `
      <li class="cheatsheet__row">
        <span class="cheatsheet__phrase">«${phrase}»</span>
        <span class="cheatsheet__result">${formatDayLabel(resolveNoteDate(phrase, today), today)}</span>
      </li>`).join('');

    return `
      <section class="screen">
        <h1 class="screen__title">Як писати дату</h1>
        <p class="screen__text">Напиши дату словами прямо в нотатці, і справа стане на потрібний день.</p>
        <ul class="cheatsheet">${rows}</ul>
        <ul class="screen__list">
          <li>Без дати справа йде на сьогодні.</li>
          <li>Слово з датою прибирається з назви: «зібрати речі, завтра» стане «зібрати речі» на завтра.</li>
          <li>День тижня: найближчий, не раніше завтра.</li>
          <li>Дату видно на чипі в Записнику, її можна виправити в календарі.</li>
        </ul>
      </section>`;
  },
};
