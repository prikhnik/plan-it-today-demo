import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDayCards, getPlannerCards, isOnPlanner, shouldReopen } from '../src/cards.js';

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

test('done card reopens only when its steps are incomplete', () => {
  const done = card('q', { status: 'done', completedAt: TODAY });
  assert.equal(shouldReopen(done, { done: 2, total: 3 }), true);
  assert.equal(shouldReopen(done, { done: 3, total: 3 }), false);
  assert.equal(shouldReopen(done, { done: 0, total: 0 }), false);
  assert.equal(shouldReopen(card('a'), { done: 0, total: 3 }), false);
});

test('day cards: active only, exact day, newest first', () => {
  const cards = [
    card('old', { date: '2026-10-09', createdAt: '2026-10-08T08:00:00.000Z' }),
    card('new', { date: '2026-10-09', createdAt: '2026-10-08T10:00:00.000Z' }),
    card('done', { date: '2026-10-09', status: 'done', completedAt: TODAY }),
    card('other', { date: '2026-10-10' }),
  ];
  assert.deepEqual(getDayCards(cards, '2026-10-09').map((c) => c.id), ['new', 'old']);
});
