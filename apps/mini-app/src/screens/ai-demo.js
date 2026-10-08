// @ts-check
import { back } from '../core/router.js';
import { AI_DEMO } from '../data/ai-demo.js';

const { note, title, steps, checkOrder, rename, captions, timeline } = AI_DEMO;
const DRAW_ORDER = steps.flatMap((step) => [step.id, ...(step.children ?? []).map((child) => child.id)]);

const state = {};
let root = null;
let timers = [];

function reset(stage) {
  Object.assign(state, {
    stage,
    phase: 'intro',
    typed: '',
    pressed: false,
    drawn: 0,
    checked: new Set(),
    renamed: false,
  });
}

function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

function set(patch) {
  Object.assign(state, patch);
  root.innerHTML = renderBody();
}

const at = (ms, fn) => timers.push(setTimeout(fn, ms));

function play() {
  clearTimers();
  reset('run');
  set({});
  at(timeline.typingStart, () => set({ phase: 'typing' }));
  [...note].forEach((_, index) => {
    at(timeline.typingStart + (index + 1) * timeline.typingStep, () => set({ typed: note.slice(0, index + 1) }));
  });
  at(timeline.press, () => set({ phase: 'pressing' }));
  at(timeline.pressed, () => set({ pressed: true }));
  at(timeline.drawStart, () => set({ phase: 'drawing' }));
  DRAW_ORDER.forEach((_, index) => {
    at(timeline.drawStart + (index + 1) * timeline.drawStep, () => set({ drawn: index + 1 }));
  });
  at(timeline.questShown, () => set({ phase: 'quest' }));
  checkOrder.forEach((id, index) => {
    at(timeline.checkStart + index * timeline.checkStep, () => {
      state.checked.add(id);
      set({ phase: 'checking' });
    });
  });
  at(timeline.edit, () => set({ phase: 'editing' }));
  at(timeline.renamed, () => set({ renamed: true }));
  at(timeline.finish, () => set({ stage: 'finish' }));
}

function isDone(step) {
  const children = step.children ?? [];
  return children.length ? children.every((child) => state.checked.has(child.id)) : state.checked.has(step.id);
}

function renderStep(step, isChild) {
  const order = DRAW_ORDER.indexOf(step.id);
  if (order >= state.drawn) return '';
  const done = isDone(step);
  const text = state.renamed && step.id === rename.id ? rename.text : step.text;
  const modifiers = [
    done && ' step--done',
    state.phase === 'drawing' && order === state.drawn - 1 && ' ai-demo__step--drawing',
    state.renamed && step.id === rename.id && ' ai-demo__step--renamed',
  ]
    .filter(Boolean)
    .join('');
  const children = (step.children ?? []).map((child) => renderStep(child, true)).join('');

  return `
    <li class="checklist__item${isChild ? ' checklist__item--child' : ''}">
      <div class="step${modifiers}">
        <div class="step__toggle">
          <span class="step__box step__box--${done ? 'checked' : 'empty'}" aria-hidden="true"></span>
          <span class="step__text">${text}</span>
        </div>
      </div>
      ${children ? `<ul class="checklist checklist--children">${children}</ul>` : ''}
    </li>`;
}

function renderNotebook() {
  return `
    <div class="notebook__page ai-demo__notebook">
      <p class="notebook__title">Нова справа</p>
      <p class="ai-demo__typed">${state.typed}<span class="ai-demo__caret" aria-hidden="true"></span></p>
      <span class="button button--compact${state.pressed ? ' button--primary ai-demo__press--pressed' : ''}${state.phase === 'pressing' ? ' ai-demo__press' : ''}">
        <span class="button__icon button__icon--sparkle" aria-hidden="true"></span>
        <span class="tag">ШІ</span>
        Розписати в квест
      </span>
    </div>`;
}

function renderQuest() {
  const done = steps.filter(isDone).length;
  const items = steps.map((step) => renderStep(step, false)).join('');
  return `
    <div class="quest ai-demo__quest">
      <header class="quest__header">
        <div class="quest__banner"><p class="quest__title">${title}</p></div>
      </header>
      <p class="quest__subtitle">Квест на сьогодні</p>
      <div class="progress" data-progress="${done / steps.length}">
        <span class="progress__bar"><span class="progress__fill"></span></span>
        <span class="progress__label">${done} з ${steps.length}</span>
      </div>
      <ul class="checklist">${items}</ul>
      <span class="button ai-demo__edit-button${state.phase === 'editing' ? ' ai-demo__edit' : ''}" aria-hidden="true">Редагувати</span>
    </div>`;
}

function renderStage() {
  if (state.phase === 'intro') {
    return '<div class="ai-demo__illustration ai-demo__illustration--intro" aria-hidden="true"></div>';
  }
  return state.phase === 'typing' || state.phase === 'pressing' ? renderNotebook() : renderQuest();
}

function renderCard({ modifier, heading, text, actions }) {
  return `
    <section class="ai-demo ai-demo--card">
      <div class="ai-demo__illustration ai-demo__illustration--${modifier}" aria-hidden="true"></div>
      <h1 class="ai-demo__heading">${heading}</h1>
      <p class="ai-demo__text">${text}</p>
      <div class="ai-demo__actions">${actions}</div>
    </section>`;
}

function renderBody() {
  if (state.stage === 'start') {
    return renderCard({
      modifier: 'intro',
      heading: 'Демо ШІ-помічника',
      text: 'Хвилина показу: помічник сам розбиває справу на кроки. Твої картки не зміняться.',
      actions: `
        <button class="button button--primary" type="button" data-action="start">Почати</button>
        <button class="button" type="button" data-back>Скасувати</button>`,
    });
  }

  if (state.stage === 'finish') {
    return renderCard({
      modifier: 'finish',
      heading: 'Це робитиме ШІ-помічник за підпискою',
      text: 'Поки що квест збирається вручну: відкрий картку й додай кроки.',
      actions: `
        <button class="button button--primary" type="button" data-action="start">Запустити ще раз</button>
        <button class="button" type="button" data-action="exit">Вийти</button>`,
    });
  }

  return `
    <section class="ai-demo">
      <div class="ai-demo__bar">
        <p class="ai-demo__caption" aria-live="polite">${captions[state.phase]}</p>
        <button class="ai-demo__skip" type="button" data-action="skip">Пропустити</button>
      </div>
      <div class="ai-demo__stage">${renderStage()}</div>
    </section>`;
}

export const aiDemoScreen = {
  chrome: 'fullscreen',

  render() {
    reset('start');
    return renderBody();
  },

  mount(main) {
    root = main;
  },

  unmount: clearTimers,

  actions: {
    start: play,
    skip() {
      clearTimers();
      set({ stage: 'finish' });
    },
    exit: () => back(),
  },
};
