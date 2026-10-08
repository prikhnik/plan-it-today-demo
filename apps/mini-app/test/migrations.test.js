// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrateData, normalizeProfile, SCHEMA_VERSION } from '../src/data/migrations.js';

const legacyCard = {
  id: 'c1',
  title: 'Купити хліб',
  date: '2026-10-08',
  status: 'active',
  source: 'manual',
  completedAt: null,
  createdAt: '2026-10-08T09:00:00.000Z',
};
const step = { id: 's1', cardId: 'c1', parentId: null, text: 'Взяти гроші', done: false, order: 0 };

test('records without a schema version get priority false', () => {
  const data = migrateData({ cards: [legacyCard], steps: [step] }, null);
  assert.equal(data.cards[0].priority, false);
  assert.deepEqual(data.steps, [step]);
});

test('current version keeps priority as stored', () => {
  const data = migrateData({ cards: [{ ...legacyCard, priority: true }], steps: [] }, SCHEMA_VERSION);
  assert.equal(data.cards[0].priority, true);
});

test('unknown fields are dropped', () => {
  const data = migrateData(
    { cards: [{ ...legacyCard, color: 'red' }], steps: [{ ...step, extra: 1 }], junk: true },
    SCHEMA_VERSION,
  );
  assert.deepEqual(Object.keys(data), ['cards', 'steps']);
  assert.equal('color' in data.cards[0], false);
  assert.equal('extra' in data.steps[0], false);
});

test('broken cards and orphan steps are dropped, the rest stays', () => {
  const data = migrateData(
    {
      cards: [legacyCard, { id: 'c2', title: 5 }, null, { ...legacyCard, id: 'c3', date: 'завтра' }],
      steps: [step, { ...step, id: 's2', cardId: 'missing' }, { ...step, id: 's3', parentId: 'missing' }],
    },
    1,
  );
  assert.deepEqual(
    data.cards.map((card) => card.id),
    ['c1'],
  );
  assert.deepEqual(
    data.steps.map((item) => item.id),
    ['s1'],
  );
});

test('unusable structure returns null', () => {
  assert.equal(migrateData(null, 1), null);
  assert.equal(migrateData('text', 1), null);
  assert.equal(migrateData({ cards: {}, steps: [] }, 1), null);
  assert.equal(migrateData({ cards: [], steps: [] }, 'one'), null);
  assert.equal(migrateData({ cards: [], steps: [] }, -1), null);
});

test('a newer schema version is read as the current one', () => {
  const data = migrateData({ cards: [{ ...legacyCard, priority: true }], steps: [] }, SCHEMA_VERSION + 1);
  assert.equal(data.cards[0].priority, true);
});

test('profile: known fields only, theme falls back to system', () => {
  assert.deepEqual(normalizeProfile({ introSeen: true, termsAcceptedVersion: '1.1', theme: 'neon', x: 1 }), {
    introSeen: true,
    termsAcceptedVersion: '1.1',
    termsAcceptedAt: null,
    theme: 'system',
  });
  assert.equal(normalizeProfile([]), null);
  assert.equal(normalizeProfile('dark'), null);
});
