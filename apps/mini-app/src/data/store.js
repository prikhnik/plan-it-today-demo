// @ts-check
import {
  getCardProgress,
  getChildSteps,
  getDayCards,
  getPlannerCards,
  shouldReopen,
  toIsoDate,
} from '@plan-it-today/shared-types';
import { createId } from '../core/id.js';
import { track } from '../core/track.js';
import { BROKEN, clearAll, readStored, writeJson } from '../core/storage.js';
import { migrateData, normalizeProfile, SCHEMA_VERSION } from './migrations.js';
import { createMockData } from './mock.js';

const PROFILE_KEY = 'profile';
const DATA_KEY = 'data';
const VERSION_KEY = 'schemaVersion';

/** @type {import('@plan-it-today/shared-types/src/types.js').UserProfile} */
const DEFAULT_PROFILE = {
  introSeen: false,
  termsAcceptedVersion: null,
  termsAcceptedAt: null,
  theme: 'system',
};

let broken = false;
let profile = loadProfile();
let data = loadData();

function loadProfile() {
  const stored = readStored(PROFILE_KEY);
  if (stored === null) return { ...DEFAULT_PROFILE };
  const valid = stored === BROKEN ? null : normalizeProfile(stored);
  broken ||= !valid;
  return valid ?? { ...DEFAULT_PROFILE };
}

/** Old records are migrated and saved; unreadable ones leave the app on the reset screen. */
function loadData() {
  const stored = readStored(DATA_KEY);
  if (stored === null) return seedData();
  const version = readStored(VERSION_KEY);
  const migrated = stored === BROKEN || version === BROKEN ? null : migrateData(stored, version);
  if (!migrated) {
    broken = true;
    return { cards: [], steps: [] };
  }
  if (version !== SCHEMA_VERSION) saveData(migrated);
  return migrated;
}

function saveData(value) {
  writeJson(DATA_KEY, value);
  writeJson(VERSION_KEY, SCHEMA_VERSION);
}

function seedData() {
  const seeded = createMockData(toIsoDate());
  saveData(seeded);
  return seeded;
}

function updateProfile(patch) {
  profile = { ...profile, ...patch };
  writeJson(PROFILE_KEY, profile);
}

function updateData(patch) {
  data = { ...data, ...patch };
  saveData(data);
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
  /** Stored data could not be read: the app shows only the reset screen. */
  isBroken: () => broken,
  getProfile: () => profile,
  markIntroSeen: () => updateProfile({ introSeen: true }),
  acceptTerms: (version) => updateProfile({ termsAcceptedVersion: version, termsAcceptedAt: new Date().toISOString() }),
  setTheme(theme) {
    updateProfile({ theme });
    track('theme_changed', { theme });
  },

  getSteps: () => data.steps,
  /** Everything the user typed: kept out of error reports. */
  getUserTexts: () => [...data.cards.map((card) => card.title), ...data.steps.map((step) => step.text)],
  getCard: (id) => data.cards.find((card) => card.id === id) ?? null,
  getPlannerCards: (today) => getPlannerCards(data.cards, today),
  getDayCards: (day) => getDayCards(data.cards, day),

  addCard({ title, date }) {
    const card = {
      id: createId(),
      title,
      date,
      status: 'active',
      source: 'manual',
      completedAt: null,
      createdAt: new Date().toISOString(),
      priority: false,
    };
    updateData({ cards: [...data.cards, card] });
    track('card_created', { future: date > toIsoDate() });
    return card;
  },

  updateCard(id, patch) {
    patchCard(id, patch);
  },

  completeCard(id) {
    patchCard(id, { status: 'done', completedAt: toIsoDate() });
    track('quest_completed', { steps: getCardProgress(id, data.steps).total });
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
    updateSteps(
      data.steps.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
      step.cardId,
    );
  },

  updateStepText(id, text) {
    updateData({ steps: data.steps.map((step) => (step.id === id ? { ...step, text } : step)) });
  },

  deleteStep(id) {
    const step = data.steps.find((item) => item.id === id);
    if (!step) return;
    updateSteps(
      data.steps.filter((item) => item.id !== id && item.parentId !== id),
      step.cardId,
    );
  },

  resetData() {
    data = seedData();
  },

  /** Removes everything stored on this device; the demo world is seeded again. */
  deleteAllData() {
    clearAll();
    broken = false;
    profile = { ...DEFAULT_PROFILE };
    data = seedData();
  },
};
