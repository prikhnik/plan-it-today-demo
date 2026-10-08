import { getPlannerCards, toIsoDate } from '@plan-it-today/shared-types';
import { createId } from '../core/id.js';
import { readJson, writeJson } from '../core/storage.js';
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

export const store = {
  getProfile: () => profile,
  markIntroSeen: () => updateProfile({ introSeen: true }),
  acceptTerms: (version) => updateProfile({ termsAcceptedVersion: version, termsAcceptedAt: new Date().toISOString() }),
  setTheme: (theme) => updateProfile({ theme }),

  getSteps: () => data.steps,
  getPlannerCards: (today) => getPlannerCards(data.cards, today),

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

  resetData() {
    data = seedData();
  },
};
