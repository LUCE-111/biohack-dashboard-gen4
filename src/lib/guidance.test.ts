import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultWorkSettings } from '../data/settings.ts';
import { getCaffeineReferenceTime, getGuidanceItems } from './guidance.ts';

test('caffeine reference is derived from the planned sleep opportunity', () => {
  assert.equal(getCaffeineReferenceTime(defaultWorkSettings, 'night'), '01:45');
});

test('night guidance distinguishes conditional and general principles', () => {
  const items = getGuidanceItems('night', defaultWorkSettings);
  assert.ok(items.some((item) => item.evidence === 'conditional'));
  assert.ok(items.some((item) => item.evidence === 'general'));
});
