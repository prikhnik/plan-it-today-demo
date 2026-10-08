// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scrubEvent } from '../src/core/monitoring.js';

test('user texts are removed everywhere in the event', () => {
  const event = {
    message: 'Cannot read "Подзвонити в банк"',
    exception: { values: [{ value: 'step Знайти номер failed' }] },
    breadcrumbs: [
      { category: 'ui.click', message: 'button.note' },
      { category: 'console', message: 'Подзвонити в банк' },
    ],
    extra: { title: 'Подзвонити в банк', quoted: 'say "hi"' },
  };
  const scrubbed = scrubEvent(event, ['Подзвонити в банк', 'Знайти номер', 'say "hi"', 'x']);
  const json = JSON.stringify(scrubbed);
  assert.equal(json.includes('Подзвонити'), false);
  assert.equal(json.includes('Знайти номер'), false);
  assert.equal(json.includes('hi'), false);
  assert.deepEqual(
    scrubbed.breadcrumbs.map((crumb) => crumb.category),
    ['ui.click'],
  );
  assert.equal(scrubbed.exception.values[0].value, 'step [текст] failed');
});

test('longer texts are replaced before their parts', () => {
  const scrubbed = scrubEvent({ message: 'Купити хліб і молоко' }, ['Купити хліб', 'Купити хліб і молоко']);
  assert.equal(scrubbed.message, '[текст]');
});
