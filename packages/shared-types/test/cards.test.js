import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPlannerCards, isOnPlanner } from '../src/cards.js';

const TODAY = '2026-10-08';
const card = (id, props = {}) => ({
  id, title: id, date: TODAY, status: 'active', source: 'manual', completedAt: null, createdAt: '2026-10-08T09:00:00.000Z', ...props,
});

test('active cards of today and past days are on the planner', () => {
  assert.equal(isOnPlanner(card('today'), TODAY), true);
  assert.equal(isOnPlanner(card('yesterday', { date: '2026-10-07' }), TODAY), true);
  assert.equal(isOnPlanner(card('tomorrow', { date: '2026-10-09' }), TODAY), false);
});

test('done cards stay only on the day they were completed', () => {
  assert.equal(isOnPlanner(card('a', { status: 'done', completedAt: TODAY }), TODAY), true);
  assert.equal(isOnPlanner(card('b', { status: 'done', completedAt: '2026-10-07' }), TODAY), false);
  assert.equal(isOnPlanner(card('c', { status: 'done', date: '2026-10-05', completedAt: TODAY }), TODAY), true);
});

test('active newest first, done at the bottom', () => {
  const cards = [
    card('done', { status: 'done', completedAt: TODAY, createdAt: '2026-10-08T12:00:00.000Z' }),
    card('old', { createdAt: '2026-10-07T09:00:00.000Z', date: '2026-10-07' }),
    card('new', { createdAt: '2026-10-08T11:00:00.000Z' }),
    card('future', { date: '2026-10-10' }),
  ];
  assert.deepEqual(getPlannerCards(cards, TODAY).map((c) => c.id), ['new', 'old', 'done']);
});
