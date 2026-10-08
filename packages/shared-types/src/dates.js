// @ts-check
const MS_PER_DAY = 86_400_000;

const WEEKDAYS_SHORT = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'нд'];
const WEEKDAY_NAMES = [
  ['понеділок', 'пн'],
  ['вівторок', 'вт'],
  ['середа', 'середу', 'ср'],
  ['четвер', 'чт'],
  ["п'ятниця", "п'ятницю", 'пт'],
  ['субота', 'суботу', 'сб'],
  ['неділя', 'неділю', 'нд'],
];
const MONTHS_GENITIVE = [
  'січня',
  'лютого',
  'березня',
  'квітня',
  'травня',
  'червня',
  'липня',
  'серпня',
  'вересня',
  'жовтня',
  'листопада',
  'грудня',
];

const pad = (value) => String(value).padStart(2, '0');

function toUtc(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function fromUtc(ms) {
  const date = new Date(ms);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function makeIsoDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return fromUtc(date.getTime());
}

/** Local calendar date as `YYYY-MM-DD`. */
export function toIsoDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(iso, days) {
  return fromUtc(toUtc(iso) + days * MS_PER_DAY);
}

/** Days from `from` to `to`. */
export function diffDays(to, from) {
  return Math.round((toUtc(to) - toUtc(from)) / MS_PER_DAY);
}

/** 0 = Monday … 6 = Sunday. */
export function getWeekdayIndex(iso) {
  return (new Date(toUtc(iso)).getUTCDay() + 6) % 7;
}

function nearestDayMonth(day, month, today) {
  const year = Number(today.slice(0, 4));
  const thisYear = makeIsoDate(year, month, day);
  if (thisYear && diffDays(thisYear, today) >= 0) return thisYear;
  return makeIsoDate(year + 1, month, day);
}

const L = "(?<![\\p{L}\\d'])";
const R = "(?![\\p{L}\\d'])";
const alternation = (words) => words.join('|');

const RULES = [
  {
    pattern: new RegExp(`${L}(сьогодні|післязавтра|завтра)${R}`, 'gu'),
    resolve: ([, word], today) => addDays(today, { сьогодні: 0, завтра: 1, післязавтра: 2 }[word]),
  },
  {
    pattern: new RegExp(`${L}через\\s+(\\d{1,3})\\s+(?:день|дні|днів)${R}`, 'gu'),
    resolve: ([, count], today) => addDays(today, Number(count)),
  },
  {
    pattern: new RegExp(`${L}(\\d{1,2})\\s+(${alternation(MONTHS_GENITIVE)})${R}`, 'gu'),
    resolve: ([, day, month], today) => nearestDayMonth(Number(day), MONTHS_GENITIVE.indexOf(month) + 1, today),
  },
  {
    pattern: /(?<![\d.])(\d{1,2})\.(\d{1,2})(?!\.?\d)/gu,
    resolve: ([, day, month], today) => nearestDayMonth(Number(day), Number(month), today),
  },
  {
    pattern: new RegExp(`${L}(?:(?:в|у|во)\\s+)?(${alternation(WEEKDAY_NAMES.flat())})${R}`, 'gu'),
    resolve: ([, word], today) => {
      const target = WEEKDAY_NAMES.findIndex((names) => names.includes(word));
      const delta = (target - getWeekdayIndex(today) + 7) % 7 || 7;
      return addDays(today, delta);
    },
  },
];

const normalize = (text) => text.toLowerCase().replace(/[’ʼ`]/g, "'");

/**
 * Finds the first date phrase in a note (rules of spec section 7).
 * @param {string} text
 * @param {string} today ISO date.
 * @returns {{ date: string, phrase: string, index: number } | null}
 */
export function parseDateFromText(text, today) {
  const source = normalize(text);
  let best = null;

  for (const rule of RULES) {
    for (const match of source.matchAll(rule.pattern)) {
      const date = rule.resolve(match, today);
      if (!date) continue;
      const isEarlier = !best || match.index < best.index;
      const isLongerAtSameIndex = best && match.index === best.index && match[0].length > best.phrase.length;
      if (isEarlier || isLongerAtSameIndex) {
        best = { date, phrase: text.slice(match.index, match.index + match[0].length), index: match.index };
      }
      break;
    }
  }

  return best;
}

/** Date of a note: from its text, otherwise today. */
export function resolveNoteDate(text, today) {
  return parseDateFromText(text, today)?.date ?? today;
}

const SEPARATORS_END = /[\s,;:.—–-]+$/u;
const SEPARATORS_START = /^[\s,;:.—–-]+/u;

/**
 * Splits a note into a title without the date phrase and the plan date.
 * «зібрати речі, завтра» → { title: «зібрати речі», date: tomorrow }.
 * A note that is only a date phrase keeps its text.
 */
export function extractNoteDate(text, today) {
  const trimmed = text.trim();
  const found = parseDateFromText(trimmed, today);
  if (!found) return { title: trimmed, date: today };

  const before = trimmed.slice(0, found.index);
  const after = trimmed.slice(found.index + found.phrase.length);
  const head = before.replace(SEPARATORS_END, '');
  const tail = after.replace(SEPARATORS_START, '');
  const separators = (before.match(SEPARATORS_END)?.[0] ?? '') + (after.match(SEPARATORS_START)?.[0] ?? '');
  const joiner = head && tail ? (separators.includes(',') ? ', ' : ' ') : '';
  let title = `${head}${joiner}${tail}`;

  if (!title) return { title: trimmed, date: found.date };
  if (trimmed[0] !== trimmed[0].toLowerCase()) title = title[0].toUpperCase() + title.slice(1);
  return { title, date: found.date };
}

/** «чт 8 жовтня», with the year when it differs from today. */
export function formatDayLabel(iso, today) {
  const [year, month, day] = iso.split('-').map(Number);
  const label = `${WEEKDAYS_SHORT[getWeekdayIndex(iso)]} ${day} ${MONTHS_GENITIVE[month - 1]}`;
  return today && today.slice(0, 4) !== String(year) ? `${label} ${year}` : label;
}

/** «Сьогодні, чт 8 жовтня» / «Завтра, пт 9 жовтня» / «пн 12 жовтня». */
export function formatDateChip(iso, today) {
  const label = formatDayLabel(iso, today);
  const offset = diffDays(iso, today);
  if (offset === 0) return `Сьогодні, ${label}`;
  if (offset === 1) return `Завтра, ${label}`;
  return label;
}

const MONTHS_NOMINATIVE = [
  'Січень',
  'Лютий',
  'Березень',
  'Квітень',
  'Травень',
  'Червень',
  'Липень',
  'Серпень',
  'Вересень',
  'Жовтень',
  'Листопад',
  'Грудень',
];

export const WEEKDAY_TITLES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

/** First day of the month, ISO. */
export function getMonthStart(iso) {
  return `${iso.slice(0, 7)}-01`;
}

export function addMonths(iso, months) {
  const [year, month] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, 1));
  return fromUtc(date.getTime());
}

/** «Жовтень 2026». */
export function formatMonthTitle(iso) {
  const [year, month] = iso.split('-').map(Number);
  return `${MONTHS_NOMINATIVE[month - 1]} ${year}`;
}

/**
 * Weeks of the month starting on Monday; days outside the month are null.
 * @returns {(string | null)[][]}
 */
export function getMonthGrid(iso) {
  const start = getMonthStart(iso);
  const [year, month] = start.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = Array(getWeekdayIndex(start)).fill(null);
  for (let day = 0; day < daysInMonth; day += 1) cells.push(addDays(start, day));
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7));
}

/** Days after today for the «Майбутнє» strip. */
export function getUpcomingDays(today, count = 7) {
  return Array.from({ length: count }, (_, index) => addDays(today, index + 1));
}

/** «Пт» for the week strip. */
export const getWeekdayTitle = (iso) => WEEKDAY_TITLES[getWeekdayIndex(iso)];
