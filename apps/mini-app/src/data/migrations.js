// @ts-check
/** @typedef {import('@plan-it-today/shared-types/src/types.js').Card} Card */
/** @typedef {import('@plan-it-today/shared-types/src/types.js').Step} Step */
/** @typedef {import('@plan-it-today/shared-types/src/types.js').UserProfile} UserProfile */
/** @typedef {{ cards: Card[], steps: Step[] }} DemoData */

/** Version of what `pit:data` holds. Records written before versioning count as 0. */
export const SCHEMA_VERSION = 1;

/** `MIGRATIONS[n]` turns data of version n - 1 into version n. */
const MIGRATIONS = {
  1: (data) => ({ ...data, cards: data.cards.map((card) => ({ ...card, priority: Boolean(card.priority) })) }),
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const THEMES = ['system', 'light', 'dark'];

/** @returns {value is Record<string, any>} */
const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isString = (value) => typeof value === 'string';
const isStringOrNull = (value) => value === null || isString(value);

/**
 * Only known fields survive; a card or step with broken required fields is dropped.
 * @param {any} card
 * @returns {Card | null}
 */
function toCard(card) {
  if (!isObject(card) || !isString(card.id) || !isString(card.title) || !ISO_DATE.test(card.date)) return null;
  if (card.status !== 'active' && card.status !== 'done') return null;
  return {
    id: card.id,
    title: card.title,
    date: card.date,
    status: card.status,
    source: card.source === 'ai' ? 'ai' : 'manual',
    completedAt: isString(card.completedAt) && ISO_DATE.test(card.completedAt) ? card.completedAt : null,
    createdAt: isString(card.createdAt) ? card.createdAt : new Date(0).toISOString(),
    priority: card.priority === true,
  };
}

/**
 * @param {any} step
 * @returns {Step | null}
 */
function toStep(step) {
  if (!isObject(step) || !isString(step.id) || !isString(step.cardId) || !isString(step.text)) return null;
  return {
    id: step.id,
    cardId: step.cardId,
    parentId: isString(step.parentId) ? step.parentId : null,
    text: step.text,
    done: step.done === true,
    order: Number.isFinite(step.order) ? step.order : 0,
  };
}

/**
 * Brings stored data to the current schema. Unknown future versions are read as the current one.
 * @param {unknown} data
 * @param {unknown} version
 * @returns {DemoData | null} null when the structure is unusable.
 */
export function migrateData(data, version) {
  if (!isObject(data) || !Array.isArray(data.cards) || !Array.isArray(data.steps)) return null;
  const from = version ?? 0;
  if (typeof from !== 'number' || !Number.isInteger(from) || from < 0) return null;

  let migrated = /** @type {any} */ (data);
  for (let next = from + 1; next <= SCHEMA_VERSION; next += 1) migrated = MIGRATIONS[next](migrated);
  return normalizeData(migrated);
}

/** @param {{ cards: unknown[], steps: unknown[] }} data */
function normalizeData(data) {
  const cards = data.cards.map(toCard).filter(Boolean);
  const cardIds = new Set(cards.map((card) => card.id));
  const steps = data.steps
    .map(toStep)
    .filter((step) => step && cardIds.has(step.cardId))
    .filter((step, _, all) => step.parentId === null || all.some((parent) => parent.id === step.parentId));
  return { cards, steps };
}

/**
 * @param {unknown} profile
 * @returns {UserProfile | null}
 */
export function normalizeProfile(profile) {
  if (!isObject(profile)) return null;
  return {
    introSeen: profile.introSeen === true,
    termsAcceptedVersion: isStringOrNull(profile.termsAcceptedVersion) ? profile.termsAcceptedVersion : null,
    termsAcceptedAt: isStringOrNull(profile.termsAcceptedAt) ? profile.termsAcceptedAt : null,
    theme: THEMES.includes(profile.theme) ? profile.theme : 'system',
  };
}
