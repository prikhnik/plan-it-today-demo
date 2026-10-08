import {
  addMonths,
  canFinishQuest,
  canMarkNoteDone,
  formatDateChip,
  formatDayLabel,
  getCardProgress,
  getChildSteps,
  getMonthStart,
  getStepProgress,
  getTopLevelSteps,
  isQuest,
  toIsoDate,
} from '@plan-it-today/shared-types';
import { renderCalendar } from '../components/calendar.js';
import { escapeHtml } from '../core/html.js';
import { back, navigate } from '../core/router.js';
import { showToast } from '../core/toast.js';
import { haptic } from '../core/telegram.js';
import { store } from '../data/store.js';

const STEP_MAX_LENGTH = 80;
const TITLE_MAX_LENGTH = 500;

const state = { cardId: null, adding: false, stepId: null, draft: null, month: '' };
let root = null;

const getCard = () => store.getCard(state.cardId);
const getStep = () => store.getSteps().find((step) => step.id === state.stepId);

function getSubtitle(card, progress, today) {
  if (card.status === 'done') return 'Виконано';
  const kind = isQuest(progress) ? 'Квест' : 'Нотатка';
  return card.date <= today ? `${kind} на сьогодні` : `${kind} на ${formatDayLabel(card.date, today)}`;
}

function getBoxState(step, steps) {
  const children = getChildSteps(steps, step.id);
  if (children.length === 0) return step.done ? 'checked' : 'empty';
  const { done, total } = getStepProgress(step, steps);
  if (done === total) return 'checked';
  return done > 0 ? 'partial' : 'empty';
}

function renderStep(step, steps, isChild) {
  const children = isChild ? [] : getChildSteps(steps, step.id);
  const box = getBoxState(step, steps);
  const isDone = box === 'checked';
  const content = `
    <span class="step__box step__box--${box}" aria-hidden="true"></span>
    <span class="step__text">${escapeHtml(step.text)}</span>`;
  const toggle = children.length > 0
    ? `<div class="step__toggle step__toggle--parent">${content}</div>`
    : `<button class="step__toggle" type="button" data-action="toggleStep" data-step-id="${step.id}" aria-pressed="${isDone}">${content}</button>`;
  const childList = children.length > 0
    ? `<ul class="checklist checklist--children">${children.map((child) => renderStep(child, steps, true)).join('')}</ul>`
    : '';

  return `
    <li class="checklist__item${isChild ? ' checklist__item--child' : ''}">
      <div class="step${isDone ? ' step--done' : ''}">
        ${toggle}
        <button class="step__more" type="button" data-action="stepMenu" data-step-id="${step.id}" aria-label="Дії з кроком"></button>
      </div>
      ${childList}
    </li>`;
}

function renderAddStep() {
  if (!state.adding) {
    return '<button class="add-row" type="button" data-action="showAddStep">+ Додати крок</button>';
  }
  return `
    <form class="quest__add-form" data-form="addStep">
      <input class="quest__add-input" name="text" type="text" maxlength="${STEP_MAX_LENGTH}"
        placeholder="Крок у 3-5 слів" aria-label="Новий крок" autocomplete="off" enterkeyhint="done">
      <button class="quest__add-submit" type="submit" aria-label="Додати крок"></button>
    </form>`;
}

function renderFinish(card, progress) {
  if (card.status === 'done') {
    return '<button class="button" type="button" data-action="reopen">Повернути в план</button>';
  }
  if (!isQuest(progress)) {
    return '<button class="button button--primary" type="button" data-action="finish">Готово</button>';
  }
  return `<button class="button button--primary" type="button" data-action="finish"${canFinishQuest(progress) ? '' : ' disabled'}>Завершити квест</button>`;
}

