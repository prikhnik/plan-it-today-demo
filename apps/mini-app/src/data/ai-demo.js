/**
 * AI assistant demo (spec 6.7): separate mock world, never written to the user's cards.
 * Times are milliseconds from «Почати».
 */
export const AI_DEMO = {
  note: 'приготувати вечерю',
  title: 'Приготувати вечерю',
  steps: [
    { id: 'list', text: 'Написати список' },
    { id: 'shop', text: 'Сходити в магазин', children: [{ id: 'products', text: 'Список продуктів' }] },
    { id: 'cook', text: 'Приготувати' },
  ],
  checkOrder: ['list', 'products', 'cook'],
  rename: { id: 'cook', text: 'Приготувати пасту' },
  captions: {
    intro: 'Так працює ШІ-помічник',
    typing: 'Ти пишеш справу як звичайно',
    pressing: 'Натискаєш «Розписати в квест»',
    drawing: 'Помічник розбиває справу на кроки',
    quest: 'Квест готовий: прості кроки по 3-5 слів',
    checking: 'Відмічаєш кроки, прогрес росте',
    editing: 'Будь-який крок можна виправити',
  },
  timeline: {
    typingStart: 5000,
    typingStep: 260,
    press: 12000,
    pressed: 13500,
    drawStart: 15000,
    drawStep: 1600,
    questShown: 24000,
    checkStart: 30000,
    checkStep: 4000,
    edit: 45000,
    renamed: 48500,
    finish: 55000,
  },
};
