import {
  getCardProgress,
  getChildSteps,
  getDayCards,
  getPlannerCards,
  shouldReopen,
  toIsoDate,
} from '@plan-it-today/shared-types';
import { createId } from '../core/id.js';
import { clearAll, readJson, writeJson } from '../core/storage.js';
import { createMockData } from './mock.js';

const PROFILE_KEY = 'profile';
const DATA_KEY = 'data';

/** @type {import('@plan-it-today/shared-types/src/types.js').UserProfile} */
const DEFAULT_PROFILE = {
  introSeen: false,
  termsAcceptedVersion: null,
  termsAcceptedAt: null,
  theme: 'system',
};

let profile = { ...DEFAULT_PROFILE, ...readJson(PROFILE_KEY, {}) };
let data = readJson(DATA_KEY, null) ?? seedData();

function seedData() {
  const seeded = createMockData(toIsoDate());
  writeJson(DATA_KEY, seeded);
  return seeded;
}

function updateProfile(patch) {
  profile = { ...profile, ...patch };
  writeJson(PROFILE_KEY, profile);
}

function updateData(patch) {
  data = { ...data, ...patch };
  writeJson(DATA_KEY, data);
}

function patchCard(id, patch) {
  updateData({ cards: data.cards.map((card) => (card.id === id ? { ...card, ...patch } : card)) });
}

function syncCardStatus(cardId) {
  const card = data.cards.find((item) => item.id === cardId);
  if (card && shouldReopen(card, getCardProgress(cardId, data.steps))) {
    patchCard(cardId, { status: 'active', completedAt: null });
  }
}

function updateSteps(steps, cardId) {
  updateData({ steps });
  syncCardStatus(cardId);
}

export const store = {
  getProfile: () => profile,
  markIntroSeen: () => updateProfile({ introSeen: true }),
  acceptTerms: (version) => updateProfile({ termsAcceptedVersion: version, termsAcceptedAt: new Date().toISOString() }),
  setTheme: (theme) => updateProfile({ theme }),

  getSteps: () => data.steps,
  getCard: (id) => data.cards.find((card) => card.id === id) ?? null,
  getPlannerCards: (today) => getPlannerCards(data.cards, today),
  getDayCards: (day) => getDayCards(data.cards, day),
  getCounts: () => ({ cards: data.cards.length, steps: data.steps.length }),

  addCard({ title, date }) {
    const card = {
      id: createId(),
      title,
      date,
      status: 'active',
      source: 'manual',
      completedAt: null,
      createdAt: new Date().toISOString(),
    };
    updateData({ cards: [...data.cards, card] });
    return card;
  },

  updateCard(id, patch) {
    patchCard(id, patch);
  },

  completeCard(id) {
    patchCard(id, { status: 'done', completedAt: toIsoDate() });
  },

  reopenCard(id) {
    patchCard(id, { status: 'active', completedAt: null });
  },

  deleteCard(id) {
    updateData({
      cards: data.cards.filter((card) => card.id !== id),
      steps: data.steps.filter((step) => step.cardId !== id),
    });
  },

  addStep(cardId, text, parentId = null) {
    const siblings = data.steps.filter((step) => step.cardId === cardId && step.parentId === parentId);
    const order = siblings.reduce((max, step) => Math.max(max, step.order + 1), 0);
    updateSteps([...data.steps, { id: createId(), cardId, parentId, text, done: false, order }], cardId);
  },

  toggleStep(id) {
    const step = data.steps.find((item) => item.id === id);
    if (!step || getChildSteps(data.steps, id).length > 0) return;
    updateSteps(data.steps.map((item) => (item.id === id ? { ...item, done: !item.done } : item)), step.cardId);
  },

  updateStepText(id, text) {
    updateData({ steps: data.steps.map((step) => (step.id === id ? { ...step, text } : step)) });
  },

  deleteStep(id) {
    const step = data.steps.find((item) => item.id === id);
    if (!step) return;
    updateSteps(data.steps.filter((item) => item.id !== id && item.parentId !== id), step.cardId);
  },

  resetData() {
    data = seedData();
  },

  /** Removes everything stored on this device; the demo world is seeded again. */
  deleteAllData() {
    clearAll();
    profile = { ...DEFAULT_PROFILE };
    data = seedData();
  },
};