function renderQuest() {
  const card = getCard();
  if (!card) {
    return `
      <section class="quest">
        <p class="quest__missing">Цієї картки вже немає.</p>
        <button class="button" type="button" data-nav="planner" data-nav-reset>До планера</button>
      </section>`;
  }

  const today = toIsoDate();
  const steps = store.getSteps();
  const progress = getCardProgress(card.id, steps);
  const ratio = progress.total ? progress.done / progress.total : 0;
  const items = getTopLevelSteps(steps, card.id).map((step) => renderStep(step, steps, false)).join('');

  return `
    <section class="quest${card.status === 'done' ? ' quest--done' : ''}">
      <header class="quest__header">
        <div class="quest__banner">
          <h1 class="quest__title">${escapeHtml(card.title)}</h1>
        </div>
        <button class="quest__edit" type="button" data-action="editCard" aria-label="Редагувати картку"></button>
      </header>
      <p class="quest__subtitle">${getSubtitle(card, progress, today)}</p>
      <div class="progress" style="--progress: ${ratio}">
        <span class="progress__bar"><span class="progress__fill"></span></span>
        <span class="progress__label">${progress.done} з ${progress.total}</span>
      </div>
      ${items ? `<ul class="checklist">${items}</ul>` : ''}
      ${renderAddStep()}
      <div class="quest__finish">${renderFinish(card, progress)}</div>
      <div class="quest__modal"></div>
    </section>`;
}

function renderStepMenu(step) {
  const canAddChild = !step.parentId;
  return `
    <div class="modal">
      <button class="modal__backdrop" type="button" data-action="closeModal" aria-label="Закрити"></button>
      <div class="modal__panel sheet" role="dialog" aria-modal="true" aria-label="Дії з кроком">
        <p class="sheet__title">${escapeHtml(step.text)}</p>
        ${canAddChild ? '<button class="sheet__action" type="button" data-action="addChild">Додати підпункт</button>' : ''}
        <button class="sheet__action" type="button" data-action="editStep">Редагувати</button>
        <button class="sheet__action sheet__action--danger" type="button" data-action="deleteStep">Видалити</button>
      </div>
    </div>`;
}

function renderStepEditor({ title, value }) {
  return `
    <div class="modal">
      <button class="modal__backdrop" type="button" data-action="closeModal" aria-label="Закрити"></button>
      <form class="modal__panel sheet" data-form="saveStep" role="dialog" aria-modal="true" aria-label="${title}">
        <p class="sheet__title">${title}</p>
        <input class="sheet__input" name="text" type="text" maxlength="${STEP_MAX_LENGTH}" value="${escapeHtml(value)}"
          placeholder="Крок у 3-5 слів" aria-label="Текст кроку" autocomplete="off" enterkeyhint="done">
        <button class="button button--primary" type="submit">Зберегти</button>
        <button class="sheet__action" type="button" data-action="closeModal">Скасувати</button>
      </form>
    </div>`;
}

function renderCardEditor() {
  const { title, date, confirmDelete } = state.draft;
  const footer = confirmDelete
    ? `
      <p class="sheet__warning">Видалити картку разом із кроками?</p>
      <button class="button" type="button" data-action="deleteCard">Так, видалити</button>
      <button class="sheet__action" type="button" data-action="cancelDelete">Ні, залишити</button>`
    : `
      <button class="button button--primary" type="submit">Зберегти</button>
      <button class="sheet__action sheet__action--danger" type="button" data-action="askDelete">Видалити картку</button>`;

  return `
    <div class="modal">
      <button class="modal__backdrop" type="button" data-action="closeModal" aria-label="Закрити"></button>
      <form class="modal__panel sheet" data-form="saveCard" role="dialog" aria-modal="true" aria-label="Редагування картки">
        <p class="sheet__title">Редагування</p>
        <textarea class="sheet__input sheet__input--multiline" name="title" rows="3" maxlength="${TITLE_MAX_LENGTH}"
          aria-label="Назва">${escapeHtml(title)}</textarea>
        <button class="chip sheet__chip" type="button" data-action="openCalendar">
          <span class="chip__icon" aria-hidden="true"></span>
          <span class="chip__label">${formatDateChip(date, toIsoDate())}</span>
        </button>
        ${footer}
      </form>
    </div>`;
}

