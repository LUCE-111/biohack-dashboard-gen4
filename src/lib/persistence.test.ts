import assert from 'node:assert/strict';
import test from 'node:test';
import { parsePersistedState, SCHEMA_VERSION } from './persistence.ts';

test('legacy Gen 4 state migrates to schema version 4', () => {
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
  assert.equal(state.workSettings.night.preShiftPrepMinutes, 40);
  assert.equal(state.workSettings.night.commuteFromTransport, 'drive');
  assert.equal(state.rosterSettings.activeVersionId, null);
  assert.equal(state.rosterSettings.autoMode, true);
});

test('Gen 4.1 work settings retain commute times and receive later transition defaults', () => {
  const gen41 = JSON.stringify({
    schemaVersion: 2,
    mode: 'day',
    offDay: 1,
    checkedTaskIds: ['day_2026-08-28_day-work-am'],
    workSettings: {
      day: { workStart: '08:00', workEnd: '18:30', commuteToMinutes: 45, commuteFromMinutes: 50 },
      night: { workStart: '18:00', workEnd: '08:30', commuteToMinutes: 55, commuteFromMinutes: 65 },
    },
    pendingWorkSettings: null,
  });
  const state = parsePersistedState(gen41);

  assert.equal(state.workSettings.day.workStart, '08:00');
  assert.equal(state.workSettings.day.commuteToMinutes, 45);
  assert.equal(state.workSettings.day.preShiftPrepMinutes, 45);
  assert.equal(state.workSettings.night.commuteFromMinutes, 65);
  assert.equal(state.workSettings.night.postNapBufferMinutes, 20);
  assert.deepEqual(state.checkedTaskIds, ['day_2026-08-28_day-work-am']);
});

test('invalid persisted values fall back to safe defaults', () => {
  const state = parsePersistedState(JSON.stringify({ mode: 'invalid', offDay: 9 }));
  assert.equal(state.mode, 'day');
  assert.equal(state.offDay, 1);
  assert.equal(state.pendingWorkSettings, null);
});
