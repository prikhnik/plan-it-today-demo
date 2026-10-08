// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GREETING_PHRASES, pickPhraseIndex } from '../src/data/greeting-phrases.js';

test('pool has 20 phrases without the missing Neucha apostrophe', () => {
  assert.equal(GREETING_PHRASES.length, 20);
  assert.equal(
    GREETING_PHRASES.some((phrase) => phrase.includes('ʼ')),
    false,
  );
});

test('never repeats the previous launch', () => {
  for (let last = 0; last < 20; last += 1) {
    for (const random of [0, 0.5, 0.999]) {
      assert.notEqual(
        pickPhraseIndex(20, last, () => random),
        last,
      );
    }
  }
});

test('every other phrase can be picked', () => {
  const picked = new Set();
  for (let step = 0; step < 19; step += 1) picked.add(pickPhraseIndex(20, 3, () => step / 19));
  assert.equal(picked.size, 19);
  assert.equal(picked.has(3), false);
});

test('without a previous launch any phrase can come', () => {
  assert.equal(
    pickPhraseIndex(20, null, () => 0),
    0,
  );
  assert.equal(
    pickPhraseIndex(20, 'garbage', () => 0.999),
    19,
  );
});