const FORM_HANDLERS = {
  addStep(form) {
    const text = form.elements.text.value.trim();
    if (text) store.addStep(state.cardId, text);
    else state.adding = false;
    refresh();
  },

  saveStep(form) {
    const text = form.elements.text.value.trim();
    if (!text) return;
    if (state.draft?.mode === 'child') store.addStep(state.cardId, text, state.stepId);
    else store.updateStepText(state.stepId, text);
    closeModal();
    refresh();
  },

  saveCard(form) {
    const title = form.elements.title.value.trim();
    if (!title) return;
    store.updateCard(state.cardId, { title, date: state.draft.date });
    closeModal();
    refresh();
  },
};

function bindForms(container) {
  container.querySelectorAll('[data-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      FORM_HANDLERS[form.dataset.form](form);
    });
  });
}

function openModal(html) {
  const modal = root.querySelector('.quest__modal');
  modal.innerHTML = html;
  bindForms(modal);
  const title = modal.querySelector('[name="title"]');
  title?.addEventListener('input', () => {
    state.draft.title = title.value;
  });
  modal.querySelector('.sheet__input')?.focus();
}

function closeModal() {
  root.querySelector('.quest__modal').innerHTML = '';
}

function refresh() {
  root.innerHTML = renderQuest();
  bindForms(root);
  if (state.adding) root.querySelector('.quest__add-input')?.focus();
}

function openCalendar(month) {
  state.month = month;
  openModal(renderCalendar({ month, selected: state.draft.date, today: toIsoDate() }));
}

export const questScreen = {
  chrome: 'nested',
  tab: 'planner',

  render(params) {
    Object.assign(state, { cardId: params.cardId, adding: false, stepId: null, draft: null });
    return renderQuest();
  },

  mount(main) {
    root = main;
    bindForms(root);
  },

  actions: {
    toggleStep(el) {
      store.toggleStep(el.dataset.stepId);
      haptic('light');
      refresh();
    },

    showAddStep() {
      state.adding = true;
      refresh();
    },

    stepMenu(el) {
      state.stepId = el.dataset.stepId;
      openModal(renderStepMenu(getStep()));
    },

    addChild() {
      state.draft = { mode: 'child' };
      openModal(renderStepEditor({ title: 'Новий підпункт', value: '' }));
    },

    editStep() {
      state.draft = { mode: 'edit' };
      openModal(renderStepEditor({ title: 'Редагувати крок', value: getStep().text }));
    },

    deleteStep() {
      store.deleteStep(state.stepId);
      closeModal();
      refresh();
    },

    editCard() {
      const card = getCard();
      state.draft = { title: card.title, date: card.date < toIsoDate() ? toIsoDate() : card.date, confirmDelete: false };
      openModal(renderCardEditor());
    },

    openCalendar: () => openCalendar(getMonthStart(state.draft.date)),
    calendarPrev: () => openCalendar(addMonths(state.month, -1)),
    calendarNext: () => openCalendar(addMonths(state.month, 1)),
    calendarClose: () => openModal(renderCardEditor()),

    calendarPick(el) {
      state.draft.date = el.dataset.date;
      openModal(renderCardEditor());
    },

    askDelete() {
      state.draft.confirmDelete = true;
      openModal(renderCardEditor());
    },

    cancelDelete() {
      state.draft.confirmDelete = false;
      openModal(renderCardEditor());
    },

    deleteCard() {
      store.deleteCard(state.cardId);
      if (!back()) navigate('planner', {}, { reset: true });
      showToast('Картку видалено');
    },

    closeModal,

    finish() {
      const progress = getCardProgress(state.cardId, store.getSteps());
      if (!canFinishQuest(progress) && !canMarkNoteDone(progress)) return;
      store.completeCard(state.cardId);
      haptic('success');
      if (!back()) navigate('planner', {}, { reset: true });
      showToast(isQuest(progress) ? 'Квест завершено' : 'Справу виконано');
    },

    reopen() {
      store.reopenCard(state.cardId);
      refresh();
    },
  },
};
