import assert from 'node:assert/strict';
import test from 'node:test';
import { parsePersistedState, SCHEMA_VERSION } from './persistence.ts';

test('legacy Gen 4 state migrates to schema version 2', () => {
  const legacy = JSON.stringify({
    mode: 'night',
    offDay: 2,
    checkedTaskIds: ['2026-08-28_night_1'],
  });
  const state = parsePersistedState(legacy);

  assert.equal(state.schemaVersion, SCHEMA_VERSION);
  assert.equal(state.mode, 'night');
  assert.equal(state.offDay, 2);
  assert.equal(state.workSettings.night.workStart, '17:40');
});

test('invalid persisted values fall back to safe defaults', () => {
  const state = parsePersistedState(JSON.stringify({ mode: 'invalid', offDay: 9 }));
  assert.equal(state.mode, 'day');
  assert.equal(state.offDay, 1);
  assert.equal(state.pendingWorkSettings, null);
});
