// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareVersions, getOnboardingStep } from '../src/onboarding.js';

test('versions compare numerically', () => {
  assert.equal(compareVersions('1.10', '1.9'), 1);
  assert.equal(compareVersions('1.0', '1'), 0);
  assert.equal(compareVersions('1.0', '1.1'), -1);
});

test('first launch shows intro', () => {
  assert.equal(getOnboardingStep(null, '1.0'), 'intro');
  assert.equal(getOnboardingStep({ introSeen: false, termsAcceptedVersion: null }, '1.0'), 'intro');
});

test('intro seen, terms not accepted shows terms', () => {
  assert.equal(getOnboardingStep({ introSeen: true, termsAcceptedVersion: null }, '1.0'), 'terms');
});

test('accepted current version skips onboarding', () => {
  assert.equal(getOnboardingStep({ introSeen: true, termsAcceptedVersion: '1.0' }, '1.0'), 'done');
});

test('new terms version shows terms only', () => {
  assert.equal(getOnboardingStep({ introSeen: true, termsAcceptedVersion: '1.0' }, '1.1'), 'terms');
});
