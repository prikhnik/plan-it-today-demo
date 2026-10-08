import { readJson, writeJson } from '../core/storage.js';

const PROFILE_KEY = 'profile';

/** @type {import('@plan-it-today/shared-types/src/types.js').UserProfile} */
const DEFAULT_PROFILE = {
  introSeen: false,
  termsAcceptedVersion: null,
  termsAcceptedAt: null,
  theme: 'system',
};

let profile = { ...DEFAULT_PROFILE, ...readJson(PROFILE_KEY, {}) };

function updateProfile(patch) {
  profile = { ...profile, ...patch };
  writeJson(PROFILE_KEY, profile);
}

export const store = {
  getProfile: () => profile,
  markIntroSeen: () => updateProfile({ introSeen: true }),
  acceptTerms: (version) => updateProfile({ termsAcceptedVersion: version, termsAcceptedAt: new Date().toISOString() }),
  setTheme: (theme) => updateProfile({ theme }),
};
