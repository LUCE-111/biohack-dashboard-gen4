import assert from 'node:assert/strict';
import test from 'node:test';
import { schedules } from './schedules.ts';
import { defaultWorkSettings } from './settings.ts';
import { supplements } from './supplements.ts';
import {
  getScheduleChanges,
  getSleepOpportunity,
  getTransitionSnapshot,
  resolveSchedule,
  validateWorkSettings,
} from '../lib/schedule.ts';
import { parseTimeToMinutes } from '../lib/time.ts';

const supplementIds = new Set(supplements.map((supplement) => supplement.id));

test('every schedule contains tasks with unique ids and valid time values', () => {
  for (const schedule of Object.values(schedules)) {
    assert.ok(schedule.tasks.length > 0, `${schedule.key} should not be empty`);
    const ids = new Set<string>();
    for (const task of schedule.tasks) {
      assert.doesNotThrow(() => parseTimeToMinutes(task.start));
      assert.doesNotThrow(() => parseTimeToMinutes(task.end));
      assert.equal(ids.has(task.id), false, `Duplicate task id ${task.id}`);
      ids.add(task.id);
    }
  }
});

test('every referenced supplement exists in supplement master data', () => {
  for (const schedule of Object.values(schedules)) {
    for (const task of schedule.tasks) {
      for (const id of task.supplementIds ?? []) {
        assert.equal(supplementIds.has(id), true, `Unknown supplement ${id} in ${schedule.key}`);
      }
    }
  }
});

test('all roster-aware schedule variants are represented', () => {
  assert.deepEqual(Object.keys(schedules).sort(), ['day', 'irregular', 'night', 'nightRecovery1', 'nightRecovery2', 'nightToDay1', 'nightToDay2', 'nightToDay3', 'off1', 'off2', 'off3', 'recovery', 'rest']);
});

test('day preparation, commute and post-shift blocks recalculate from settings', () => {
  const settings = {
    ...defaultWorkSettings,
    day: {
      ...defaultWorkSettings.day,
      workStart: '08:00',
      workEnd: '18:30',
      preShiftPrepMinutes: 40,
      departureBufferMinutes: 10,
      commuteToMinutes: 45,
      postShiftPrepMinutes: 15,
      commuteFromMinutes: 50,
      postCommuteWindDownMinutes: 20,
    },
  };
  const schedule = resolveSchedule('day', settings);
  const prep = schedule.tasks.find((task) => task.id === 'day-wake');
  const buffer = schedule.tasks.find((task) => task.id === 'day-departure-buffer');
  const commuteIn = schedule.tasks.find((task) => task.id === 'day-commute-in');
  const postShift = schedule.tasks.find((task) => task.id === 'day-postshift-prep');
  const commuteOut = schedule.tasks.find((task) => task.id === 'day-commute-out');
  const windDown = schedule.tasks.find((task) => task.id === 'day-winddown');

  assert.equal(prep?.start, '06:25');
  assert.equal(prep?.end, '07:05');
  assert.equal(buffer?.start, '07:05');
  assert.equal(buffer?.end, '07:15');
  assert.equal(commuteIn?.start, '07:15');
  assert.equal(commuteIn?.end, '08:00');
  assert.equal(postShift?.start, '18:30');
  assert.equal(postShift?.end, '18:45');
  assert.equal(commuteOut?.start, '18:45');
  assert.equal(commuteOut?.end, '19:35');
  assert.equal(windDown?.end, '19:55');
  assert.ok(getScheduleChanges(schedules.day, schedule).length > 0);
});

test('night nap buffer and departure chain remain ordered', () => {
  const schedule = resolveSchedule('night', defaultWorkSettings);
  const napBuffer = schedule.tasks.find((task) => task.id === 'night-nap-buffer');
  const prep = schedule.tasks.find((task) => task.id === 'night-prep');
  const departureBuffer = schedule.tasks.find((task) => task.id === 'night-departure-buffer');
  const commute = schedule.tasks.find((task) => task.id === 'night-commute-in');

  assert.equal(napBuffer?.end, '15:50');
  assert.equal(prep?.start, '15:50');
  assert.equal(prep?.end, '16:30');
  assert.equal(departureBuffer?.end, '16:40');
  assert.equal(commute?.end, '17:40');
});

test('transition snapshot separates preparation and travel', () => {
  const snapshot = getTransitionSnapshot(defaultWorkSettings, 'night');
  assert.equal(snapshot.prepStart, '15:50');
  assert.equal(snapshot.departureTime, '16:40');
  assert.equal(snapshot.homeArrivalTime, '09:15');
  assert.equal(snapshot.windDownEndTime, '09:45');
});

test('sleep opportunity accounts for preparation and post-commute wind-down', () => {
  const night = getSleepOpportunity(defaultWorkSettings, 'night');
  assert.equal(night.start, '09:45');
  assert.equal(night.end, '15:50');
  assert.equal(night.durationMinutes, 365);
});

test('settings validation blocks hard schedule conflicts', () => {
  const settings = {
    ...defaultWorkSettings,
    day: {
      ...defaultWorkSettings.day,
      workStart: '12:30',
    },
  };
  assert.ok(validateWorkSettings(settings).some((issue) => issue.shift === 'day'));
});

test('night preparation cannot overlap post-nap recovery buffer', () => {
  const settings = {
    ...defaultWorkSettings,
    night: {
      ...defaultWorkSettings.night,
      postNapBufferMinutes: 60,
    },
  };
  assert.ok(validateWorkSettings(settings).some((issue) => issue.message.includes('낮잠 후 회복 버퍼')));
});

test('temporarily empty time inputs report validation issues without crashing preview resolution', () => {
  const settings = {
    ...defaultWorkSettings,
    day: {
      ...defaultWorkSettings.day,
      workStart: '',
    },
  };

  assert.ok(validateWorkSettings(settings).some((issue) => issue.shift === 'day'));
  assert.doesNotThrow(() => resolveSchedule('day', settings));
});
