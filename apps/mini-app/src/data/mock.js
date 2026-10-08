import { addDays } from '@plan-it-today/shared-types';
import { createId } from '../core/id.js';

const step = (text, done = false, children = []) => ({ text, done, children });

/** `day` is relative to today; order defines «newest first» on the planner. */
export const MOCK_CARDS = [
  {
    title: 'Аптека ввечері',
    day: 0,
    steps: [
      step('Купити ліки — 600 грн', true),
      step('Купити вітаміни — 500 грн', true),
      step('Взяти картку'),
      step('Піти ввечері'),
    ],
  },
  {
    title: 'Подзвонити в банк',
    day: 0,
    steps: [step('Знайти номер'), step('Підготувати паспорт'), step('Подзвонити')],
  },
  { title: 'Забрати посилку', day: 0 },
  { title: 'Купити хліб', day: 0 },
  {
    title: 'Прибирання',
    day: 0,
    steps: [
      step('Кухня', false, [step('Посуд', true), step('Плита')]),
      step('Ванна', false, [step('Раковина'), step('Унітаз')]),
      step('Кімната', false, [step('Пропилососити'), step('Витерти пил')]),
      step('Помити підлогу'),
    ],
  },
  {
    title: 'Подзвонити рідним',
    day: -1,
    steps: [step('Подзвонити мамі', true), step('Подзвонити сестрі')],
  },
  { title: 'Додати квести на завтра', day: 0 },
  {
    title: 'Робочі таски',
    day: 0,
    done: true,
    steps: [
      step('Допрацювати демо перед показом'),
      step('Дзвінок по проєкту о 14:00'),
      step('Фіналізувати специфікації'),
    ],
  },
  {
    title: 'Приготувати вечерю',
    day: 1,
    steps: [step('Написати список'), step('Сходити в магазин', false, [step('Список продуктів')]), step('Приготувати')],
  },
  {
    title: 'Записатися до лікаря',
    day: 3,
    steps: [step('Знайти телефон'), step('Подзвонити, домовитися про час'), step('Додати квест на потрібну дату')],
  },
];

/**
 * Builds cards and steps with dates relative to `today`, so the demo never goes stale.
 * @param {string} today ISO date.
 */
export function createMockData(today, now = Date.now()) {
  const cards = [];
  const steps = [];

  const addSteps = (list, cardId, parentId, forceDone) => {
    list.forEach(({ text, done, children }, order) => {
      const id = createId();
      steps.push({ id, cardId, parentId, text, done: forceDone || (children.length === 0 && done), order });
      addSteps(children, cardId, id, forceDone);
    });
  };

  MOCK_CARDS.forEach((mock, index) => {
    const id = createId();
    cards.push({
      id,
      title: mock.title,
      date: addDays(today, mock.day),
      status: mock.done ? 'done' : 'active',
      source: 'manual',
      completedAt: mock.done ? today : null,
      createdAt: new Date(now - index * 60_000).toISOString(),
    });
    addSteps(mock.steps ?? [], id, null, Boolean(mock.done));
  });

  return { cards, steps };
}
