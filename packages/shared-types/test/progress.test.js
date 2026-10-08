// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canFinishQuest,
  canMarkNoteDone,
  getCardProgress,
  getStepProgress,
  getTopLevelSteps,
  isQuest,
  isStepDone,
} from '../src/progress.js';

const step = (id, props = {}) => ({ id, cardId: 'clean', parentId: null, text: id, done: false, order: 0, ...props });

const cleaning = [
  step('kitchen', { order: 0 }),
  step('dishes', { parentId: 'kitchen', done: true, order: 0 }),
  step('stove', { parentId: 'kitchen', done: true, order: 1 }),
  step('bath', { order: 1 }),
  step('sink', { parentId: 'bath', done: true, order: 0 }),
  step('toilet', { parentId: 'bath', order: 1 }),
  step('floor', { order: 2, done: true }),
];

test('top-level steps are sorted by order', () => {
  assert.deepEqual(
    getTopLevelSteps(cleaning, 'clean').map((s) => s.id),
    ['kitchen', 'bath', 'floor'],
  );
});

test('parent is done only when all children are done', () => {
  assert.equal(isStepDone(cleaning[0], cleaning), true);
  assert.equal(isStepDone(cleaning[3], cleaning), false);
});

test('parent ignores its own done flag', () => {
  const steps = [step('a', { done: true }), step('a1', { parentId: 'a' })];
  assert.equal(isStepDone(steps[0], steps), false);
});

test('partial progress of a parent step', () => {
  assert.deepEqual(getStepProgress(cleaning[3], cleaning), { done: 1, total: 2 });
});

test('card progress counts top-level steps only', () => {
  assert.deepEqual(getCardProgress('clean', cleaning), { done: 2, total: 3 });
});

test('finish rules', () => {
  assert.equal(canFinishQuest({ done: 2, total: 3 }), false);
  assert.equal(canFinishQuest({ done: 3, total: 3 }), true);
  assert.equal(canFinishQuest({ done: 0, total: 0 }), false);
  assert.equal(canMarkNoteDone({ done: 0, total: 0 }), true);
  assert.equal(canMarkNoteDone({ done: 0, total: 1 }), false);
  assert.equal(isQuest({ done: 0, total: 1 }), true);
});

test('note without steps has empty progress', () => {
  assert.deepEqual(getCardProgress('other', cleaning), { done: 0, total: 0 });
});
