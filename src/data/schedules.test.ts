import assert from 'node:assert/strict';
import test from 'node:test';
import { schedules } from './schedules.ts';
import { defaultWorkSettings } from './settings.ts';
import { supplements } from './supplements.ts';
import { getScheduleChanges, resolveSchedule, validateWorkSettings } from '../lib/schedule.ts';
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

test('all six source schedule variants are represented', () => {
  assert.deepEqual(Object.keys(schedules).sort(), ['day', 'night', 'off1', 'off2', 'off3', 'recovery']);
});

test('day commute and work blocks recalculate from settings', () => {
  const settings = {
    ...defaultWorkSettings,
    day: {
      workStart: '08:00',
      workEnd: '18:30',
      commuteToMinutes: 45,
      commuteFromMinutes: 50,
    },
  };
  const schedule = resolveSchedule('day', settings);
  const commuteIn = schedule.tasks.find((task) => task.id === 'day-commute-in');
  const commuteOut = schedule.tasks.find((task) => task.id === 'day-commute-out');

  assert.equal(commuteIn?.start, '07:15');
  assert.equal(commuteIn?.end, '08:00');
  assert.equal(commuteOut?.start, '18:30');
  assert.equal(commuteOut?.end, '19:20');
  assert.ok(getScheduleChanges(schedules.day, schedule).length > 0);
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
