// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  addMonths,
  diffDays,
  extractNoteDate,
  formatDateChip,
  formatDayLabel,
  formatMonthTitle,
  getMonthGrid,
  getMonthStart,
  getUpcomingDays,
  getWeekdayTitle,
  getWeekdayIndex,
  parseDateFromText,
  resolveNoteDate,
} from '../src/dates.js';

const TODAY = '2026-10-08';

test('8 October 2026 is Thursday', () => {
  assert.equal(getWeekdayIndex(TODAY), 3);
});

test('date arithmetic crosses months and years', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-28', 2), '2026-03-30');
  assert.equal(diffDays('2027-01-01', '2026-12-31'), 1);
});

test('no date in text means today', () => {
  assert.equal(parseDateFromText('аптека ввечері, ліки 600 грн', TODAY), null);
  assert.equal(resolveNoteDate('аптека ввечері, ліки 600 грн', TODAY), TODAY);
});

test('relative words', () => {
  assert.equal(resolveNoteDate('купити хліб сьогодні', TODAY), TODAY);
  assert.equal(resolveNoteDate('Завтра подзвонити в банк', TODAY), '2026-10-09');
  assert.equal(resolveNoteDate('післязавтра забрати посилку', TODAY), '2026-10-10');
});

test('weekday: nearest, not earlier than tomorrow', () => {
  assert.equal(resolveNoteDate('в понеділок до лікаря', TODAY), '2026-10-12');
  assert.equal(resolveNoteDate('у пт прибирання', TODAY), '2026-10-09');
  assert.equal(resolveNoteDate('в четвер зустріч', TODAY), '2026-10-15');
  assert.equal(resolveNoteDate('у середу', TODAY), '2026-10-14');
  assert.equal(resolveNoteDate('в п’ятницю', TODAY), '2026-10-09');
  assert.equal(resolveNoteDate('в неділю', TODAY), '2026-10-11');
});

test('day and month in words', () => {
  assert.equal(resolveNoteDate('15 жовтня зустріч', TODAY), '2026-10-15');
  assert.equal(resolveNoteDate('8 жовтня', TODAY), TODAY);
  assert.equal(resolveNoteDate('1 березня', TODAY), '2027-03-01');
  assert.equal(parseDateFromText('31 листопада', TODAY), null);
});

test('numeric day.month', () => {
  assert.equal(resolveNoteDate('оплата 15.10', TODAY), '2026-10-15');
  assert.equal(resolveNoteDate('оплата 07.10', TODAY), '2027-10-07');
  assert.equal(parseDateFromText('ціна 15.50 грн', TODAY), null);
  assert.equal(parseDateFromText('версія 1.2.3', TODAY), null);
});

test('in N days', () => {
  assert.equal(resolveNoteDate('через 3 дні', TODAY), '2026-10-11');
  assert.equal(resolveNoteDate('через 1 день', TODAY), '2026-10-09');
  assert.equal(resolveNoteDate('через 10 днів', TODAY), '2026-10-18');
});

test('first phrase in text wins and phrase keeps original case', () => {
  const result = parseDateFromText('Завтра або в понеділок', TODAY);
  assert.deepEqual(result, { date: '2026-10-09', phrase: 'Завтра', index: 0 });
});

test('words inside other words are ignored', () => {
  assert.equal(parseDateFromText('завтрак', TODAY), null);
  assert.equal(parseDateFromText('зустріч з Пнякою', TODAY), null);
});

test('date chip labels', () => {
  assert.equal(formatDateChip(TODAY, TODAY), 'Сьогодні, чт 8 жовтня');
  assert.equal(formatDateChip('2026-10-09', TODAY), 'Завтра, пт 9 жовтня');
  assert.equal(formatDateChip('2026-10-12', TODAY), 'пн 12 жовтня');
  assert.equal(formatDayLabel('2027-01-04', TODAY), 'пн 4 січня 2027');
});

test('month helpers', () => {
  assert.equal(getMonthStart(TODAY), '2026-10-01');
  assert.equal(addMonths('2026-12-01', 1), '2027-01-01');
  assert.equal(addMonths('2026-01-01', -1), '2025-12-01');
  assert.equal(formatMonthTitle(TODAY), 'Жовтень 2026');
});

test('month grid starts on Monday and pads with null', () => {
  const grid = getMonthGrid(TODAY);
  assert.equal(grid.length, 5);
  assert.deepEqual(grid[0], [null, null, null, '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
  assert.deepEqual(grid[4], ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', null]);
  assert.equal(getMonthGrid('2027-02-01').flat().filter(Boolean).length, 28);
});

test('upcoming days start tomorrow', () => {
  const days = getUpcomingDays(TODAY);
  assert.equal(days.length, 7);
  assert.equal(days[0], '2026-10-09');
  assert.equal(days[6], '2026-10-15');
  assert.equal(getWeekdayTitle(days[0]), 'Пт');
});

test('date phrase is removed from the title', () => {
  assert.deepEqual(extractNoteDate('зібрати речі, завтра', TODAY), { title: 'зібрати речі', date: '2026-10-09' });
  assert.deepEqual(extractNoteDate('Завтра подзвонити в банк', TODAY), {
    title: 'Подзвонити в банк',
    date: '2026-10-09',
  });
  assert.equal(extractNoteDate('купити хліб завтра ввечері', TODAY).title, 'купити хліб ввечері');
  assert.equal(extractNoteDate('аптека, у пт, ліки 600 грн', TODAY).title, 'аптека, ліки 600 грн');
  assert.equal(extractNoteDate('оплата 15.10.', TODAY).title, 'оплата');
  assert.equal(extractNoteDate('через 3 дні — забрати костюм', TODAY).title, 'забрати костюм');
});

test('note without date or with only a date keeps its text', () => {
  assert.deepEqual(extractNoteDate('  купити хліб  ', TODAY), { title: 'купити хліб', date: TODAY });
  assert.deepEqual(extractNoteDate('завтра', TODAY), { title: 'завтра', date: '2026-10-09' });
});
